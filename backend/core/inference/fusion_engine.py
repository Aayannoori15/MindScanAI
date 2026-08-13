import numpy as np


def fuse_modalities(
    facial: np.ndarray,
    speech: np.ndarray,
    numerical: np.ndarray,
    qualities: dict[str, float],
    used: list[str],
) -> tuple[np.ndarray, dict[str, float], dict[str, float]]:
    """Late fusion with quality-aware reweighting (mock attention)."""
    weights = {"facial": 0.0, "speech": 0.0, "numerical": 0.0}
    if "facial" in used:
        weights["facial"] = 0.34 * qualities.get("facial", 0.5)
    if "speech" in used:
        weights["speech"] = 0.33 * qualities.get("speech", 0.5)
    if "numerical" in used:
        weights["numerical"] = 0.33 * qualities.get("numerical", 0.5)

    total = sum(weights.values()) or 1.0
    weights = {k: v / total for k, v in weights.items()}

    parts = []
    if "facial" in used:
        parts.append(facial * weights["facial"])
    if "speech" in used:
        parts.append(speech * weights["speech"])
    if "numerical" in used:
        pad = np.zeros_like(facial) if facial.size else np.zeros(128)
        n = numerical
        if n.size < pad.size:
            n = np.pad(n, (0, pad.size - n.size))
        parts.append(n[: pad.size] * weights["numerical"])

    fused = np.sum(parts, axis=0) if parts else np.zeros(128, dtype=np.float32)

    confidence = {
        "facial": float(np.clip(qualities.get("facial", 0) * 100, 0, 99)),
        "speech": float(np.clip(qualities.get("speech", 0) * 100, 0, 99)),
        "numerical": float(np.clip(qualities.get("numerical", 0) * 100, 0, 99)),
    }
    return fused.astype(np.float32), weights, confidence
