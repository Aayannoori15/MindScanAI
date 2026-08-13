"""nn.Module definitions shared by the training scripts (training/) and the
runtime loader (backend/core/model_loader.py). Keeping one definition avoids
architecture drift between what was trained and what gets loaded at inference.
"""

import torch
from torch import nn

EMBED_DIM = 128
NUM_FEATURES = 18
FUSION_HIDDEN = 32


class FacialEncoder(nn.Module):
    """48x48 grayscale FER image -> 128-d embedding."""

    def __init__(self, num_classes: int = 7):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(inplace=True), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(inplace=True), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(inplace=True), nn.MaxPool2d(2),
        )
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.embed = nn.Linear(128, EMBED_DIM)
        self.classifier = nn.Linear(EMBED_DIM, num_classes)

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        z = self.features(x)
        z = self.pool(z).flatten(1)
        return torch.relu(self.embed(z))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.encode(x))


class SpeechEncoder(nn.Module):
    """Variable-length (T, 128) log-mel sequence -> 128-d embedding."""

    def __init__(self, num_classes: int = 8):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(128, 128, 5, padding=2), nn.BatchNorm1d(128), nn.ReLU(inplace=True), nn.MaxPool1d(2),
            nn.Conv1d(128, 128, 5, padding=2), nn.BatchNorm1d(128), nn.ReLU(inplace=True), nn.MaxPool1d(2),
            nn.Conv1d(128, EMBED_DIM, 3, padding=1), nn.BatchNorm1d(EMBED_DIM), nn.ReLU(inplace=True),
        )
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.classifier = nn.Linear(EMBED_DIM, num_classes)

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, T, 128) -> (B, 128, T)
        z = self.conv(x.transpose(1, 2))
        return self.pool(z).flatten(1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.encode(x))


class FusionTrunk(nn.Module):
    """18-d z-scored tabular vector -> 32-d fused representation.

    Ground truth (Mental_Health_Status, D/A/S scores) only exists paired with
    the tabular rows, not with specific FER images or RAVDESS clips, so the
    trunk trains on the numerical branch alone; live facial/speech embeddings
    stay in the heuristic late-fusion path used for explainability/hints.
    """

    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(NUM_FEATURES, 64), nn.BatchNorm1d(64), nn.ReLU(inplace=True), nn.Dropout(0.2),
            nn.Linear(64, FUSION_HIDDEN), nn.BatchNorm1d(FUSION_HIDDEN), nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class StatusClassifier(nn.Module):
    """Fusion trunk + 4-class Mental_Health_Status head."""

    def __init__(self, num_classes: int = 4):
        super().__init__()
        self.trunk = FusionTrunk()
        self.head = nn.Linear(FUSION_HIDDEN, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.trunk(x))


class ScoreRegressor(nn.Module):
    """Fusion trunk + single-target regression head (depression/anxiety/stress)."""

    def __init__(self):
        super().__init__()
        self.trunk = FusionTrunk()
        self.head = nn.Sequential(nn.Linear(FUSION_HIDDEN, 16), nn.ReLU(inplace=True), nn.Linear(16, 1))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.trunk(x)).squeeze(-1)
