"""Train the fusion trunk, 4-class status classifier, and depression/anxiety/
stress regressors on the tabular dataset.

    python training/train_fusion.py

Reads dataset/mental_health_multimodal_synthetic_labels.csv -- NOT the
original mental_health_multimodal.csv. That original file's labels carry no
statistical relationship to its 18 features (see docs/model_placement.md);
training on it just fits noise. training/generate_synthetic_labels.py
regenerates the label columns from a designed, plausible, noisy relationship
to the same 18 real feature columns (see that script's docstring for what
"synthetic labels" means and why); run it first if the file doesn't exist yet.
These models demonstrate the pipeline can learn a real relationship when one
exists -- they do not carry clinical predictive validity.

z-scores features with the same (mean, std) table the API uses at inference
(backend.core.dataset_spec.FEATURE_STATS, computed from the original file),
and writes:

  backend/models/fusion/multimodal_fusion.pt          (trunk only)
  backend/models/classification/mental_health_classifier.pt (trunk + head)
  backend/models/regression/depression_regressor.pt    (trunk + head)
  backend/models/regression/anxiety_regressor.pt        (trunk + head)
  backend/models/regression/stress_regressor.pt         (trunk + head)

The three "*_regressor.pt" / classifier files are self-contained (trunk
weights are duplicated into each) so backend/core/model_loader.py can load
each independently.
"""

import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import accuracy_score, balanced_accuracy_score, confusion_matrix, f1_score, mean_absolute_error
from sklearn.model_selection import train_test_split
from torch import nn

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.core.dataset_spec import (  # noqa: E402
    FEATURE_STATS,
    NUMERICAL_FEATURE_KEYS,
    SCORE_MAX,
    STATUS_LABELS,
)
from backend.models.architectures import ScoreRegressor, StatusClassifier  # noqa: E402

CSV_PATH = ROOT / "dataset" / "mental_health_multimodal_synthetic_labels.csv"
CLS_DIR = ROOT / "backend" / "models" / "classification"
REG_DIR = ROOT / "backend" / "models" / "regression"
FUSION_DIR = ROOT / "backend" / "models" / "fusion"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

TARGETS = {"depression": "Depression_Score", "anxiety": "Anxiety_Score", "stress": "Stress_Score"}


def load_data():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"{CSV_PATH} missing -- run training/generate_synthetic_labels.py first")
    df = pd.read_csv(CSV_PATH)
    x = np.zeros((len(df), len(NUMERICAL_FEATURE_KEYS)), dtype=np.float32)
    for i, key in enumerate(NUMERICAL_FEATURE_KEYS):
        mean, std = FEATURE_STATS[key]
        x[:, i] = (df[key].to_numpy(dtype=np.float32) - mean) / (std + 1e-8)
    y_status = df["Mental_Health_Status"].map(STATUS_LABELS.index).to_numpy()
    y_scores = {k: df[col].to_numpy(dtype=np.float32) for k, col in TARGETS.items()}
    return x, y_status, y_scores


def train_classifier(x_train, y_train, x_val, y_val, epochs=400, patience=40, lr=1e-3):
    counts = np.bincount(y_train, minlength=len(STATUS_LABELS))
    weights = torch.tensor(counts.sum() / (counts + 1e-6), dtype=torch.float32)
    weights = (weights / weights.sum() * len(STATUS_LABELS)).to(DEVICE)

    model = StatusClassifier(num_classes=len(STATUS_LABELS)).to(DEVICE)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    criterion = nn.CrossEntropyLoss(weight=weights)

    xt = torch.from_numpy(x_train).to(DEVICE)
    yt = torch.from_numpy(y_train).long().to(DEVICE)
    xv = torch.from_numpy(x_val).to(DEVICE)
    yv_np = y_val

    best_f1, best_state, bad_epochs = 0.0, None, 0
    for epoch in range(epochs):
        model.train()
        opt.zero_grad()
        loss = criterion(model(xt), yt)
        loss.backward()
        opt.step()
        sched.step()

        model.eval()
        with torch.no_grad():
            val_pred = model(xv).argmax(1).cpu().numpy()
        val_f1 = f1_score(yv_np, val_pred, average="macro")
        if val_f1 > best_f1:
            best_f1, bad_epochs = val_f1, 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            bad_epochs += 1
        if (epoch + 1) % 40 == 0:
            print(f"  [classifier] epoch {epoch+1}/{epochs} loss={loss.item():.4f} val_macro_f1={val_f1:.4f} best={best_f1:.4f}")
        if bad_epochs >= patience:
            print(f"  [classifier] early stopping at epoch {epoch+1}")
            break

    model.load_state_dict(best_state)
    print(f"classifier best val_macro_f1={best_f1:.4f}")
    return model


def train_regressor(name, x_train, y_train, x_val, y_val, score_max, epochs=600, patience=60, lr=1e-3):
    model = ScoreRegressor().to(DEVICE)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    criterion = nn.MSELoss()

    xt = torch.from_numpy(x_train).to(DEVICE)
    yt = torch.from_numpy(y_train / score_max).to(DEVICE)
    xv = torch.from_numpy(x_val).to(DEVICE)
    yv = torch.from_numpy(y_val / score_max).to(DEVICE)

    best_mae, best_state, bad_epochs = float("inf"), None, 0
    for epoch in range(epochs):
        model.train()
        opt.zero_grad()
        loss = criterion(model(xt), yt)
        loss.backward()
        opt.step()
        sched.step()

        model.eval()
        with torch.no_grad():
            val_pred = model(xv)
            mae = (val_pred - yv).abs().mean().item() * score_max
        if mae < best_mae:
            best_mae, bad_epochs = mae, 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            bad_epochs += 1
        if (epoch + 1) % 60 == 0:
            print(f"  [{name}] epoch {epoch+1}/{epochs} loss={loss.item():.4f} val_mae={mae:.3f} best={best_mae:.3f}")
        if bad_epochs >= patience:
            print(f"  [{name}] early stopping at epoch {epoch+1}")
            break

    model.load_state_dict(best_state)
    print(f"{name} best val_mae={best_mae:.3f} (range 0-{score_max:.0f})")
    return model


def report_classifier_test(model, x_test, y_test):
    model.eval()
    with torch.no_grad():
        pred = model(torch.from_numpy(x_test).to(DEVICE)).argmax(1).cpu().numpy()
    acc = accuracy_score(y_test, pred)
    bal_acc = balanced_accuracy_score(y_test, pred)
    macro_f1 = f1_score(y_test, pred, average="macro")
    cm = confusion_matrix(y_test, pred, labels=list(range(len(STATUS_LABELS))))
    print("\n=== Status classifier (held-out test set) ===")
    print(f"accuracy:          {acc:.4f}")
    print(f"balanced accuracy: {bal_acc:.4f}")
    print(f"macro F1:          {macro_f1:.4f}")
    print(f"confusion matrix (rows=true, cols=pred, labels={STATUS_LABELS}):")
    print(cm)


def report_regressor_test(name, model, x_test, y_test, score_max, y_train_mean):
    model.eval()
    with torch.no_grad():
        pred = model(torch.from_numpy(x_test).to(DEVICE)).cpu().numpy() * score_max
    mae = mean_absolute_error(y_test, pred)
    baseline_mae = mean_absolute_error(y_test, np.full_like(y_test, y_train_mean))
    print(f"\n=== {name} regressor (held-out test set) ===")
    print(f"MAE: {mae:.3f}  (mean-predict baseline: {baseline_mae:.3f}, range 0-{score_max:.0f})")


def main():
    x, y_status, y_scores = load_data()
    idx = np.arange(len(x))
    idx_train, idx_temp = train_test_split(idx, test_size=0.30, random_state=42, stratify=y_status)
    idx_val, idx_test = train_test_split(
        idx_temp, test_size=0.5, random_state=42, stratify=y_status[idx_temp]
    )
    print(f"train: {len(idx_train)}  val: {len(idx_val)}  test: {len(idx_test)}")

    x_train, x_val, x_test = x[idx_train], x[idx_val], x[idx_test]
    y_status_train, y_status_val, y_status_test = y_status[idx_train], y_status[idx_val], y_status[idx_test]

    for d in (CLS_DIR, REG_DIR, FUSION_DIR):
        d.mkdir(parents=True, exist_ok=True)

    t0 = time.time()
    clf = train_classifier(x_train, y_status_train, x_val, y_status_val)
    report_classifier_test(clf, x_test, y_status_test)
    torch.save(clf.state_dict(), CLS_DIR / "mental_health_classifier.pt")
    torch.save(clf.trunk.state_dict(), FUSION_DIR / "multimodal_fusion.pt")

    for name in TARGETS:
        y_train = y_scores[name][idx_train]
        y_val = y_scores[name][idx_val]
        y_test = y_scores[name][idx_test]
        reg = train_regressor(name, x_train, y_train, x_val, y_val, SCORE_MAX[name])
        report_regressor_test(name, reg, x_test, y_test, SCORE_MAX[name], y_train.mean())
        torch.save(reg.state_dict(), REG_DIR / f"{name}_regressor.pt")

    print(f"\ndone in {time.time()-t0:.1f}s")


if __name__ == "__main__":
    main()
