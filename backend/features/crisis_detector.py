from backend.config import settings

HELPLINES = [
    {
        "name": "iCall (TISS)",
        "phone": "9152987821",
        "hours": "Mon–Sat, 8am–10pm IST",
        "note": "Psychosocial counselling, English and several Indian languages.",
    },
    {
        "name": "Vandrevala Foundation",
        "phone": "9999666555",
        "hours": "24×7",
        "note": "Mental health support across India.",
    },
    {
        "name": "NIMHANS / KIRAN",
        "phone": "1800-599-0019",
        "hours": "24×7",
        "note": "Government of India mental health helpline.",
    },
]


def detect_crisis(status: str, stress: float) -> dict:
    flagged = status == settings.crisis_severity_label or stress >= settings.crisis_stress_threshold
    return {
        "flagged": flagged,
        "message": (
            "Your stress signals look heavier than usual. You do not have to handle this alone — "
            "these helplines are staffed by people trained to listen."
            if flagged
            else ""
        ),
        "resources": HELPLINES if flagged else [],
        "disclaimer": "If you are in immediate danger, contact local emergency services.",
    }
