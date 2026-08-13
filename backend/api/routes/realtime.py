import json

from fastapi import APIRouter, File, UploadFile, WebSocket, WebSocketDisconnect

from backend.core.model_loader import registry
from backend.core.preprocessors.facial_preprocessor import preprocess_face

router = APIRouter()


@router.post("/analyze-face")
async def analyze_face(frame: UploadFile = File(...)):
    from backend.config import settings

    if not settings.neural_encoders_enabled:
        return {
            "available": False,
            "reason": "Face neural net is off on this host (memory).",
            "quality": 0.0,
            "flags": [],
        }
    image_bytes = await frame.read()
    face_t, quality = preprocess_face(image_bytes)
    pred = registry.predict_facial_emotion(face_t)
    if not pred:
        return {
            "available": False,
            "reason": "Trained facial encoder unavailable (mock mode).",
            "quality": quality.get("quality", 0.0),
            "flags": quality.get("flags", []),
        }
    return {
        "available": True,
        "emotions": pred["probabilities"],
        "dominant": pred["emotion"],
        "confidence": pred["confidence"],
        "mapped_status": pred["mapped_status"],
        "distress": pred["distress"],
        "quality": quality.get("quality", 0.0),
        "flags": quality.get("flags", []),
    }


@router.websocket("/ws")
async def realtime_emotion(ws: WebSocket):
    """Normalizes and smooths client-supplied emotion distributions.

    The client is expected to send real probabilities (from /analyze-face).
    A payload with no emotions is echoed back as unavailable -- this endpoint
    never invents a distribution to fill the gap.
    """
    await ws.accept()
    try:
        while True:
            raw = await ws.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_json({"error": "invalid_json"})
                continue

            emotions = payload.get("emotions") or {}
            if not emotions:
                await ws.send_json({"t": payload.get("t"), "emotions": {}, "dominant": None, "available": False})
                continue

            total = sum(emotions.values()) or 1.0
            probs = {k: v / total for k, v in emotions.items()}
            dominant = max(probs, key=probs.get)
            await ws.send_json(
                {"t": payload.get("t"), "emotions": probs, "dominant": dominant, "available": True}
            )
    except WebSocketDisconnect:
        return
