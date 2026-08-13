"""Groq integration: Whisper transcription and LLM narrative reporting.

Both calls are best-effort. Every failure path returns a structured
"unavailable" payload with a reason rather than raising, so a network problem
or an expired key degrades the report instead of failing the assessment.
"""

import io
import json
import logging
import wave

import httpx
import numpy as np

from backend.config import settings

log = logging.getLogger(__name__)

TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

# Whisper bills by audio duration and the UI records short reflections; this
# also bounds worst-case latency on the assessment request.
MAX_SECONDS = 120

# Used when the primary model returns malformed JSON.
JSON_FALLBACK_MODEL = "openai/gpt-oss-120b"


def pcm_to_wav_bytes(samples: np.ndarray, sample_rate: int = 16000) -> bytes:
    """Wrap mono float32 samples (-1..1) in a RIFF/WAVE container.

    Required because the browser recorder captures headerless raw PCM, which
    Whisper cannot decode — it needs a real container to detect format and
    sample rate.
    """
    clipped = np.clip(np.asarray(samples, dtype=np.float32), -1.0, 1.0)
    pcm16 = (clipped * 32767.0).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm16.tobytes())
    return buf.getvalue()


def transcribe(samples: np.ndarray, sample_rate: int = 16000) -> dict:
    """Speech-to-text via Groq Whisper."""
    if not settings.groq_stt_ready:
        return {"available": False, "reason": "Transcription is disabled (no Groq STT key configured)."}

    n = int(np.asarray(samples).size)
    if n < sample_rate // 2:
        return {"available": False, "reason": "Clip too short to transcribe (under half a second)."}

    trimmed = np.asarray(samples)[: sample_rate * MAX_SECONDS]
    wav = pcm_to_wav_bytes(trimmed, sample_rate)

    try:
        r = httpx.post(
            TRANSCRIBE_URL,
            headers={"Authorization": f"Bearer {settings.groq_stt_api_key}"},
            files={"file": ("speech.wav", wav, "audio/wav")},
            data={"model": settings.groq_stt_model, "response_format": "json"},
            timeout=settings.groq_timeout_seconds,
        )
        r.raise_for_status()
        text = (r.json().get("text") or "").strip()
    except Exception as exc:
        log.warning("Groq transcription failed: %s", exc)
        return {"available": False, "reason": f"Transcription unavailable ({type(exc).__name__})."}

    if not text:
        return {"available": False, "reason": "No speech detected in the recording."}

    return {
        "available": True,
        "text": text,
        "word_count": len(text.split()),
        "duration_seconds": round(len(trimmed) / sample_rate, 1),
        "model": settings.groq_stt_model,
    }


SYSTEM_PROMPT = """You are a clinical-support writing assistant for MindScan AI, a \
multimodal mental-health *screening* tool. You are not a clinician and must not \
diagnose.

Ground every claim in the evidence you are given. If the transcript is empty or \
thin, say so plainly rather than inventing detail about the person's day. Never \
state or imply a diagnosis, and never contradict the crisis guidance the app has \
already shown.

Write in warm, plain, second-person English ("you"). Be specific and concrete, \
never florid. Avoid clinical jargon unless you immediately explain it.

Reply with ONE json object and nothing else. Every value must be a \
double-quoted string, or an array of double-quoted strings. Copy this shape \
exactly, replacing only the placeholder text:

{
  "day_summary": "2-3 sentences on what they described about their day, drawn only from the transcript. If there is no transcript, say so directly.",
  "language_signals": ["specific observation from their WORDS", "another", "another"],
  "mood_reading": "2-3 sentences reconciling what they said with what the face and voice models measured. Name any disagreement rather than smoothing it over.",
  "recommendations": ["short concrete low-effort step", "another", "another"],
  "motivation": "2-3 warm, non-patronising sentences. Acknowledge difficulty honestly; no toxic positivity, no promises about outcomes."
}"""


def generate_report(
    transcript: dict,
    scores: dict,
    status: str,
    facial: dict | None,
    speech: dict | None,
    numerical_drivers: list | None,
    crisis_flagged: bool,
) -> dict:
    """LLM narrative report combining the transcript with model output."""
    if not settings.groq_llm_ready:
        return {"available": False, "reason": "AI report is disabled (no Groq LLM key configured)."}

    evidence = {
        "transcript": transcript.get("text") if transcript.get("available") else None,
        "screening_scores": {
            "depression": f"{scores['depression']:.1f} / 34",
            "anxiety": f"{scores['anxiety']:.1f} / 24",
            "stress": f"{scores['stress']:.1f} / 39",
        },
        "overall_status": status.replace("_", " "),
        "facial_model": (
            {"detected": facial.get("detected_emotion"), "confidence_pct": facial.get("confidence")}
            if facial and facial.get("available")
            else "not submitted"
        ),
        "voice_model": (
            {"detected": speech.get("detected_status"), "confidence_pct": speech.get("confidence")}
            if speech and speech.get("available")
            else "not submitted"
        ),
        "top_self_reported_factors": [
            {"factor": d["label"], "effect": d["effect"]} for d in (numerical_drivers or [])[:5]
        ],
        "crisis_resources_already_shown": crisis_flagged,
    }

    # Llama occasionally emits malformed JSON (unquoted string values), which
    # Groq rejects with json_validate_failed. Retry once on a model that is
    # stronger at structured output before giving up.
    attempts = [settings.groq_llm_model]
    if JSON_FALLBACK_MODEL not in attempts:
        attempts.append(JSON_FALLBACK_MODEL)

    parsed = None
    last_reason = "AI report unavailable."
    for model in attempts:
        try:
            r = httpx.post(
                CHAT_URL,
                headers={
                    "Authorization": f"Bearer {settings.groq_llm_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": json.dumps(evidence, indent=2)},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 900,
                    "response_format": {"type": "json_object"},
                },
                timeout=settings.groq_timeout_seconds,
            )
            if r.status_code >= 400:
                # Surface the provider's own message; a bare 400 is unactionable.
                log.warning("Groq report HTTP %s on %s: %s", r.status_code, model, r.text[:400])
                last_reason = f"AI report unavailable (HTTP {r.status_code})."
                continue
            parsed = json.loads(r.json()["choices"][0]["message"]["content"])
            used_model = model
            break
        except Exception as exc:
            log.warning("Groq report failed on %s: %s", model, exc)
            last_reason = f"AI report unavailable ({type(exc).__name__})."

    if parsed is None:
        return {"available": False, "reason": last_reason}

    def _text(key):
        v = parsed.get(key)
        return v.strip() if isinstance(v, str) else None

    def _list(key):
        v = parsed.get(key)
        return [str(i).strip() for i in v][:6] if isinstance(v, list) else []

    return {
        "available": True,
        "model": used_model,
        "day_summary": _text("day_summary"),
        "language_signals": _list("language_signals"),
        "mood_reading": _text("mood_reading"),
        "recommendations": _list("recommendations"),
        "motivation": _text("motivation"),
        "disclaimer": "AI-generated summary of screening signals. Not a diagnosis.",
    }
