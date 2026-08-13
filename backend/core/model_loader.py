from pathlib import Path

import numpy as np

from backend.config import settings
from backend.core.dataset_spec import (
    FER_EMOTIONS,
    FER_TO_STATUS,
    SCORE_MAX,
    STATUS_LABELS,
    STATUS_SEVERITY,
)

# Marker written by training/slim_speech_checkpoint.py. Slim checkpoints omit
# the frozen wav2vec2 weights, which from_pretrained() supplies at init.
SLIM_MARKER = "__mindscan_slim__"


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


def _import_torch():
    """Import torch only when weights are loaded, so uvicorn can bind first."""
    import torch

    return torch


class TorchEncoder:
    """Wraps a trained FacialEncoder/SpeechEncoder to match MockEncoder's .encode() contract."""

    def __init__(self, model, device):
        self.model = model
        self.device = device

    def encode(self, features: np.ndarray) -> np.ndarray:
        torch = _import_torch()
        x = torch.from_numpy(np.asarray(features, dtype=np.float32)).unsqueeze(0).to(self.device)
        with torch.no_grad():
            emb = self.model.encode(x)
        return emb.squeeze(0).cpu().numpy()

    def classify(self, features: np.ndarray) -> np.ndarray:
        """Class probabilities from the encoder's trained classifier head."""
        torch = _import_torch()
        x = torch.from_numpy(np.asarray(features, dtype=np.float32)).unsqueeze(0).to(self.device)
        with torch.no_grad():
            probs = torch.softmax(self.model(x), dim=1)
        return probs.squeeze(0).cpu().numpy()


class ModelRegistry:
    """Loads trained models when present, falling back to mocks/heuristics otherwise.

    Facial/speech encoders (training/train_facial.py, training/train_speech.py)
    are trained on real image/audio data (FER, RAVDESS) and gate `using_mock`.

    The 4-class status classifier and depression/anxiety/stress regressors
    (training/train_fusion.py) are a separate, independently-gated component:
    the ORIGINAL tabular dataset (dataset/mental_health_multimodal.csv) has no
    learnable relationship between its 18 features and its labels (verified via
    correlation + random forest — see docs/model_placement.md), so these are
    trained instead on dataset/mental_health_multimodal_synthetic_labels.csv,
    produced by training/generate_synthetic_labels.py: the same 18 real feature
    columns, with D/A/S scores and status regenerated from the app's own
    heuristic formulas (backend/core/inference/) plus noise. That means these
    models demonstrate the pipeline can learn a real relationship when one
    exists — they approximate the hand-crafted heuristic (with realistic
    noise/generalization error), not an externally validated clinical signal.
    If their checkpoint files aren't present, `predict_status`/`predict_scores`
    return None and callers (backend/api/routes/assessment.py) fall back to the
    heuristic engine directly.
    """

    def __init__(self):
        self.ready = False
        self.using_mock = True
        self.loaded: dict[str, Path] = {}
        self.device = None
        self.facial_encoder = MockEncoder("facial", 128)
        self.speech_encoder = MockEncoder("speech", 128)
        self.classifier = None
        self.regressors = {}
        self.numerical_dim = 18

    def load(self) -> None:
        torch = _import_torch()

        # Render (and most laptops) run CPU inference. Forcing CPU avoids a CUDA
        # init hang when pip installed the default GPU wheel.
        self.device = torch.device("cpu")
        root = settings.models_path
        encoder_paths = {
            "facial_encoder": root / "classification" / "facial_encoder.pt",
            "speech_encoder": root / "classification" / "speech_encoder.pt",
        }
        tabular_paths = {
            "classifier": root / "classification" / "mental_health_classifier.pt",
            "depression": root / "regression" / "depression_regressor.pt",
            "anxiety": root / "regression" / "anxiety_regressor.pt",
            "stress": root / "regression" / "stress_regressor.pt",
        }
        present_encoders = {k: p for k, p in encoder_paths.items() if p.exists()}
        present_tabular = {k: p for k, p in tabular_paths.items() if p.exists()}
        self.loaded = {**present_encoders, **present_tabular}

        self.using_mock = settings.use_mock_inference or len(present_encoders) < len(encoder_paths)
        if not self.using_mock:
            self._load_encoders(present_encoders)

        if not settings.use_mock_inference and len(present_tabular) == len(tabular_paths):
            self._load_tabular(present_tabular)

        self.ready = True

    def _load_encoders(self, present: dict[str, Path]) -> None:
        torch = _import_torch()
        from backend.models.architectures import FacialEncoder, SpeechEncoder

        try:
            facial = FacialEncoder(pretrained=False)
            facial.load_state_dict(torch.load(present["facial_encoder"], map_location=self.device))
            facial.eval().to(self.device)

            # num_classes must match the checkpoint's classifier head shape (unused by
            # .encode(), which only runs backbone+attn+embed, but load_state_dict is strict).
            speech = SpeechEncoder(num_classes=len(STATUS_LABELS))
            speech_ckpt = torch.load(present["speech_encoder"], map_location=self.device)
            if isinstance(speech_ckpt, dict) and speech_ckpt.get(SLIM_MARKER):
                # Slim checkpoint: only the fine-tuned layers and head were saved.
                # The frozen wav2vec2 weights already came from HuggingFace when
                # SpeechEncoder was constructed, so a partial load completes it.
                speech.load_state_dict(speech_ckpt["state"], strict=False)
            else:
                speech.load_state_dict(speech_ckpt)
            speech.eval().to(self.device)

            self.facial_encoder = TorchEncoder(facial, self.device)
            self.speech_encoder = TorchEncoder(speech, self.device)
        except Exception:
            self.using_mock = True
            self.facial_encoder = MockEncoder("facial", 128)
            self.speech_encoder = MockEncoder("speech", 128)

    def _load_tabular(self, present: dict[str, Path]) -> None:
        torch = _import_torch()
        from backend.models.architectures import ScoreRegressor, StatusClassifier

        try:
            classifier = StatusClassifier(num_classes=len(STATUS_LABELS))
            classifier.load_state_dict(torch.load(present["classifier"], map_location=self.device))
            classifier.eval().to(self.device)

            regressors = {}
            for name in ("depression", "anxiety", "stress"):
                reg = ScoreRegressor()
                reg.load_state_dict(torch.load(present[name], map_location=self.device))
                reg.eval().to(self.device)
                regressors[name] = reg

            self.classifier = classifier
            self.regressors = regressors
        except Exception:
            self.classifier = None
            self.regressors = {}

    def predict_status(self, numerical: np.ndarray) -> tuple[str, np.ndarray] | None:
        """Trained 4-class classifier prediction, or None to fall back to the heuristic."""
        if self.classifier is None:
            return None
        torch = _import_torch()
        x = torch.from_numpy(np.asarray(numerical, dtype=np.float32)).unsqueeze(0).to(self.device)
        with torch.no_grad():
            probs = torch.softmax(self.classifier(x), dim=1).squeeze(0).cpu().numpy()
        return STATUS_LABELS[int(probs.argmax())], probs

    def predict_scores(self, numerical: np.ndarray) -> dict[str, float] | None:
        """Trained depression/anxiety/stress regressor predictions, or None to fall back to the heuristic."""
        if not self.regressors:
            return None
        torch = _import_torch()
        x = torch.from_numpy(np.asarray(numerical, dtype=np.float32)).unsqueeze(0).to(self.device)
        scores = {}
        with torch.no_grad():
            for name, model in self.regressors.items():
                scores[name] = float(np.clip(model(x).item(), 0, 1)) * SCORE_MAX[name]
        return scores

    def predict_facial_emotion(self, face_tensor: np.ndarray) -> dict | None:
        """Real 7-class FER emotion prediction from the trained ResNet18 classifier head.

        Returns the emotion name, its confidence, the full probability
        distribution, and a `distress` scalar in 0..1 -- the probability mass
        the model puts on negative expressions, weighted by how severe
        FER_TO_STATUS considers each one. That scalar is what scoring should
        consume: unlike the old mean-of-embedding proxy it actually falls when
        the person smiles and rises when they look angry/afraid.
        """
        if self.using_mock or not isinstance(self.facial_encoder, TorchEncoder):
            return None
        probs = self.facial_encoder.classify(face_tensor)
        idx = int(probs.argmax())
        emotion = FER_EMOTIONS[idx]
        by_emotion = {FER_EMOTIONS[i]: float(p) for i, p in enumerate(probs)}
        distress = sum(by_emotion[e] * STATUS_SEVERITY[FER_TO_STATUS[e]] for e in by_emotion)
        return {
            "emotion": emotion,
            "confidence": float(probs[idx]),
            "probabilities": by_emotion,
            "mapped_status": FER_TO_STATUS[emotion],
            "distress": float(distress),
        }

    def predict_speech_emotion(self, speech_tensor: np.ndarray) -> dict | None:
        """Real emotion prediction from the trained wav2vec2 classifier head.

        The deployed speech checkpoint is trained on the 4 RAVDESS_TO_STATUS
        classes (Healthy/Mild/Moderate/Severe), not the 8 raw emotions, so the
        head's outputs are read directly as status probabilities.
        """
        if self.using_mock or not isinstance(self.speech_encoder, TorchEncoder):
            return None
        probs = self.speech_encoder.classify(speech_tensor)
        if len(probs) != len(STATUS_LABELS):
            return None
        idx = int(probs.argmax())
        by_status = {STATUS_LABELS[i]: float(p) for i, p in enumerate(probs)}
        distress = sum(by_status[s] * STATUS_SEVERITY[s] for s in by_status)
        return {
            "status": STATUS_LABELS[idx],
            "confidence": float(probs[idx]),
            "probabilities": by_status,
            "mapped_status": STATUS_LABELS[idx],
            "distress": float(distress),
        }


registry = ModelRegistry()
