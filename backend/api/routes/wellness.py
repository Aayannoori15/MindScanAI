from fastapi import APIRouter

from backend.features.crisis_detector import HELPLINES

router = APIRouter()

STATIC_TIPS = [
    {"id": "sleep", "title": "Sleep hygiene", "body": "Same wake time, dark room, no caffeine after 4pm."},
    {"id": "breathe", "title": "Physiological sigh", "body": "Two inhales through the nose, long exhale through the mouth."},
    {"id": "move", "title": "Daylight walk", "body": "Ten minutes outdoors can shift autonomic tone."},
]


@router.get("/tips")
def tips():
    return {"tips": STATIC_TIPS, "helplines": HELPLINES}
