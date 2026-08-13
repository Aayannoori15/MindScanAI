def build_report(
    status: str,
    scores: dict,
    weights: dict,
    shap: dict,
    lime: dict,
    gradcam: dict,
    flags: list[str],
) -> dict:
    top = (shap.get("items") or [])[:3]
    facial_line = (
        "Facial expressions showed reduced engagement around the eyes and mouth."
        if gradcam.get("available")
        else "No facial frame was available, so visual affect cues were not used."
    )
    speech_line = (
        "Speech carried elevated tension markers in pitch and energy contour."
        if lime.get("available")
        else "Speech was missing or too quiet to interpret confidently."
    )
    if top:
        num_line = (
            f"The strongest physiological drivers were {top[0]['label'].lower()} "
            f"and {top[1]['label'].lower()}."
        )
    else:
        num_line = "Numerical wellness signals were not provided."

    clinical_rows = [
        {
            "feature": item["label"],
            "value": item["value"],
            "contribution": item["contribution"],
            "direction": "increases burden" if item["contribution"] > 0 else "protective",
        }
        for item in (shap.get("items") or [])
    ]

    return {
        "level1_plain_english": " ".join([facial_line, speech_line, num_line]),
        "level2_visual": {
            "gradcam": gradcam,
            "shap_waterfall": shap.get("items", [])[:10],
            "speech_lime": lime.get("cues", []),
        },
        "level3_clinical": clinical_rows,
        "quality_flags": flags,
        "modality_weights": weights,
        "disclaimer": (
            "MindScan AI is a decision-support tool for screening and explanation. "
            "It is not a clinical diagnosis. Please consult a licensed mental health professional."
        ),
        "status": status,
        "scores": scores,
    }
