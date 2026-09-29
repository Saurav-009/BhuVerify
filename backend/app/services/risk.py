def analyze_risk(structured_record: dict, validation_result: dict) -> dict:
    missing_fields = [
        field
        for field in ["owner_name", "survey_number", "khata_number", "village", "district"]
        if not structured_record.get(field)
    ]

    score = 0.0
    if missing_fields:
        score += min(0.45, len(missing_fields) * 0.1)

    if not validation_result.get("record_found"):
        score += 0.35

    if validation_result.get("record_found") and not validation_result.get("owner_match"):
        score += 0.3

    if score >= 0.6:
        level = "high"
    elif score >= 0.3:
        level = "medium"
    else:
        level = "low"

    return {
        "risk_score": round(min(score, 1.0), 2),
        "risk_level": level,
        "missing_fields": missing_fields,
        "signals": {
            "record_found": validation_result.get("record_found", False),
            "owner_match": validation_result.get("owner_match", False),
        },
        "recommended_action": "human_review_required" if level != "low" else "ready_for_officer_approval",
    }
