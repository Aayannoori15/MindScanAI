import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import numpy as np

router = APIRouter()


@router.websocket("/ws")
async def realtime_emotion(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            raw = await ws.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_json({"error": "invalid_json"})
                continue

            emotions = payload.get("emotions") or {}
            if not emotions:
                # Lightweight server-side smoothing of a dummy distribution if client sends audio energy only
                energy = float(payload.get("energy", 0.2))
                rng = np.random.default_rng(int(energy * 1000) % 2**32)
                keys = ["neutral", "calm", "happy", "sad", "angry", "fearful", "disgust", "surprised"]
                vec = rng.random(len(keys))
                vec[0] += 1.2
                vec = vec / vec.sum()
                emotions = {k: float(v) for k, v in zip(keys, vec)}

            total = sum(emotions.values()) or 1.0
            probs = {k: v / total for k, v in emotions.items()}
            dominant = max(probs, key=probs.get)
            await ws.send_json({"t": payload.get("t"), "emotions": probs, "dominant": dominant})
    except WebSocketDisconnect:
        return
