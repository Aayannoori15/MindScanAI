from pathlib import Path

import numpy as np
import torch

from backend.config import settings
from backend.models.architectures import FacialEncoder, SpeechEncoder


class MockEncoder:
    """Deterministic fallback when trained weights are not yet placed."""

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


class TorchEncoder:
    """Wraps a trained FacialEncoder/SpeechEncoder to match MockEncoder's .encode() contract."""

    def __init__(self, model: torch.nn.Module, device: torch.device):
        self.model = model
        self.device = device

    def encode(self, features: np.ndarray) -> np.ndarray:
        x = torch.from_numpy(np.asarray(features, dtype=np.float32)).unsqueeze(0).to(self.device)
        with torch.no_grad():
            emb = self.model.encode(x)
        return emb.squeeze(0).cpu().numpy()


class ModelRegistry:
    """Loads the trained facial/speech encoders (training/train_facial.py,
    training/train_speech.py) when present.

    The 4-class status and depression/anxiety/stress scores stay on the
    hand-crafted heuristic engine (backend/core/inference/) rather than a
    trained classifier/regressor: the accompanying tabular dataset
    (dataset/mental_health_multimodal.csv) was benchmarked with both linear
    correlation and a random forest, and its 18 feature columns carry no
    measurable relationship to Mental_Health_Status or the D/A/S scores — a
    model trained on it would just fit noise and land at/below a
    majority-class or mean-value baseline. training/train_fusion.py is kept
    for if a genuinely labeled tabular dataset becomes available later.
    """

    def __init__(self):
        self.ready = False
        self.using_mock = True
        self.loaded: dict[str, Path] = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.facial_encoder = MockEncoder("facial", 128)
        self.speech_encoder = MockEncoder("speech", 128)
        self.numerical_dim = 18

    def load(self) -> None:
        root = settings.models_path
        expected = {
            "facial_encoder": root / "classification" / "facial_encoder.pt",
            "speech_encoder": root / "classification" / "speech_encoder.pt",
        }
        present = {k: p for k, p in expected.items() if p.exists()}
        self.loaded = present
        self.using_mock = settings.use_mock_inference or len(present) < len(expected)
        if not self.using_mock:
            self._load_torch(present)
        self.ready = True

    def _load_torch(self, present: dict[str, Path]) -> None:
        try:
            facial = FacialEncoder()
            facial.load_state_dict(torch.load(present["facial_encoder"], map_location=self.device))
            facial.eval().to(self.device)

            speech = SpeechEncoder()
            speech.load_state_dict(torch.load(present["speech_encoder"], map_location=self.device))
            speech.eval().to(self.device)

            self.facial_encoder = TorchEncoder(facial, self.device)
            self.speech_encoder = TorchEncoder(speech, self.device)
        except Exception:
            self.using_mock = True
            self.facial_encoder = MockEncoder("facial", 128)
            self.speech_encoder = MockEncoder("speech", 128)


registry = ModelRegistry()
