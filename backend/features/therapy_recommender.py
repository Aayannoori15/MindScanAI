"""Care-pathway suggestions matched to screening severity.

This is *signposting*, not prescription. A screening tool cannot diagnose or
decide that someone needs a particular therapy, so recommendations are framed
as levels of support to consider, each with a plain reason, and always with the
caveat that a qualified professional makes the actual call.

Tiers follow the usual stepped-care shape (self-help -> guided support ->
professional assessment -> urgent contact), escalating on the combination of
overall status and individual sub-scores rather than any single number.
"""

from backend.core.dataset_spec import SCORE_MAX

# India-focused, matching the helplines already used by crisis_detector.
DIRECTORIES = [
    {
        "name": "iCall (TISS)",
        "detail": "Free phone and email counselling from trained professionals.",
        "contact": "9152987821",
    },
    {
        "name": "Vandrevala Foundation",
        "detail": "Free 24×7 counselling and referrals to local practitioners.",
        "contact": "9999666555",
    },
    {
        "name": "NIMHANS / KIRAN",
        "detail": "Government helpline that can direct you to nearby services.",
        "contact": "1800-599-0019",
    },
]


def _band(value: float, kind: str) -> float:
    """Score as a 0..1 fraction of its scale, so the three are comparable."""
    return min(1.0, max(0.0, value / SCORE_MAX[kind]))


def recommend_therapy(status: str, scores: dict, crisis_flagged: bool) -> dict:
    d = _band(scores.get("depression", 0), "depression")
    a = _band(scores.get("anxiety", 0), "anxiety")
    s = _band(scores.get("stress", 0), "stress")
    peak = max(d, a, s)

    if crisis_flagged or status == "Severe_Stress":
        tier, urgency = "professional_soon", "high"
        headline = "Worth speaking to someone qualified soon"
        rationale = (
            "Your signals are in the heaviest band this screening measures. That does not "
            "diagnose anything, but it is a good reason to get a proper assessment rather "
            "than wait it out."
        )
    elif status == "Moderate_Stress" or peak >= 0.55:
        tier, urgency = "guided_support", "moderate"
        headline = "Consider structured support"
        rationale = (
            "Several signals are sitting above a comfortable range. Talking to a counsellor "
            "or trying a guided programme tends to help more than self-management alone at "
            "this level."
        )
    elif status == "Mild_Stress" or peak >= 0.3:
        tier, urgency = "self_help_plus", "low"
        headline = "Self-guided steps, with a check-in if it persists"
        rationale = (
            "Your signals are mildly raised. Self-directed approaches are usually a "
            "reasonable first step, with professional input if things stay this way for a "
            "few weeks."
        )
    else:
        tier, urgency = "maintain", "none"
        headline = "Keep doing what's working"
        rationale = (
            "Nothing in this screening stands out as concerning. Maintaining sleep, "
            "movement and connection is the useful thing here."
        )

    # Modality suggestions are described by what they involve, not prescribed.
    options: list[dict] = []
    if tier in ("professional_soon", "guided_support"):
        options.append(
            {
                "name": "Talking therapy (CBT and similar)",
                "what": "Structured sessions with a therapist on the thoughts and habits keeping a pattern going.",
                "why": "The most commonly recommended starting point for persistent low mood or anxiety.",
                "effort": "Weekly, ~50 minutes",
            }
        )
    if tier == "professional_soon":
        options.append(
            {
                "name": "Assessment with a psychiatrist or GP",
                "what": "A clinical conversation to rule out physical causes and discuss all options, including medication.",
                "why": "At this level it is worth having a qualified person see the full picture.",
                "effort": "One appointment to start",
            }
        )
    if a >= 0.5:
        options.append(
            {
                "name": "Anxiety-focused skills",
                "what": "Breathing, exposure and grounding practices, self-guided or with a therapist.",
                "why": "Your anxiety score is the most raised of the three.",
                "effort": "10 minutes daily",
            }
        )
    if d >= 0.5:
        options.append(
            {
                "name": "Behavioural activation",
                "what": "Deliberately rebuilding small, rewarding activities into the week.",
                "why": "Your depression score is the most raised of the three.",
                "effort": "One planned activity daily",
            }
        )
    if tier in ("self_help_plus", "maintain"):
        options.append(
            {
                "name": "Guided self-help",
                "what": "Structured apps, workbooks or courses covering the same skills a therapist teaches.",
                "why": "A proportionate first step at this level, and easy to stop if it is not helping.",
                "effort": "15 minutes, a few times a week",
            }
        )
    if s >= 0.5:
        options.append(
            {
                "name": "Stress and sleep routine work",
                "what": "Fixed wind-down, consistent wake time, and reducing late screen load.",
                "why": "Your stress score is the most raised of the three.",
                "effort": "Nightly",
            }
        )

    return {
        "available": True,
        "tier": tier,
        "urgency": urgency,
        "headline": headline,
        "rationale": rationale,
        "options": options[:4],
        "directories": DIRECTORIES if tier in ("professional_soon", "guided_support") else [],
        "disclaimer": (
            "These are suggestions to consider, not a prescription or a diagnosis. "
            "A qualified professional is the right person to decide what you actually need."
        ),
    }
