"""Train the facial encoder on the FER 48x48 grayscale image set.

    python training/train_facial.py

Reads dataset/Extracted_images/<Class>/*.png (7 class folders matching
backend.core.dataset_spec.FER_EMOTIONS) and writes the trained embedding
backbone to backend/models/classification/facial_encoder.pt.
"""

import sys
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import transforms
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.core.dataset_spec import FER_NAME_TO_ID  # noqa: E402
from backend.models.architectures import FacialEncoder  # noqa: E402

DATA_DIR = ROOT / "dataset" / "Extracted_images"
OUT_PATH = ROOT / "backend" / "models" / "classification" / "facial_encoder.pt"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class FERDataset(Dataset):
    def __init__(self, samples: list[tuple[Path, int]], train: bool):
        self.samples = samples
        aug = [transforms.RandomHorizontalFlip(), transforms.RandomRotation(8)] if train else []
        self.tf = transforms.Compose([*aug, transforms.ToTensor()])

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        path, label = self.samples[idx]
        img = Image.open(path).convert("L")
        return self.tf(img), label


def build_samples() -> list[tuple[Path, int]]:
    samples = []
    for folder in sorted(DATA_DIR.iterdir()):
        if not folder.is_dir():
            continue
        class_id = FER_NAME_TO_ID.get(folder.name.lower())
        if class_id is None:
            print(f"skip unrecognized folder: {folder.name}")
            continue
        for f in folder.glob("*.png"):
            samples.append((f, class_id))
    return samples


def main(epochs: int = 12, batch_size: int = 256, lr: float = 1e-3):
    samples = build_samples()
    print(f"total images: {len(samples)}")
    labels = np.array([s[1] for s in samples])
    counts = np.bincount(labels, minlength=7)
    print("class counts:", counts)
    class_weights = torch.tensor(counts.sum() / (counts + 1e-6), dtype=torch.float32)
    class_weights = (class_weights / class_weights.sum() * 7).to(DEVICE)

    n_val = int(len(samples) * 0.1)
    train_samples, val_samples = random_split(
        samples, [len(samples) - n_val, n_val], generator=torch.Generator().manual_seed(42)
    )
    train_ds = FERDataset(list(train_samples), train=True)
    val_ds = FERDataset(list(val_samples), train=False)
    train_dl = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=4, pin_memory=True)
    val_dl = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)

    model = FacialEncoder(num_classes=7).to(DEVICE)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    best_acc = 0.0
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    for epoch in range(epochs):
        t0 = time.time()
        model.train()
        train_loss = 0.0
        for x, y in train_dl:
            x, y = x.to(DEVICE, non_blocking=True), y.to(DEVICE, non_blocking=True)
            opt.zero_grad()
            out = model(x)
            loss = criterion(out, y)
            loss.backward()
            opt.step()
            train_loss += loss.item() * x.size(0)
        sched.step()
        train_loss /= len(train_ds)

        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for x, y in val_dl:
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
