from functools import lru_cache
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

from backend.core.dataset_spec import FACE_CHANNELS, FACE_SIZE, parse_fer_hint

# YuNet DNN face detector, vendored so detection works offline. OpenCV 5
# dropped CascadeClassifier and no longer ships the Haar cascades, and YuNet
# is more accurate than Haar anyway.
DETECTOR_PATH = Path(__file__).resolve().parents[2] / "models" / "vendor" / "face_detection_yunet_2023mar.onnx"

# Fraction of the detected box added on each side. Calibrated by sweeping the
# margin and measuring how often a simulated webcam frame reproduces the
# prediction the model gives for the same face as a tight FER dataset crop:
# 0.0 -> 75%, 0.10 -> 71%, 0.22 -> 65%, 0.35 -> 48%, 0.50 -> 33%. FER2013
# crops are tight enough that YuNet's raw box is already the right framing;
# any added margin shrinks the face relative to training and costs accuracy.
FACE_MARGIN = 0.0
DETECT_SCORE_THRESHOLD = 0.7


@lru_cache(maxsize=1)
def _detector():
    """Loaded once and reused; returns None if OpenCV or the model is missing."""
    try:
        import cv2

        cv2.setLogLevel(cv2.LOG_LEVEL_ERROR)
        if not DETECTOR_PATH.exists():
            return None
        return cv2.FaceDetectorYN.create(
            str(DETECTOR_PATH), "", (320, 320), DETECT_SCORE_THRESHOLD
        )
    except Exception:
        return None


def _detect_face_box(gray: np.ndarray) -> tuple[int, int, int, int] | None:
    """Highest-confidence face as (left, top, right, bottom), or None."""
    det = _detector()
    if det is None:
        return None
    try:
        import cv2

        H, W = gray.shape[:2]
        bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        det.setInputSize((W, H))
        _retval, faces = det.detect(bgr)
        if faces is None or len(faces) == 0:
            return None
        # rows are [x, y, w, h, ...landmarks..., score]; take the best-scoring
        x, y, w, h = max(faces, key=lambda f: f[-1])[:4]
    except Exception:
        return None

    x, y, w, h = int(x), int(y), int(w), int(h)
    mx, my = int(w * FACE_MARGIN), int(h * FACE_MARGIN)
    H, W = gray.shape[:2]
    left, top = max(0, x - mx), max(0, y - my)
    right, bottom = min(W, x + w + mx), min(H, y + h + my)
    if right - left < 8 or bottom - top < 8:
        return None
    return (left, top, right, bottom)


def _center_square(w: int, h: int) -> tuple[int, int, int, int]:
    """Largest centered square -- preserves aspect ratio when detection fails."""
    side = min(w, h)
    return ((w - side) // 2, (h - side) // 2, (w - side) // 2 + side, (h - side) // 2 + side)


def preprocess_face(image_bytes: bytes | None, filename: str | None = None) -> tuple[np.ndarray, dict]:
    """FER-aligned 48x48 grayscale tensor (1, 48, 48).

    The FER model was trained on tightly-cropped faces that fill the frame, so
    a raw webcam frame must be cropped to the face before downscaling.
    Squashing a whole 640x480 frame into 48x48 instead (destroying the aspect
    ratio and leaving the face only a few pixels wide) is enough on its own to
    flip a clearly smiling face to "fear" -- the model is then classifying a
    distorted room, not an expression.
    """
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

    # Images already at FER size are dataset crops -- don't re-crop them.
    if (w, h) == (FACE_SIZE, FACE_SIZE):
        face_img = img
        flags.append("preprocessed_fer_crop")
    else:
        box = _detect_face_box(np.asarray(img, dtype=np.uint8))
        if box is not None:
            face_img = img.crop(box)
            flags.append("face_detected")
        else:
            face_img = img.crop(_center_square(w, h))
            flags.append("no_face_detected")

    arr = np.asarray(face_img.resize((FACE_SIZE, FACE_SIZE), Image.BILINEAR), dtype=np.float32) / 255.0
    brightness = float(arr.mean())
    if brightness < 0.18:
        flags.append("underexposed")
    elif brightness > 0.88:
        flags.append("overexposed")
    sharpness = float(np.abs(np.diff(arr, axis=0)).mean())
    if sharpness < 0.015:
        flags.append("blurry_face")

    # Informational flags describe which crop path ran; only genuine defects
    # should reduce the confidence reported for this modality.
    informational = {"face_detected", "preprocessed_fer_crop"}
    quality = max(0.15, 1.0 - 0.25 * len([f for f in flags if f not in informational]))
    return arr[np.newaxis, ...], {"quality": quality, "flags": flags, "size": [w, h], **meta}
