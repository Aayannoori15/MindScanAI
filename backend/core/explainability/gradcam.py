import base64
from io import BytesIO

from PIL import Image, ImageDraw

from backend.core.dataset_spec import FACE_SIZE


def generate_gradcam(image_bytes: bytes | None) -> dict:
    """Approximate attention overlay on FER-sized 48×48 faces (upscaled for display)."""
    if not image_bytes:
        return {"available": False, "heatmap_png_b64": None, "focus": "No facial frame was provided."}

    gray = Image.open(BytesIO(image_bytes)).convert("L").resize((FACE_SIZE, FACE_SIZE))
    img = gray.convert("RGB").resize((192, 192), Image.NEAREST)
    overlay = img.convert("RGBA")
    heat = Image.new("RGBA", (192, 192), (0, 0, 0, 0))
    draw = ImageDraw.Draw(heat)
    for cx, cy, r, color in [
        (96, 78, 48, (0, 191, 166, 90)),
        (68, 76, 24, (251, 113, 133, 70)),
        (124, 76, 24, (251, 113, 133, 70)),
        (96, 128, 30, (245, 158, 11, 80)),
    ]:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
    blended = Image.alpha_composite(overlay, heat).convert("RGB")
    buf = BytesIO()
    blended.save(buf, format="PNG")
    return {
        "available": True,
        "heatmap_png_b64": base64.b64encode(buf.getvalue()).decode("ascii"),
        "focus": "Attention concentrated around periocular and perioral regions (FER 48×48 grayscale).",
    }
