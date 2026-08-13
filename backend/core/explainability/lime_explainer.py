def lime_speech(quality: dict, language_hint: str | None = None) -> dict:
    flags = quality.get("flags", [])
    ravdess = quality.get("ravdess")
    cues = [
        {"feature": "Pitch_Mean", "weight": 0.18, "note": "Average pitch (Hz) — RAVDESS / tabular Pitch_Mean."},
        {"feature": "Speech_Rate", "weight": 0.14, "note": "Words / onsets per second — tabular Speech_Rate."},
        {"feature": "MFCC_Mean", "weight": 0.16, "note": "Mean Mel-frequency cepstral coefficient."},
        {"feature": "MFCC_Variance", "weight": 0.12, "note": "MFCC variance; higher flux can mark strain."},
        {"feature": "energy_contour", "weight": 0.11, "note": "Uneven loudness is a common stress marker."},
    ]
    note = "Prosody-first explanation aligned with RAVDESS (8 emotions) and the tabular MFCC/pitch/rate columns."
    if ravdess and ravdess.get("emotion"):
        note += f" Filename maps to {ravdess['emotion']} → {ravdess.get('mapped_status')}."
    return {
        "available": "missing_speech" not in flags,
        "language_mode": language_hint or "language-agnostic",
        "note": note,
        "cues": cues,
        "quality_flags": flags,
        "ravdess": ravdess,
        "extracted": {
            k: quality.get(k)
            for k in ("MFCC_Mean", "MFCC_Variance", "Pitch_Mean", "Speech_Rate")
            if k in quality
        },
    }
