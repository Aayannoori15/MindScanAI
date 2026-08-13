from pathlib import Path

import numpy as np

from backend.config import settings
from backend.core.dataset_spec import STATUS_LABELS


class MockEncoder:
    """Deterministic fallback when teammate weights are not yet placed."""

    def __init__(self, name: str, out_dim: int):
        self.name = name
        self.out_dim = out_dim
        self.rng = np.random.default_rng(abs(hash(name)) % (2**32))

    def encode(self, features: np.ndarray) -> np.ndarray:
        flat = np.asarray(features, dtype=np.float32).reshape(-1)
        if flat.size == 0:
            flat = np.zeros(8, dtype=np.float32)
        seed = int(np.abs(flat.mean() * 1000 + flat.std() * 100)) % (2**32)
        rng = np.random.default_rng(seed)
        vec = rng.normal(0, 1, self.out_dim).astype(np.float32)
        n = np.linalg.norm(vec) + 1e-8
        return vec / n


class ModelRegistry:
    def __init__(self):
        self.ready = False
        self.using_mock = True
        self.loaded: dict[str, Path] = {}
        self.facial_encoder = MockEncoder("facial", 128)
        self.speech_encoder = MockEncoder("speech", 128)
        self.numerical_dim = 18

    def load(self) -> None:
        root = settings.models_path
        expected = {
            "classifier": root / "classification" / "mental_health_classifier.pt",
            "facial_encoder": root / "classification" / "facial_encoder.pt",
            "speech_encoder": root / "classification" / "speech_encoder.pt",
            "depression": root / "regression" / "depression_regressor.pt",
            "anxiety": root / "regression" / "anxiety_regressor.pt",
            "stress": root / "regression" / "stress_regressor.pt",
            "fusion": root / "fusion" / "multimodal_fusion.pt",
        }
        present = {k: p for k, p in expected.items() if p.exists()}
        self.loaded = present
        self.using_mock = settings.use_mock_inference or len(present) < len(expected)
        if not self.using_mock:
            self._load_torch(present)
        self.ready = True

    def _load_torch(self, present: dict[str, Path]) -> None:
        try:
            import torch

            self.torch_models = {k: torch.load(p, map_location="cpu") for k, p in present.items()}
        except Exception:
            self.using_mock = True
            self.torch_models = {}


registry = ModelRegistry()
