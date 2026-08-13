import numpy as np

from backend.core.dataset_spec import SCORE_MAX


def _clip(v: float, lo: float, hi: float) -> float:
    return float(np.clip(v, lo, hi))


def estimate_scores(
    num: np.ndarray,
    facial: np.ndarray,
    speech: np.ndarray,
    face_distress: float | None = None,
    speech_distress: float | None = None,
) -> dict[str, float]:
    """Questionnaire-style scores: depression 0–34, anxiety 0–24, stress 0–39.

    `face_distress` / `speech_distress` are 0..1 scalars from the trained
    emotion classifiers (see ModelRegistry.predict_facial_emotion) -- higher
    means the model saw a more distressed expression/voice. When supplied they
    drive the facial/speech contribution, so smiling genuinely lowers the
    score. They fall back to a mean-of-embedding proxy only when no trained
    classifier is available (mock mode); that proxy is direction-less, which
    is why it is a last resort rather than the default.

    Z-scored inputs are clipped to +/-3 so a single out-of-distribution slider
    value can't dominate every term and saturate the result at its cap.
    """
    n = num if num.size == 18 else np.zeros(18)
    n = np.clip(n, -3.0, 3.0)
    sleep_q, social = n[0], n[1]
    app, _wpm, sessions, idle = n[2], n[3], n[4], n[5]
    face_var, blink, smile, head = n[6], n[7], n[8], n[9]
    _mfcc_m, mfcc_v, pitch, rate = n[10], n[11], n[12], n[13]
    hr, hrv, _temp, gsr = n[14], n[15], n[16], n[17]

    if face_distress is not None:
        face_load = float(face_distress)
    else:
        face_load = float(np.clip(np.abs(facial).mean(), 0, 1)) if facial.size else 0.3
    if speech_distress is not None:
        speech_load = float(speech_distress)
    else:
        speech_load = float(np.clip(np.abs(speech).mean(), 0, 1)) if speech.size else 0.3

    # facial/speech coefficients are larger than the per-feature tabular ones
    # because face_load/speech_load are bounded 0..1 directional distress
    # signals, not z-scores -- these weights set how much a visibly happy vs.
    # distressed face/voice can move each score.
    depression = (
        12
        + (-sleep_q) * 3.4
        + (-social) * 2.8
        + idle * 2.2
        + (-smile) * 3.0
        + face_load * 9
    )
    anxiety = (
        8
        + blink * 2.1
        + gsr * 1.8
        + (-hrv) * 1.7
        + hr * 1.2
        + pitch * 1.1
        + speech_load * 7
    )
    stress = (
        14
        + app * 1.8
        + sessions * 1.4
        + head * 1.6
        + face_var * 1.5
        + mfcc_v * 1.1
        + rate * 0.8
        + speech_load * 7
        + face_load * 6
    )

    return {
        "depression": _clip(depression, 0, SCORE_MAX["depression"]),
        "anxiety": _clip(anxiety, 0, SCORE_MAX["anxiety"]),
        "stress": _clip(stress, 0, SCORE_MAX["stress"]),
    }


def score_range(kind: str, value: float) -> str:
    if kind == "depression":
        bands = [(8, "Normal"), (16, "Mild"), (25, "Moderate"), (34, "Severe")]
    elif kind == "anxiety":
        bands = [(6, "Normal"), (12, "Mild"), (18, "Moderate"), (24, "Severe")]
    else:
        bands = [(9, "Normal"), (19, "Mild"), (29, "Moderate"), (39, "Severe")]
    for hi, label in bands:
        if value <= hi:
            return label
    return bands[-1][1]
