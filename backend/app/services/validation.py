from app.services.state_connectors import get_connector


def validate_against_state_data(state: str, structured_record: dict) -> dict:
    connector = get_connector(state)
    records = connector.list_records()

    def norm(value: str | None) -> str:
        return (value or "").strip().lower()

    survey = norm(structured_record.get("survey_number"))
    khata = norm(structured_record.get("khata_number"))
    owner = norm(structured_record.get("owner_name"))

    matches = [
        item
        for item in records
        if norm(item.get("survey_number")) == survey
        and norm(item.get("khata_number")) == khata
    ]

    owner_match = bool(matches and owner and norm(matches[0].get("owner_name")) == owner)

    return {
        "state": connector.state_code,
        "record_found": bool(matches),
        "owner_match": owner_match,
        "matches": matches[:3],
        "checked_fields": ["survey_number", "khata_number", "owner_name"],
    }
