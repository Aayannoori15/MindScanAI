"""nn.Module definitions shared by the training scripts (training/) and the
runtime loader (backend/core/model_loader.py). Keeping one definition avoids
architecture drift between what was trained and what gets loaded at inference.
"""

import torch
import torchvision
from torch import nn
from torch.nn import functional as F
from transformers import Wav2Vec2Model

EMBED_DIM = 128
NUM_FEATURES = 18
FUSION_HIDDEN = 32

IMAGENET_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
IMAGENET_STD = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)

WAV2VEC2_CHECKPOINT = "facebook/wav2vec2-base"


class FacialEncoder(nn.Module):
    """48x48 grayscale FER image -> 128-d embedding.

    Backbone is an ImageNet-pretrained ResNet18: the 1-channel FER tile is
    replicated to 3 channels and upsampled to 224x224 so the pretrained
    filters (edges/texture/shape) transfer, then fine-tuned end-to-end on
    FER. Resize/normalize happen inside encode() so callers keep passing the
    same (1, 48, 48) 0-1 tensor the preprocessor already produces.
    """

    def __init__(self, num_classes: int = 7, pretrained: bool = True):
        super().__init__()
        weights = torchvision.models.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None
        backbone = torchvision.models.resnet18(weights=weights)
        self.backbone = nn.Sequential(*list(backbone.children())[:-1])  # drop the 1000-class fc
        self.embed = nn.Linear(512, EMBED_DIM)
        self.classifier = nn.Linear(EMBED_DIM, num_classes)
        self.register_buffer("mean", IMAGENET_MEAN)
        self.register_buffer("std", IMAGENET_STD)

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        x = x.repeat(1, 3, 1, 1)
        x = F.interpolate(x, size=224, mode="bilinear", align_corners=False)
        x = (x - self.mean) / self.std
        z = self.backbone(x).flatten(1)
        return torch.relu(self.embed(z))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.encode(x))


class SpeechEncoder(nn.Module):
    """Raw 16kHz mono waveform -> 128-d embedding.

    Backbone is facebook/wav2vec2-base, self-supervised-pretrained on ~960h
    of English speech (LibriSpeech). By default only the last
    `unfreeze_last_n_layers` transformer layers are trainable (plus the
    pooling-attention + embedding + classifier head); the conv feature
    extractor, the feature projection, and the earlier transformer layers
    stay frozen. `unfreeze_last_n_layers=0` reduces to a pure linear probe on
    frozen features. `attention_mask` marks real (non-padding) timesteps for
    batched training; unbatched single-clip inference doesn't need it.

    wav2vec2-base was pretrained on input normalized to zero mean / unit
    variance per clip (`Wav2Vec2FeatureExtractor(do_normalize=True)`); that
    normalization is applied inside encode()/forward() so callers just pass
    the raw waveform the preprocessor produces.
    """

    def __init__(self, num_classes: int = 8, unfreeze_last_n_layers: int = 0):
        super().__init__()
        self.backbone = Wav2Vec2Model.from_pretrained(WAV2VEC2_CHECKPOINT)
        self.unfreeze_last_n_layers = unfreeze_last_n_layers
        for p in self.backbone.parameters():
            p.requires_grad = False
        if unfreeze_last_n_layers > 0:
            for layer in self.backbone.encoder.layers[-unfreeze_last_n_layers:]:
                for p in layer.parameters():
                    p.requires_grad = True
        self.backbone.eval()
        hidden = self.backbone.config.hidden_size  # 768
        self.attn = nn.Linear(hidden, 1)
        self.embed = nn.Linear(hidden, EMBED_DIM)
        self.classifier = nn.Linear(EMBED_DIM, num_classes)

    def train(self, mode: bool = True):
        super().train(mode)
        self.backbone.train(mode and self.unfreeze_last_n_layers > 0)
        return self

    def trainable_backbone_parameters(self):
        return [p for p in self.backbone.parameters() if p.requires_grad]

    @staticmethod
    def normalize_waveform(waveform: torch.Tensor, attention_mask: torch.Tensor | None = None) -> torch.Tensor:
        """Per-clip zero-mean/unit-variance, matching wav2vec2's pretraining input."""
        if attention_mask is None:
            mean = waveform.mean(dim=1, keepdim=True)
            var = waveform.var(dim=1, keepdim=True, unbiased=False)
        else:
            mask = attention_mask.float()
            n = mask.sum(dim=1, keepdim=True).clamp(min=1)
            mean = (waveform * mask).sum(dim=1, keepdim=True) / n
            var = ((waveform - mean) ** 2 * mask).sum(dim=1, keepdim=True) / n
        return (waveform - mean) / torch.sqrt(var + 1e-7)

    def feature_mask_from_attention_mask(self, hidden_len: int, attention_mask: torch.Tensor) -> torch.Tensor:
        """Downsample a raw-sample attention mask to the backbone's frame rate."""
        return self.backbone._get_feature_vector_attention_mask(hidden_len, attention_mask)

    def pool_hidden(self, hidden: torch.Tensor, feature_mask: torch.Tensor | None = None) -> torch.Tensor:
        """Attention-pool a (B, T', 768) backbone hidden-state sequence -> 128-d embedding.

        Exposed separately from encode() so training can cache a fully-frozen
        backbone's output once per clip and train only this small pooling +
        embedding head across epochs, instead of rerunning the 95M-param
        backbone on every batch.
        """
        scores = self.attn(hidden)  # (B, T', 1)
        if feature_mask is not None:
            scores = scores.masked_fill(~feature_mask.unsqueeze(-1).bool(), float("-inf"))
        weights = torch.softmax(scores, dim=1)
        pooled = (hidden * weights).sum(dim=1)  # (B, 768)
        return torch.relu(self.embed(pooled))

    def encode(self, waveform: torch.Tensor, attention_mask: torch.Tensor | None = None) -> torch.Tensor:
        waveform = self.normalize_waveform(waveform, attention_mask)
        hidden = self.backbone(waveform, attention_mask=attention_mask).last_hidden_state  # (B, T', 768)
        feature_mask = None
        if attention_mask is not None:
            feature_mask = self.feature_mask_from_attention_mask(hidden.size(1), attention_mask)
        return self.pool_hidden(hidden, feature_mask)

    def forward(self, waveform: torch.Tensor, attention_mask: torch.Tensor | None = None) -> torch.Tensor:
        return self.classifier(self.encode(waveform, attention_mask))


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
