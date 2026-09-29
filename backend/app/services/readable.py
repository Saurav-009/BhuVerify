def generate_readable_document(structured_record: dict, evidence: dict) -> str:
    lines = ["BhuVerify Digitized Land Record", "=" * 34]
    for key in ["owner_name", "survey_number", "khata_number", "village", "district", "area_hectare", "parcel_id"]:
        value = structured_record.get(key, "N/A")
        snippet = evidence.get(key, {}).get("snippet", "n/a")
        lines.append(f"{key}: {value}")
        lines.append(f"  evidence: {snippet}")
    return "\n".join(lines)
