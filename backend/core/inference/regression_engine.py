import numpy as np

from backend.core.dataset_spec import SCORE_MAX


def _clip(v: float, lo: float, hi: float) -> float:
    return float(np.clip(v, lo, hi))


def estimate_scores(num: np.ndarray, facial: np.ndarray, speech: np.ndarray) -> dict[str, float]:
    """Questionnaire-style scores: depression 0–34, anxiety 0–24, stress 0–39."""
    n = num if num.size == 18 else np.zeros(18)
    sleep_q, social = n[0], n[1]
    app, _wpm, sessions, idle = n[2], n[3], n[4], n[5]
    face_var, blink, smile, head = n[6], n[7], n[8], n[9]
    _mfcc_m, mfcc_v, pitch, rate = n[10], n[11], n[12], n[13]
    hr, hrv, _temp, gsr = n[14], n[15], n[16], n[17]

    face_load = float(np.abs(facial).mean()) if facial.size else 0.3
    speech_load = float(np.abs(speech).mean()) if speech.size else 0.3

    depression = (
        12
        + (-sleep_q) * 3.4
        + (-social) * 2.8
        + idle * 2.2
        + (-smile) * 3.0
        + face_load * 5
    )
    anxiety = (
        8
        + blink * 2.1
        + gsr * 1.8
        + (-hrv) * 1.7
        + hr * 1.2
        + pitch * 1.1
        + speech_load * 3.0
    )
    stress = (
        14
        + app * 1.8
        + sessions * 1.4
        + head * 1.6
        + face_var * 1.5
        + mfcc_v * 1.1
        + rate * 0.8
        + speech_load * 4
        + face_load * 3
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
