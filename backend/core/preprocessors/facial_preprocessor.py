from io import BytesIO

import numpy as np
from PIL import Image

from backend.core.dataset_spec import FACE_CHANNELS, FACE_SIZE, parse_fer_hint


def preprocess_face(image_bytes: bytes | None, filename: str | None = None) -> tuple[np.ndarray, dict]:
    """FER-aligned 48×48 grayscale tensor (1, 48, 48)."""
    flags: list[str] = []
    meta = parse_fer_hint(filename) or {}
    if not image_bytes:
        flags.append("missing_face")
        return np.zeros((FACE_CHANNELS, FACE_SIZE, FACE_SIZE), dtype=np.float32), {
            "quality": 0.0,
            "flags": flags,
            **meta,
        }

    img = Image.open(BytesIO(image_bytes)).convert("L")
    w, h = img.size
    if min(w, h) < 24:
        flags.append("low_resolution_face")
    arr = np.asarray(img.resize((FACE_SIZE, FACE_SIZE)), dtype=np.float32) / 255.0
    brightness = float(arr.mean())
    if brightness < 0.18:
        flags.append("underexposed")
    elif brightness > 0.88:
        flags.append("overexposed")
    sharpness = float(np.abs(np.diff(arr, axis=0)).mean())
    if sharpness < 0.015:
        flags.append("blurry_face")
    quality = max(0.15, 1.0 - 0.25 * len(flags))
    tensor = arr[np.newaxis, ...]
    return tensor, {"quality": quality, "flags": flags, "size": [w, h], **meta}
