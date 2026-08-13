import numpy as np

from backend.core.dataset_spec import FEATURE_STATS, NUMERICAL_FEATURE_KEYS
from backend.database.schemas import NumericalFeatures


def preprocess_numerical(features: NumericalFeatures | None) -> tuple[np.ndarray, dict]:
    if features is None:
        return np.zeros(18, dtype=np.float32), {"quality": 0.0, "flags": ["missing_numerical"]}

    data = features.model_dump()
    vec = []
    for key in NUMERICAL_FEATURE_KEYS:
        mean, std = FEATURE_STATS[key]
        vec.append((data[key] - mean) / (std + 1e-8))
    arr = np.asarray(vec, dtype=np.float32)
    return arr, {"quality": 0.95, "flags": [], "raw": data}
