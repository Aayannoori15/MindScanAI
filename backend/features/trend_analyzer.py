def analyze_trends(sessions: list) -> dict:
    if len(sessions) < 2:
        return {"available": False, "message": "Complete another session to unlock trend arrows."}

    ordered = sorted(sessions, key=lambda s: s.created_at)
    latest, prev = ordered[-1], ordered[-2]

    def arrow(cur, old):
        delta = cur - old
        if abs(delta) < 1.0:
            return "stable"
        return "improving" if delta < 0 else "worsening"

    return {
        "available": True,
        "depression": arrow(latest.depression_score, prev.depression_score),
        "anxiety": arrow(latest.anxiety_score, prev.anxiety_score),
        "stress": arrow(latest.stress_score, prev.stress_score),
        "n_sessions": len(ordered),
    }
