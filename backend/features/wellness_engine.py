def personalized_wellness(numerical: dict | None, scores: dict, dominant_emotion: str | None) -> dict:
    tips = []
    n = numerical or {}

    if n.get("Sleep_Quality", 3) <= 2:
        tips.append(
            {
                "id": "sleep",
                "title": "Protect a wind-down hour",
                "body": "Sleep quality scored low on the 1–5 scale. Dim screens 45 minutes before bed and keep a consistent wake time this week.",
                "minutes": 10,
            }
        )
    if n.get("Social_Engagement", 3) <= 2:
        tips.append(
            {
                "id": "social",
                "title": "One low-stakes connection",
                "body": "Social engagement is thin. Send a short check-in to someone safe, or sit in a shared space for 20 minutes.",
                "minutes": 15,
            }
        )
    if n.get("Eye_Blink_Rate", 17) > 24 or n.get("GSR_Level", 8) > 14 or scores.get("anxiety", 0) > 12:
        tips.append(
            {
                "id": "ground",
                "title": "5-4-3-2-1 grounding",
                "body": "Blink rate / GSR look elevated. Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.",
                "minutes": 3,
            }
        )
    if n.get("Daily_App_Usage_Min", 180) > 240 or n.get("Session_Frequency", 24) > 40 or scores.get("stress", 0) > 20:
        tips.append(
            {
                "id": "breathe",
                "title": "Box breathing (4-4-4-4)",
                "body": "High digital load showed up. Inhale 4, hold 4, exhale 4, hold 4 — four rounds before the next session burst.",
                "minutes": 2,
            }
        )
    if n.get("Idle_Time_Min", 90) > 150 or n.get("Smile_Intensity", 0.45) < 0.25:
        tips.append(
            {
                "id": "move",
                "title": "A ten-minute walk",
                "body": "Idle time is high and smile intensity is low. Light movement often shifts arousal more than another hour of scrolling.",
                "minutes": 10,
            }
        )
    if not tips:
        tips.append(
            {
                "id": "maintain",
                "title": "Keep the anchors you already have",
                "body": "Your pattern looks relatively buffered. Protect sleep, a daily outdoor minute, and one social touchpoint.",
                "minutes": 5,
            }
        )

    return {
        "dominant_emotion": dominant_emotion,
        "tips": tips[:4],
        "tone": "These are self-care prompts, not treatment.",
    }
