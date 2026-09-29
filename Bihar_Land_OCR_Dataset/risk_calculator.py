"""
BhuVerify Risk Assessment Engine
SIH 2026 - Intelligent Land Record Digitization and Validation System
Calculates risk scores, risk levels (LOW/MEDIUM/HIGH), and granular risk factors.
"""

from typing import Dict, Any, List

def calculate_land_record_risk(
    fields: Dict[str, Any],
    matches: Dict[str, Any],
    overall_confidence: float = 0.85
) -> Dict[str, Any]:
    """
    Computes a risk score from 0 (safest) to 100 (highest risk)
    based on legal integrity, registry matches, and extraction confidence.
    """
    risk_score = 0
    factors: List[Dict[str, Any]] = []

    # 1. Check Owner/Raiyat Name match
    raiyat_match = matches.get("raiyat_name", {})
    raiyat_score = raiyat_match.get("score", 1.0)
    raiyat_val = fields.get("raiyat_name", {})
    raiyat_text = raiyat_val.get("normalized") if isinstance(raiyat_val, dict) else str(raiyat_val or "")

    if not raiyat_text or raiyat_text.lower() in ["none", "nan", ""]:
        risk_score += 30
        factors.append({
            "code": "OWNER_MISSING",
            "category": "Ownership & Identity",
            "title": "Primary Raiyat (Owner) Name Missing",
            "severity": "HIGH",
            "penalty": 30,
            "description": "The titleholder name could not be resolved from the document."
        })
    elif raiyat_score < 0.6:
        penalty = 25
        risk_score += penalty
        factors.append({
            "code": "OWNER_MISMATCH",
            "category": "Ownership & Identity",
            "title": "Raiyat Name Registry Mismatch",
            "severity": "HIGH",
            "penalty": penalty,
            "description": f"Extracted owner name differs significantly from land registry record (similarity: {int(raiyat_score * 100)}%)."
        })
    elif raiyat_score < 0.85:
        penalty = 12
        risk_score += penalty
        factors.append({
            "code": "OWNER_PARTIAL_MATCH",
            "category": "Ownership & Identity",
            "title": "Minor Raiyat Spelling Variance",
            "severity": "LOW",
            "penalty": penalty,
            "description": f"Extracted owner name has phonetic or spelling variation against registry (similarity: {int(raiyat_score * 100)}%)."
        })

    # 2. Computerized Jamabandi Number Verification
    comp_jam = fields.get("computerized_jamabandi_number", {})
    comp_val = comp_jam.get("normalized") if isinstance(comp_jam, dict) else str(comp_jam or "")
    comp_match = matches.get("computerized_jamabandi_number", {})
    comp_score = comp_match.get("score", 1.0)

    if not comp_val or len(comp_val) < 12:
        penalty = 18
        risk_score += penalty
        factors.append({
            "code": "COMP_JAMABANDI_UNVERIFIED",
            "category": "Registry Verification",
            "title": "Computerized Jamabandi Identifier Unverified",
            "severity": "MEDIUM",
            "penalty": penalty,
            "description": "Standard 15-digit computerized Jamabandi ID is missing or truncated in the document."
        })
    elif comp_score < 0.8:
        penalty = 25
        risk_score += penalty
        factors.append({
            "code": "JAMABANDI_ID_MISMATCH",
            "category": "Registry Verification",
            "title": "Jamabandi Number Mismatch with Department Database",
            "severity": "HIGH",
            "penalty": penalty,
            "description": "The Computerized Jamabandi Number does not match the official Revenue Department registry."
        })

    # 3. Mutation Status
    mutation = fields.get("mutation_status", {})
    mut_val = (mutation.get("normalized") if isinstance(mutation, dict) else str(mutation or "")).lower()

    if "dispute" in mut_val or "विवाद" in mut_val or "stay" in mut_val:
        penalty = 40
        risk_score += penalty
        factors.append({
            "code": "ACTIVE_DISPUTE",
            "category": "Legal & Encumbrance",
            "title": "Active Legal Dispute / Mutation Stay",
            "severity": "CRITICAL",
            "penalty": penalty,
            "description": "Document or registry records indicate an active court dispute, injunction, or contested succession."
        })
    elif "not found" in mut_val or "पेंडिंग" in mut_val or "pending" in mut_val or "अस्वीकृत" in mut_val:
        penalty = 15
        risk_score += penalty
        factors.append({
            "code": "MUTATION_PENDING",
            "category": "Legal & Encumbrance",
            "title": "Mutation Record Not Synchronized",
            "severity": "MEDIUM",
            "penalty": penalty,
            "description": "No finalized Dakhil-Kharij (mutation) case found on record for this Jamabandi entry."
        })

    # 4. Khata and Khesra (Plot) Verification
    khata_match = matches.get("khata_number", {}).get("score", 1.0)
    khesra_match = matches.get("khesra_plot_number", {}).get("score", 1.0)

    if khata_match < 0.8 or khesra_match < 0.8:
        penalty = 20
        risk_score += penalty
        factors.append({
            "code": "CADASTRAL_MISMATCH",
            "category": "Cadastral Integrity",
            "title": "Cadastral Khata / Khesra Discrepancy",
            "severity": "HIGH",
            "penalty": penalty,
            "description": "Survey Khata or Khesra (plot) number diverges from revenue survey maps."
        })

    # 5. Extraction Quality & Confidence
    if overall_confidence < 0.65:
        penalty = 15
        risk_score += penalty
        factors.append({
            "code": "LOW_CONFIDENCE_OCR",
            "category": "Data Quality",
            "title": "Low OCR Document Legibility",
            "severity": "MEDIUM",
            "penalty": penalty,
            "description": f"Average text extraction confidence is {int(overall_confidence * 100)}%. Scanned document exhibits degradation or artifacts."
        })

    # Cap score
    final_score = min(100, max(5, risk_score))

    # Level classification
    if final_score <= 30:
        level = "LOW"
        color = "emerald"
        status_text = "Verified — Clean Record"
    elif final_score <= 65:
        level = "MEDIUM"
        color = "amber"
        status_text = "Requires Review — Flagged Differences"
    else:
        level = "HIGH"
        color = "red"
        status_text = "High Risk — Discrepancies Detected"

    return {
        "risk_score": final_score,
        "risk_level": level,
        "status_text": status_text,
        "color": color,
        "factors_count": len(factors),
        "factors": factors
    }
