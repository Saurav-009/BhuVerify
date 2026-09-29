import json
import re

from app.config import get_settings


def _fallback_extract(raw_text: str) -> tuple[dict, dict]:
    patterns = {
        "owner_name": r"owner\s*[:\-]\s*(.+)",
        "survey_number": r"(survey|khasra)\s*(no\.?|number)?\s*[:\-]\s*([A-Za-z0-9\-/]+)",
        "khata_number": r"khata\s*(no\.?|number)?\s*[:\-]\s*([A-Za-z0-9\-/]+)",
        "village": r"village\s*[:\-]\s*(.+)",
        "district": r"district\s*[:\-]\s*(.+)",
        "area_hectare": r"area\s*[:\-]\s*([0-9.]+)",
    }

    structured: dict[str, str] = {}
    evidence: dict[str, dict] = {}

    for key, pattern in patterns.items():
        match = re.search(pattern, raw_text, flags=re.IGNORECASE)
        if match:
            value = match.group(match.lastindex or 1).strip()
            if key == "owner_name":
                value = value.split("\n")[0].strip()
            structured[key] = value
            evidence[key] = {
                "snippet": match.group(0),
                "start": match.start(),
                "end": match.end(),
                "highlight": raw_text[max(0, match.start() - 25): match.end() + 25],
            }

    return structured, evidence


def extract_with_gemini(raw_text: str) -> tuple[dict, dict]:
    settings = get_settings()
    if settings.gemini_api_key:
        try:
            import google.generativeai as genai  # type: ignore

            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel(settings.gemini_model)
            prompt = (
                "Extract land-record entities as JSON with keys: owner_name, survey_number,"
                " khata_number, village, district, area_hectare, parcel_id."
                " Also return source evidence as an object keyed by field with short snippet."
                f" Document text:\n{raw_text}"
            )
            response = model.generate_content(prompt)
            parsed = json.loads(response.text)
            return parsed.get("structured_record", {}), parsed.get("evidence", {})
        except Exception:
            pass

    return _fallback_extract(raw_text)
