def classify_document(raw_text: str, filename: str) -> str:
    text = f"{filename} {raw_text}".lower()
    if any(token in text for token in ["khata", "khasra", "survey", "parcel", "land"]):
        return "land_record"
    return "unknown"
