import json
from difflib import SequenceMatcher
from pathlib import Path
from normalizer import normalize_digits

def fuzzy_similarity(s1: str, s2: str) -> float:
    """Compute normalized token fuzzy similarity ratio [0.0, 1.0]."""
    if not s1 or not s2:
        return 0.0
    s1_clean = normalize_digits(str(s1)).lower().strip()
    s2_clean = normalize_digits(str(s2)).lower().strip()
    
    if s1_clean == s2_clean:
        return 1.0
    
    # Token set similarity
    t1 = set(s1_clean.split())
    t2 = set(s2_clean.split())
    if t1 and t2:
        overlap = len(t1.intersection(t2)) / max(len(t1), len(t2))
        if overlap > 0.8:
            return round(overlap, 4)
            
    seq_ratio = SequenceMatcher(None, s1_clean, s2_clean).ratio()
    return round(seq_ratio, 4)

def exact_digit_match(d1: str, d2: str) -> float:
    """Compute exact or prefix digit match score."""
    if not d1 or not d2:
        return 0.0
    clean1 = normalize_digits(str(d1)).strip()
    clean2 = normalize_digits(str(d2)).strip()
    if clean1 == clean2:
        return 1.0
    if len(clean1) > 3 and clean1 in clean2 or clean2 in clean1:
        return 0.85
    return 0.0

def match_extracted_to_reference(extracted_fields: dict, ref_record: dict) -> dict:
    """
    Compare OCR-extracted fields with reference ground-truth record.
    Generates field-level scores, overall confidence, and verification status.
    """
    ext = extracted_fields.get("fields", {})
    
    scores = {}

    # 1. Computerized Jamabandi Number
    ext_comp = ext.get("computerized_jamabandi_number", {}).get("corrected")
    ref_comp = ref_record.get("computerized_jamabandi_number")
    scores["computerized_jamabandi_number"] = {
        "extracted": ext_comp,
        "reference": ref_comp,
        "score": exact_digit_match(ext_comp, ref_comp),
        "weight": 0.25
    }

    # 2. Jamabandi Number
    ext_jam = ext.get("jamabandi_number", {}).get("corrected")
    ref_jam = ref_record.get("jamabandi_number")
    scores["jamabandi_number"] = {
        "extracted": ext_jam,
        "reference": ref_jam,
        "score": exact_digit_match(ext_jam, ref_jam),
        "weight": 0.15
    }

    # 3. Khata Number
    ext_khata = ext.get("khata_number", {}).get("corrected")
    ref_khata = ref_record.get("khata_number")
    scores["khata_number"] = {
        "extracted": ext_khata,
        "reference": ref_khata,
        "score": exact_digit_match(ext_khata, ref_khata),
        "weight": 0.15
    }

    # 4. Khesra / Plot Number
    ext_khesra = ext.get("khesra_plot_number", {}).get("corrected")
    ref_khesra = ref_record.get("khesra_plot_number")
    scores["khesra_plot_number"] = {
        "extracted": ext_khesra,
        "reference": ref_khesra,
        "score": exact_digit_match(ext_khesra, ref_khesra),
        "weight": 0.15
    }

    # 5. Raiyat Name
    ext_raiyat = ext.get("raiyat_name", {}).get("corrected")
    ref_raiyat = ref_record.get("raiyat_name")
    scores["raiyat_name"] = {
        "extracted": ext_raiyat,
        "reference": ref_raiyat,
        "score": fuzzy_similarity(ext_raiyat, ref_raiyat),
        "weight": 0.15
    }

    # 6. Village / Mauza
    ext_mauja = ext.get("mauja", {}).get("corrected")
    ref_mauja = ref_record.get("mauja")
    scores["mauja"] = {
        "extracted": ext_mauja,
        "reference": ref_mauja,
        "score": fuzzy_similarity(ext_mauja, ref_mauja),
        "weight": 0.15
    }

    # Calculate overall weighted confidence score
    total_weight = sum(item["weight"] for item in scores.values() if item["reference"] is not None or item["extracted"] is not None)
    if total_weight > 0:
        weighted_score = sum(item["score"] * item["weight"] for item in scores.values() if item["reference"] is not None or item["extracted"] is not None) / total_weight
    else:
        weighted_score = 0.0

    overall_conf = round(weighted_score, 4)

    # Determine Verification Status based on thresholds
    if ext_comp and ref_comp and ext_comp == ref_comp and overall_conf >= 0.85:
        status = "VERIFIED"
    elif overall_conf >= 0.70:
        status = "PARTIALLY VERIFIED"
    elif not ext_comp and not ext_khata and not ext_raiyat:
        status = "INSUFFICIENT DATA"
    else:
        status = "MISMATCH"

    return {
        "document_id": extracted_fields.get("document_id"),
        "overall_confidence": overall_conf,
        "percentage": f"{int(overall_conf * 100)}%",
        "status": status,
        "field_scores": scores
    }
