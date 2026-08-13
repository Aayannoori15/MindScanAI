"""Train the speech encoder on RAVDESS audio.

    python training/train_speech.py

Reads dataset/Audios/Actor_*/*.wav (skips the duplicate nested
audio_speech_actors_01-24/ copy), extracts 128-band log-mel spectrograms with
librosa (mirroring backend.core.preprocessors.speech_preprocessor), and writes
the trained embedding backbone to backend/models/classification/speech_encoder.pt.
"""

import sys
import time
from pathlib import Path

import librosa
import numpy as np
import torch
from torch import nn
from torch.nn.utils.rnn import pad_sequence
from torch.utils.data import DataLoader, Dataset, random_split

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.core.dataset_spec import RAVDESS_EMOTIONS  # noqa: E402
from backend.models.architectures import SpeechEncoder  # noqa: E402

DATA_DIR = ROOT / "dataset" / "Audios"
OUT_PATH = ROOT / "backend" / "models" / "classification" / "speech_encoder.pt"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SAMPLE_RATE = 16000
EMOTION_TO_IDX = {name: i for i, name in enumerate(RAVDESS_EMOTIONS.values())}


def build_samples() -> list[tuple[Path, int]]:
    samples = []
    for actor_dir in sorted(DATA_DIR.glob("Actor_*")):
        for f in actor_dir.glob("*.wav"):
            parts = f.stem.split("-")
            if len(parts) != 7:
                continue
            emotion = RAVDESS_EMOTIONS.get(int(parts[2]))
            if emotion is None:
                continue
            samples.append((f, EMOTION_TO_IDX[emotion]))
    return samples


def extract_logmel(path: Path) -> np.ndarray:
    y, _ = librosa.load(str(path), sr=SAMPLE_RATE)
    mel = librosa.feature.melspectrogram(y=y, sr=SAMPLE_RATE, n_mels=128)
    return np.log1p(mel).T.astype(np.float32)  # (T, 128)


class RAVDESSDataset(Dataset):
    def __init__(self, samples: list[tuple[Path, int]], cache: dict):
        self.samples = samples
        self.cache = cache

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        path, label = self.samples[idx]
        if path not in self.cache:
            self.cache[path] = extract_logmel(path)
        return torch.from_numpy(self.cache[path]), label


def collate(batch):
    feats, labels = zip(*batch)
    lengths = torch.tensor([f.size(0) for f in feats])
    padded = pad_sequence(feats, batch_first=True)  # (B, Tmax, 128)
    return padded, lengths, torch.tensor(labels)


def main(epochs: int = 30, batch_size: int = 32, lr: float = 1e-3):
    samples = build_samples()
    print(f"total clips: {len(samples)}")
    labels = np.array([s[1] for s in samples])
    print("class counts:", np.bincount(labels))

    print("extracting log-mel features (cached in memory)...")
    cache: dict = {}
    t0 = time.time()
    for i, (path, _) in enumerate(samples):
        cache[path] = extract_logmel(path)
        if (i + 1) % 200 == 0:
            print(f"  {i+1}/{len(samples)} ({time.time()-t0:.1f}s)")
    print(f"feature extraction done in {time.time()-t0:.1f}s")

    n_val = int(len(samples) * 0.15)
    train_samples, val_samples = random_split(
        samples, [len(samples) - n_val, n_val], generator=torch.Generator().manual_seed(42)
    )
    train_dl = DataLoader(
        RAVDESSDataset(list(train_samples), cache), batch_size=batch_size, shuffle=True, collate_fn=collate
    )
    val_dl = DataLoader(
        RAVDESSDataset(list(val_samples), cache), batch_size=batch_size, shuffle=False, collate_fn=collate
    )

    model = SpeechEncoder(num_classes=len(EMOTION_TO_IDX)).to(DEVICE)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    criterion = nn.CrossEntropyLoss()

    best_acc = 0.0
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    for epoch in range(epochs):
        t0 = time.time()
        model.train()
        train_loss = 0.0
        n = 0
        for x, _lengths, y in train_dl:
            x, y = x.to(DEVICE), y.to(DEVICE)
            opt.zero_grad()
            out = model(x)
            loss = criterion(out, y)
            loss.backward()
            opt.step()
            train_loss += loss.item() * x.size(0)
            n += x.size(0)
        sched.step()
        train_loss /= n

        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for x, _lengths, y in val_dl:
                x, y = x.to(DEVICE), y.to(DEVICE)
                pred = model(x).argmax(1)
                correct += (pred == y).sum().item()
                total += y.size(0)
        acc = correct / total
        print(f"epoch {epoch+1}/{epochs} loss={train_loss:.4f} val_acc={acc:.4f} ({time.time()-t0:.1f}s)")

        if acc > best_acc:
            best_acc = acc
            torch.save(model.state_dict(), OUT_PATH)

    print(f"best val_acc={best_acc:.4f}, saved {OUT_PATH}")


if __name__ == "__main__":
    main()
