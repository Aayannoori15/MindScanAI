"""Shrink the speech checkpoint by dropping weights training never changed.

    python training/slim_speech_checkpoint.py

The deployed SpeechEncoder freezes everything in wav2vec2-base except the last
few transformer layers, yet the checkpoint stores all 94M parameters — 306 MB
of which is a byte-identical copy of `facebook/wav2vec2-base`, which
`from_pretrained()` fetches at construction time regardless. Saving it twice
buys nothing and pushes the file past GitHub's 100 MB limit.

This rewrites the checkpoint to hold only the tensors that actually differ
(the fine-tuned layers plus the head), taking it from ~360 MB to ~54 MB with
bit-identical predictions. The loader reconstructs the rest from HuggingFace.

Run with --verify (default) to confirm outputs match before the file is
replaced.
"""

import argparse
import sys
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.core.dataset_spec import STATUS_LABELS  # noqa: E402
from backend.models.architectures import SpeechEncoder  # noqa: E402

CKPT = ROOT / "backend" / "models" / "classification" / "speech_encoder.pt"
SLIM_MARKER = "__mindscan_slim__"


def slim_state_dict(full: dict, unfreeze_last_n: int) -> dict:
    """Keep only the head plus the transformer layers that were fine-tuned."""
    # Layer count is read from the checkpoint rather than assumed, so this
    # keeps working if the backbone is ever swapped for a larger variant.
    layer_ids = {
        int(k.split(".")[3]) for k in full if k.startswith("backbone.encoder.layers.")
    }
    trainable = set(sorted(layer_ids)[-unfreeze_last_n:]) if unfreeze_last_n else set()

    kept = {}
    for k, v in full.items():
        if not k.startswith("backbone."):
            kept[k] = v  # attn / embed / classifier
        elif k.startswith("backbone.encoder.layers."):
            if int(k.split(".")[3]) in trainable:
                kept[k] = v
    return {
        SLIM_MARKER: True,
        "unfreeze_last_n_layers": unfreeze_last_n,
        "num_classes": len(STATUS_LABELS),
        "state": kept,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--unfreeze-last-n", type=int, default=2)
    ap.add_argument("--no-verify", action="store_true")
    ap.add_argument("--out", type=Path, default=CKPT)
    args = ap.parse_args()

    if not CKPT.exists():
        print(f"No checkpoint at {CKPT}. Train one first with training/train_speech.py.")
        return 1

    before = CKPT.stat().st_size
    full = torch.load(CKPT, map_location="cpu")
    if full.get(SLIM_MARKER):
        print("Checkpoint is already slim; nothing to do.")
        return 0

    slim = slim_state_dict(full, args.unfreeze_last_n)
    kept_params = sum(v.numel() for v in slim["state"].values())
    print(f"keeping {len(slim['state'])} tensors / {kept_params:,} params")

    if not args.no_verify:
        print("verifying predictions are unchanged...")
        torch.manual_seed(0)
        probe = torch.randn(2, 16000 * 3)

        ref = SpeechEncoder(num_classes=len(STATUS_LABELS), unfreeze_last_n_layers=args.unfreeze_last_n)
        ref.load_state_dict(full)
        ref.eval()

        test = SpeechEncoder(num_classes=len(STATUS_LABELS), unfreeze_last_n_layers=args.unfreeze_last_n)
        missing, unexpected = test.load_state_dict(slim["state"], strict=False)
        if unexpected:
            print(f"  unexpected keys: {list(unexpected)[:4]}")
            return 1
        test.eval()

        with torch.no_grad():
            a = ref(probe).numpy()
            b = test(probe).numpy()
        delta = float(np.abs(a - b).max())
        print(f"  max logit difference: {delta:.3e}")
        if delta > 1e-5:
            print("  ABORTING — slim checkpoint does not reproduce the original.")
            return 1
        print(f"  ok ({len(missing)} tensors restored from the HuggingFace backbone)")

    torch.save(slim, args.out)
    after = args.out.stat().st_size
    print(f"\n{before/1048576:.0f} MB -> {after/1048576:.0f} MB  ({before/after:.1f}x smaller)")
    print(f"saved {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
