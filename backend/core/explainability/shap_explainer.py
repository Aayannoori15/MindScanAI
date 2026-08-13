from backend.core.dataset_spec import FEATURE_DIRECTIONS, FEATURE_LABELS, FEATURE_STATS, NUMERICAL_FEATURE_KEYS


def shap_numerical(values: dict | None, scores: dict[str, float]) -> dict:
    if not values:
        return {"available": False, "items": []}

    items = []
    for key in NUMERICAL_FEATURE_KEYS:
        raw = float(values.get(key, 0))
        mid, _ = FEATURE_STATS[key]
        delta = (raw - mid) / (abs(mid) + 1e-6)
        contrib = round(delta * FEATURE_DIRECTIONS[key] * 2.2, 3)
        items.append(
            {
                "feature": key,
                "label": FEATURE_LABELS[key],
                "value": raw,
                "contribution": contrib,
            }
        )
    items.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    return {"available": True, "items": items, "base_value": round(sum(scores.values()) / 3, 2)}
