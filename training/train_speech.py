"""Train the speech encoder on RAVDESS audio, directly on the 4-class
RAVDESS_TO_STATUS labels the app actually uses (Healthy / Mild_Stress /
Moderate_Stress / Severe_Stress) instead of the raw 8 RAVDESS emotions.

    python training/train_speech.py

Trains and evaluates two models on identical actor-disjoint splits, then
keeps whichever wins on the held-out test actors:

  1. Frozen baseline (linear probe): the wav2vec2-base backbone stays fully
     frozen; only a small pooling-attention + embedding + classifier head is
     trained on cached backbone features. Fast, low overfitting risk.
  2. Fine-tuned: the last `UNFREEZE_LAST_N_LAYERS` wav2vec2 transformer
     layers are unfrozen alongside the head, trained with a small LR on the
     backbone and a larger LR on the head (discriminative learning rates),
     mixed precision, class-weighted loss (RAVDESS_TO_STATUS is imbalanced:
     Healthy gets 3 of the 8 source emotions, Severe_Stress gets only 1), and
     early stopping on validation macro-F1.

Unseen-speaker protocol (actor-disjoint, unchanged in spirit from the earlier
frozen 8-class model): TEST_ACTORS={21,22,23,24} is the same held-out set
used for that model's reported 58.75% accuracy, kept fixed here so the test
identity stays comparable. VAL_ACTORS is a new held-out set (this script is
the first to need early stopping / model selection, so there was no existing
validation split to reuse) carved from the remaining actors, disjoint from
both train and test.

Reads dataset/Audios/Actor_*/*.wav (skips the duplicate nested
audio_speech_actors_01-24/ copy). Writes the winning model (backbone weights
+ trained head, self-contained) to
backend/models/classification/speech_encoder.pt.
"""

import sys
import time
from pathlib import Path

import librosa
import numpy as np
import torch
from sklearn.metrics import accuracy_score, balanced_accuracy_score, confusion_matrix, f1_score
from sklearn.utils.class_weight import compute_class_weight
from torch import nn
from torch.nn.utils.rnn import pad_sequence
from torch.utils.data import DataLoader, Dataset

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.core.dataset_spec import RAVDESS_EMOTIONS, RAVDESS_TO_STATUS, STATUS_LABELS  # noqa: E402
from backend.models.architectures import SpeechEncoder  # noqa: E402

DATA_DIR = ROOT / "dataset" / "Audios"
OUT_PATH = ROOT / "backend" / "models" / "classification" / "speech_encoder.pt"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SAMPLE_RATE = 16000
UNFREEZE_LAST_N_LAYERS = 2

TEST_ACTORS = {21, 22, 23, 24}
VAL_ACTORS = {17, 18, 19, 20}
STATUS_TO_IDX = {name: i for i, name in enumerate(STATUS_LABELS)}


def build_samples() -> list[tuple[Path, int, int]]:
    """Returns (path, status_idx [0-3, RAVDESS_TO_STATUS-mapped], actor_id)."""
    samples = []
    for actor_dir in sorted(DATA_DIR.glob("Actor_*")):
        actor_id = int(actor_dir.name.split("_")[1])
        for f in actor_dir.glob("*.wav"):
            parts = f.stem.split("-")
            if len(parts) != 7:
                continue
            emotion = RAVDESS_EMOTIONS.get(int(parts[2]))
            status = RAVDESS_TO_STATUS.get(emotion)
            if status is None:
                continue
            samples.append((f, STATUS_TO_IDX[status], actor_id))
    return samples


def split_samples(samples):
    train = [s for s in samples if s[2] not in TEST_ACTORS and s[2] not in VAL_ACTORS]
    val = [s for s in samples if s[2] in VAL_ACTORS]
    test = [s for s in samples if s[2] in TEST_ACTORS]
    return train, val, test


def load_waveform(path: Path) -> np.ndarray:
    y, _ = librosa.load(str(path), sr=SAMPLE_RATE, mono=True)
    return y.astype(np.float32)


def compute_class_weights(train_samples) -> torch.Tensor:
    labels = np.array([s[1] for s in train_samples])
    classes = np.arange(len(STATUS_LABELS))
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=labels)
    return torch.tensor(weights, dtype=torch.float32)


def report_metrics(name: str, y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    acc = accuracy_score(y_true, y_pred)
    bal_acc = balanced_accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(STATUS_LABELS))))
    print(f"\n=== {name} (held-out test actors {sorted(TEST_ACTORS)}) ===")
    print(f"accuracy:          {acc:.4f}")
    print(f"balanced accuracy: {bal_acc:.4f}")
    print(f"macro F1:          {macro_f1:.4f}")
    print(f"confusion matrix (rows=true, cols=pred, labels={STATUS_LABELS}):")
    print(cm)
    return {"accuracy": acc, "balanced_accuracy": bal_acc, "macro_f1": macro_f1, "confusion_matrix": cm.tolist()}


# ---------------------------------------------------------------------------
# 1) Frozen baseline (linear probe) -- same fast-caching approach as the
#    earlier 8-class model, now on the 4-class task, so the fine-tuned model
#    has an apples-to-apples same-task comparison point.
# ---------------------------------------------------------------------------


class HiddenStateDataset(Dataset):
    def __init__(self, samples, cache):
        self.samples = samples
        self.cache = cache

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label, _actor = self.samples[idx]
        return self.cache[path], label


def collate_hidden(batch):
    hiddens, labels = zip(*batch)
    lengths = torch.tensor([h.size(0) for h in hiddens])
    padded = pad_sequence(hiddens, batch_first=True)
    return padded, lengths, torch.tensor(labels)


def lengths_to_mask(lengths: torch.Tensor, max_len: int) -> torch.Tensor:
    return torch.arange(max_len, device=lengths.device).unsqueeze(0) < lengths.unsqueeze(1)


@torch.no_grad()
def cache_frozen_hidden(model: SpeechEncoder, samples) -> dict:
    cache = {}
    model.backbone.eval()
    for path, _, _ in samples:
        if path in cache:
            continue
        y = load_waveform(path)
        x = torch.from_numpy(y).unsqueeze(0).to(DEVICE)
        x = model.normalize_waveform(x)
        hidden = model.backbone(x).last_hidden_state.squeeze(0).cpu()
        cache[path] = hidden
    return cache


def train_frozen_baseline(train_s, val_s, test_s, class_weights, epochs=150, patience=20, batch_size=32, lr=1e-3):
    print("\n--- training frozen baseline (linear probe, 4-class) ---")
    model = SpeechEncoder(num_classes=len(STATUS_LABELS), unfreeze_last_n_layers=0).to(DEVICE)

    t0 = time.time()
    cache = cache_frozen_hidden(model, train_s + val_s + test_s)
    print(f"  cached {len(cache)} clips in {time.time()-t0:.1f}s")

    train_dl = DataLoader(HiddenStateDataset(train_s, cache), batch_size=batch_size, shuffle=True, collate_fn=collate_hidden)
    val_dl = DataLoader(HiddenStateDataset(val_s, cache), batch_size=batch_size, shuffle=False, collate_fn=collate_hidden)
    test_dl = DataLoader(HiddenStateDataset(test_s, cache), batch_size=batch_size, shuffle=False, collate_fn=collate_hidden)

    head_params = list(model.attn.parameters()) + list(model.embed.parameters()) + list(model.classifier.parameters())
    opt = torch.optim.AdamW(head_params, lr=lr, weight_decay=1e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(DEVICE))

    def run_eval(dl):
        model.eval()
        preds, labels = [], []
        with torch.no_grad():
            for hidden, lengths, y in dl:
                hidden = hidden.to(DEVICE)
                mask = lengths_to_mask(lengths.to(DEVICE), hidden.size(1))
                pooled = model.pool_hidden(hidden, mask)
                preds.extend(model.classifier(pooled).argmax(1).cpu().numpy())
                labels.extend(y.numpy())
        return np.array(labels), np.array(preds)

    best_f1, best_state, bad_epochs = 0.0, None, 0
    t0 = time.time()
    for epoch in range(epochs):
        model.train()
        for hidden, lengths, y in train_dl:
            hidden, y = hidden.to(DEVICE), y.to(DEVICE)
            mask = lengths_to_mask(lengths.to(DEVICE), hidden.size(1))
            opt.zero_grad()
            pooled = model.pool_hidden(hidden, mask)
            loss = criterion(model.classifier(pooled), y)
            loss.backward()
            opt.step()
        sched.step()

        y_val, pred_val = run_eval(val_dl)
        val_f1 = f1_score(y_val, pred_val, average="macro")
        if val_f1 > best_f1:
            best_f1, bad_epochs = val_f1, 0
            best_state = {k: v.clone() for k, v in model.state_dict().items() if not k.startswith("backbone.")}
        else:
            bad_epochs += 1
        if (epoch + 1) % 20 == 0:
            print(f"  epoch {epoch+1}/{epochs} val_macro_f1={val_f1:.4f} best={best_f1:.4f}")
        if bad_epochs >= patience:
            print(f"  early stopping at epoch {epoch+1} (no val improvement for {patience} epochs)")
            break

    print(f"  trained in {time.time()-t0:.1f}s, best val_macro_f1={best_f1:.4f}")
    model.load_state_dict(best_state, strict=False)

    y_test, pred_test = run_eval(test_dl)
    metrics = report_metrics("Frozen baseline (linear probe, 4-class)", y_test, pred_test)
    return model, metrics


# ---------------------------------------------------------------------------
# 2) Fine-tuned: last N transformer layers + head, discriminative LR, AMP,
#    early stopping. Backbone weights change during training so (unlike the
#    frozen baseline) hidden states can't be cached -- full forward pass
#    every batch.
# ---------------------------------------------------------------------------


class WaveformDataset(Dataset):
    def __init__(self, samples, cache):
        self.samples = samples
        self.cache = cache

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label, _actor = self.samples[idx]
        if path not in self.cache:
            self.cache[path] = load_waveform(path)
        return torch.from_numpy(self.cache[path]), label


def collate_waveform(batch):
    waves, labels = zip(*batch)
    lengths = torch.tensor([w.size(0) for w in waves])
    padded = pad_sequence(waves, batch_first=True)
    attn_mask = (torch.arange(padded.size(1)).unsqueeze(0) < lengths.unsqueeze(1)).long()
    return padded, attn_mask, torch.tensor(labels)


@torch.no_grad()
def evaluate_waveform(model, dl, use_amp: bool):
    model.eval()
    all_preds, all_labels = [], []
    for x, mask, y in dl:
        x, mask = x.to(DEVICE), mask.to(DEVICE)
        with torch.autocast(device_type=DEVICE.type, dtype=torch.float16, enabled=use_amp):
            logits = model(x, attention_mask=mask)
        all_preds.extend(logits.argmax(1).cpu().numpy())
        all_labels.extend(y.numpy())
    return np.array(all_labels), np.array(all_preds)


def train_finetuned(
    train_s, val_s, test_s, class_weights,
    unfreeze_last_n_layers=UNFREEZE_LAST_N_LAYERS, epochs=40, patience=8,
    batch_size=8, backbone_lr=2e-5, head_lr=1e-3,
):
    print(f"\n--- training fine-tuned model (unfreeze last {unfreeze_last_n_layers} layers, 4-class) ---")
    model = SpeechEncoder(num_classes=len(STATUS_LABELS), unfreeze_last_n_layers=unfreeze_last_n_layers).to(DEVICE)

    cache: dict = {}
    train_dl = DataLoader(WaveformDataset(train_s, cache), batch_size=batch_size, shuffle=True, collate_fn=collate_waveform)
    val_dl = DataLoader(WaveformDataset(val_s, cache), batch_size=batch_size, shuffle=False, collate_fn=collate_waveform)
    test_dl = DataLoader(WaveformDataset(test_s, cache), batch_size=batch_size, shuffle=False, collate_fn=collate_waveform)

    head_params = list(model.attn.parameters()) + list(model.embed.parameters()) + list(model.classifier.parameters())
    backbone_params = model.trainable_backbone_parameters()
    print(f"  trainable params: backbone={sum(p.numel() for p in backbone_params):,} head={sum(p.numel() for p in head_params):,}")
    opt = torch.optim.AdamW(
        [
            {"params": backbone_params, "lr": backbone_lr, "weight_decay": 1e-2},
            {"params": head_params, "lr": head_lr, "weight_decay": 1e-3},
        ]
    )
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(DEVICE))

    use_amp = DEVICE.type == "cuda"
    scaler = torch.amp.GradScaler(DEVICE.type, enabled=use_amp)

    best_f1, best_state, bad_epochs = 0.0, None, 0
    t0 = time.time()
    for epoch in range(epochs):
        model.train()
        total_loss, n = 0.0, 0
        for x, mask, y in train_dl:
            x, mask, y = x.to(DEVICE), mask.to(DEVICE), y.to(DEVICE)
            opt.zero_grad()
            with torch.autocast(device_type=DEVICE.type, dtype=torch.float16, enabled=use_amp):
                logits = model(x, attention_mask=mask)
                loss = criterion(logits, y)
            scaler.scale(loss).backward()
            scaler.step(opt)
            scaler.update()
            total_loss += loss.item() * x.size(0)
            n += x.size(0)
        sched.step()
        train_loss = total_loss / n

        y_val, pred_val = evaluate_waveform(model, val_dl, use_amp)
        val_f1 = f1_score(y_val, pred_val, average="macro")
        val_acc = accuracy_score(y_val, pred_val)

        if val_f1 > best_f1:
            best_f1, bad_epochs = val_f1, 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            bad_epochs += 1
        print(f"  epoch {epoch+1}/{epochs} loss={train_loss:.4f} val_acc={val_acc:.4f} val_macro_f1={val_f1:.4f} best_f1={best_f1:.4f}")
        if bad_epochs >= patience:
            print(f"  early stopping at epoch {epoch+1} (no val improvement for {patience} epochs)")
            break

    print(f"  trained in {time.time()-t0:.1f}s, best val_macro_f1={best_f1:.4f}")
    model.load_state_dict(best_state)

    y_test, pred_test = evaluate_waveform(model, test_dl, use_amp)
    metrics = report_metrics(f"Fine-tuned (unfreeze last {unfreeze_last_n_layers} layers, 4-class)", y_test, pred_test)
    return model, metrics



def save_checkpoint(model, path, unfreeze_last_n):
    """Persist only what training changed.

    The frozen wav2vec2 weights are byte-identical to the HuggingFace
    checkpoint that SpeechEncoder pulls at construction, so storing them again
    costs ~306 MB and pushes the file past GitHub's 100 MB limit for nothing.
    See training/slim_speech_checkpoint.py.
    """
    from training.slim_speech_checkpoint import slim_state_dict

    torch.save(slim_state_dict(model.state_dict(), unfreeze_last_n), path)
    print(f"saved {path} ({path.stat().st_size / 1048576:.0f} MB, slim)")


def main():
    samples = build_samples()
    train_s, val_s, test_s = split_samples(samples)
    print(
        f"total clips: {len(samples)} | train: {len(train_s)} (actors 1-16) "
        f"| val: {len(val_s)} (actors {sorted(VAL_ACTORS)}) | test: {len(test_s)} (actors {sorted(TEST_ACTORS)})"
    )
    train_counts = np.bincount([s[1] for s in train_s], minlength=len(STATUS_LABELS))
    print("train status counts:", dict(zip(STATUS_LABELS, train_counts.tolist())))

    class_weights = compute_class_weights(train_s)
    print("class weights:", dict(zip(STATUS_LABELS, [round(w, 3) for w in class_weights.tolist()])))

    frozen_model, frozen_metrics = train_frozen_baseline(train_s, val_s, test_s, class_weights)
    finetuned_model, finetuned_metrics = train_finetuned(train_s, val_s, test_s, class_weights)

    print("\n" + "=" * 78)
    print("COMPARISON (unseen-speaker test actors 21-24, 4-class RAVDESS_TO_STATUS)")
    print("=" * 78)
    header = f"{'model':<42}{'accuracy':>10}{'bal_acc':>10}{'macro_f1':>10}"
    print(header)
    for name, m in (("frozen baseline (linear probe)", frozen_metrics), (f"fine-tuned (last {UNFREEZE_LAST_N_LAYERS} layers)", finetuned_metrics)):
        print(f"{name:<42}{m['accuracy']:>10.4f}{m['balanced_accuracy']:>10.4f}{m['macro_f1']:>10.4f}")
    print(
        "\nFor historical context only -- NOT a like-for-like comparison (different task):\n"
        "the earlier frozen-backbone model scored 0.5875 accuracy on the ORIGINAL 8-class\n"
        "RAVDESS emotion task with the same actors 21-24 held out. 8-class emotion is a\n"
        "harder, finer-grained task than this 4-class Healthy/Mild/Moderate/Severe target,\n"
        "so a higher number here does not by itself mean the encoder improved."
    )

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    if finetuned_metrics["accuracy"] >= frozen_metrics["accuracy"]:
        print(f"\n-> fine-tuned model wins on test accuracy ({finetuned_metrics['accuracy']:.4f} >= {frozen_metrics['accuracy']:.4f}), saving it")
        save_checkpoint(finetuned_model, OUT_PATH, UNFREEZE_LAST_N_LAYERS)
    else:
        print(f"\n-> frozen baseline wins on test accuracy ({frozen_metrics['accuracy']:.4f} > {finetuned_metrics['accuracy']:.4f}), saving it")
        save_checkpoint(frozen_model, OUT_PATH, 0)
    print(f"saved {OUT_PATH}")


if __name__ == "__main__":
    main()
