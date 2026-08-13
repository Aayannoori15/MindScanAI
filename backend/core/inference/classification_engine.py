import numpy as np

from backend.core.dataset_spec import SCORE_MAX, STATUS_LABELS


def classify_status(fused: np.ndarray, scores: dict[str, float], hints: list[str] | None = None) -> tuple[str, np.ndarray]:
    """4-class Mental_Health_Status: Healthy / Mild_Stress / Moderate_Stress / Severe_Stress."""
    d_n = scores["depression"] / SCORE_MAX["depression"]
    a_n = scores["anxiety"] / SCORE_MAX["anxiety"]
    s_n = scores["stress"] / SCORE_MAX["stress"]
    burden = 0.4 * d_n + 0.3 * a_n + 0.3 * s_n
    if fused.size:
        burden = 0.75 * burden + 0.25 * float(np.clip(np.tanh(fused.mean() * 2), 0, 1))

    # Optional emotion→status votes from FER / RAVDESS mappings
    if hints:
        vote = {"Healthy": 0, "Mild_Stress": 1, "Moderate_Stress": 2, "Severe_Stress": 3}
        idxs = [vote[h] for h in hints if h in vote]
        if idxs:
            burden = 0.65 * burden + 0.35 * (sum(idxs) / (len(idxs) * 3))

    if burden < 0.22:
        idx = 0
    elif burden < 0.42:
        idx = 1
    elif burden < 0.65:
        idx = 2
    else:
        idx = 3

    logits = np.array([-2.0, -1.0, 0.0, 1.0], dtype=np.float32)
    logits[idx] += 2.4
    logits = logits + np.array([0.15, 0.1, 0.05, 0.0], dtype=np.float32) * (1 - burden)
    exps = np.exp(logits - logits.max())
    probs = exps / exps.sum()
    return STATUS_LABELS[idx], probs
