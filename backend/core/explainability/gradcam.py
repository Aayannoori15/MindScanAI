"""Grad-CAM over the trained facial encoder.

Real Grad-CAM: hooks the last convolutional block of the fine-tuned ResNet18,
backpropagates the predicted class score, and weights the activation maps by
their pooled gradients. The result is where the model actually looked, not a
decorative overlay.

Falls back to a clearly-labelled "unavailable" payload when no trained encoder
is loaded (mock mode) rather than inventing a plausible-looking heatmap.
"""

import base64
from io import BytesIO

import numpy as np
from PIL import Image

from backend.core.dataset_spec import FACE_SIZE

DISPLAY_SIZE = 192


def _colorize(cam: np.ndarray) -> np.ndarray:
    """Map a 0..1 saliency map to a teal->amber->rose ramp matching the UI palette."""
    stops = np.array([[15, 27, 45], [0, 191, 166], [245, 158, 11], [251, 113, 133]], dtype=np.float32)
    pos = cam * (len(stops) - 1)
    lo = np.clip(np.floor(pos).astype(int), 0, len(stops) - 1)
    hi = np.clip(lo + 1, 0, len(stops) - 1)
    frac = (pos - lo)[..., None]
    return (stops[lo] * (1 - frac) + stops[hi] * frac).astype(np.uint8)


def generate_gradcam(image_bytes: bytes | None, face_tensor: np.ndarray | None = None) -> dict:
    """Grad-CAM heatmap for a FER face, overlaid on the input at display size."""
    if not image_bytes:
        return {"available": False, "heatmap_png_b64": None, "focus": "No facial frame was provided."}

    from backend.core.model_loader import TorchEncoder, registry

    encoder = registry.facial_encoder
    if not isinstance(encoder, TorchEncoder) or face_tensor is None:
        return {
            "available": False,
            "heatmap_png_b64": None,
            "focus": "Grad-CAM needs the trained facial encoder; it is unavailable in mock mode.",
        }

    try:
        import torch

        model = encoder.model
        target_layer = model.backbone[-3]  # last residual block, before avgpool/flatten

        activations: dict[str, torch.Tensor] = {}
        gradients: dict[str, torch.Tensor] = {}

        def fwd_hook(_m, _inp, out):
            activations["value"] = out

        def bwd_hook(_m, _gin, gout):
            gradients["value"] = gout[0]

        h1 = target_layer.register_forward_hook(fwd_hook)
        h2 = target_layer.register_full_backward_hook(bwd_hook)
        try:
            x = torch.from_numpy(np.asarray(face_tensor, dtype=np.float32)).unsqueeze(0).to(encoder.device)
            logits = model(x)
            model.zero_grad(set_to_none=True)
            logits[0, int(logits.argmax(dim=1))].backward()

            acts = activations["value"][0]  # (C, H, W)
            grads = gradients["value"][0]  # (C, H, W)
            weights = grads.mean(dim=(1, 2), keepdim=True)  # channel importance
            cam = torch.relu((weights * acts).sum(dim=0))
        finally:
            h1.remove()
            h2.remove()
            model.zero_grad(set_to_none=True)

        cam = cam.detach().cpu().numpy()
        if cam.max() <= cam.min():
            return {
                "available": False,
                "heatmap_png_b64": None,
                "focus": "Model produced a flat saliency map for this frame.",
            }
        cam = (cam - cam.min()) / (cam.max() - cam.min())

        cam_img = Image.fromarray((cam * 255).astype(np.uint8)).resize(
            (DISPLAY_SIZE, DISPLAY_SIZE), Image.BICUBIC
        )
        cam_resized = np.asarray(cam_img, dtype=np.float32) / 255.0
        heat = Image.fromarray(_colorize(cam_resized), mode="RGB")

        base = (
            Image.open(BytesIO(image_bytes))
            .convert("L")
            .resize((FACE_SIZE, FACE_SIZE))
            .convert("RGB")
            .resize((DISPLAY_SIZE, DISPLAY_SIZE), Image.NEAREST)
        )
        alpha = Image.fromarray((cam_resized * 0.72 * 255).astype(np.uint8), mode="L")
        blended = Image.composite(heat, base, alpha)

        buf = BytesIO()
        blended.save(buf, format="PNG")

        # Describe where the mass actually landed instead of asserting a fixed region.
        h, w = cam.shape
        cy, cx = np.unravel_index(int(cam.argmax()), cam.shape)
        vert = "upper" if cy < h / 3 else "lower" if cy > 2 * h / 3 else "mid"
        horiz = "left" if cx < w / 3 else "right" if cx > 2 * w / 3 else "central"
        coverage = float((cam > 0.5).mean())
        return {
            "available": True,
            "heatmap_png_b64": base64.b64encode(buf.getvalue()).decode("ascii"),
            "focus": (
                f"Model attention peaked in the {vert}-{horiz} region of the face "
                f"({coverage:.0%} of the frame above half-intensity)."
            ),
        }
    except Exception as exc:  # keep the assessment alive if saliency fails
        return {
            "available": False,
            "heatmap_png_b64": None,
            "focus": f"Grad-CAM could not be computed for this frame ({type(exc).__name__}).",
        }
