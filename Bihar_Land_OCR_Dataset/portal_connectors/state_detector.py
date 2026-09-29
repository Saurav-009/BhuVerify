"""
BhuVerify — State Detector
SIH 2026 — Detects which Indian state a land document belongs to.

Detection order:
  1. Explicit 'state' field in extracted_fields
  2. Keyword/token matching in document text and extracted fields
  3. District-to-state lookup table
"""

from __future__ import annotations

import re
from typing import Dict, Optional

# ─────────────────────────────────────────────────────────────
# District → State lookup (curated for supported states)
# ─────────────────────────────────────────────────────────────
_DISTRICT_TO_STATE: Dict[str, str] = {
    # Bihar
    "patna": "Bihar",
    "gaya": "Bihar",
    "nalanda": "Bihar",
    "muzaffarpur": "Bihar",
    "bhagalpur": "Bihar",
    "saran": "Bihar",
    "siwan": "Bihar",
    "vaishali": "Bihar",
    "begusarai": "Bihar",
    "aurangabad": "Bihar",
    "darbhanga": "Bihar",
    "madhubani": "Bihar",
    "samastipur": "Bihar",
    "sitamarhi": "Bihar",
    "sheohar": "Bihar",
    "gopalganj": "Bihar",
    "east champaran": "Bihar",
    "west champaran": "Bihar",
    "buxar": "Bihar",
    "rohtas": "Bihar",
    "kaimur": "Bihar",
    "arwal": "Bihar",
    "jehanabad": "Bihar",
    "lakhisarai": "Bihar",
    "sheikhpura": "Bihar",
    "munger": "Bihar",
    "supaul": "Bihar",
    "saharsa": "Bihar",
    "madhepura": "Bihar",
    "purnea": "Bihar",
    "araria": "Bihar",
    "kishanganj": "Bihar",
    "katihar": "Bihar",
    "khagaria": "Bihar",
    "sampatchak": "Bihar",    # Anchal/Circle in Patna
    # West Bengal
    "kolkata": "West Bengal",
    "howrah": "West Bengal",
    "hooghly": "West Bengal",
    "nadia": "West Bengal",
    "murshidabad": "West Bengal",
    "barddhaman": "West Bengal",
    "bardhaman": "West Bengal",
    "purba bardhaman": "West Bengal",
    "paschim bardhaman": "West Bengal",
    "north 24 parganas": "West Bengal",
    "south 24 parganas": "West Bengal",
    "birbhum": "West Bengal",
    "bankura": "West Bengal",
    "purulia": "West Bengal",
    "jhargram": "West Bengal",
    "cooch behar": "West Bengal",
    "alipurduar": "West Bengal",
    "jalpaiguri": "West Bengal",
    "darjeeling": "West Bengal",
    "kalimpong": "West Bengal",
    "malda": "West Bengal",
    "north dinajpur": "West Bengal",
    "south dinajpur": "West Bengal",
    "medinipur": "West Bengal",
    "east medinipur": "West Bengal",
    "west medinipur": "West Bengal",
    # Assam
    "kamrup": "Assam",
    "kamrup metropolitan": "Assam",
    "jorhat": "Assam",
    "dibrugarh": "Assam",
    "nagaon": "Assam",
    "sonitpur": "Assam",
    "sibsagar": "Assam",
    "tinsukia": "Assam",
    "lakhimpur": "Assam",
    "dhemaji": "Assam",
    "golaghat": "Assam",
    "cachar": "Assam",
    "silchar": "Assam",
    "barpeta": "Assam",
    "nalbari": "Assam",
    "darrang": "Assam",
    "morigaon": "Assam",
    "bongaigaon": "Assam",
    "goalpara": "Assam",
    "dhubri": "Assam",
    "karbi anglong": "Assam",
    "dima hasao": "Assam",
    "hailakandi": "Assam",
    "karimganj": "Assam",
}

# State-specific keyword signatures
_STATE_KEYWORDS: Dict[str, list] = {
    "Bihar": [
        "bihar", "jamabandi", "biharbhumi", "apna khata", "bhumi",
        "sampatchak", "anchal", "halka", "mauja", "raiyat",
        "dakhil-kharij", "पटना", "बिहार", "जमाबंदी"
    ],
    "West Bengal": [
        "west bengal", "banglarbhumi", "khatian", "dag", "rs khatian",
        "lr khatian", "mouza", "jl no", "bargadari", "বাংলা", "পশ্চিমবঙ্গ"
    ],
    "Assam": [
        "assam", "ilrms", "dharitree", "patta", "periodic patta", "annual patta",
        "allotment patta", "jamabandi assam", "অসম", "আসাম"
    ],
}

SUPPORTED_STATES = list(_STATE_KEYWORDS.keys())


def detect_state(
    extracted_fields: Dict[str, Optional[str]],
    ocr_text: str = "",
) -> Optional[str]:
    """
    Detect the Indian state for a land document.
    Returns one of: 'Bihar', 'West Bengal', 'Assam', or None.
    """
    # 1. Explicit state field
    explicit = (extracted_fields.get("state") or "").strip()
    if explicit:
        for s in SUPPORTED_STATES:
            if s.lower() in explicit.lower():
                return s

    # 2. District lookup
    district = (extracted_fields.get("district") or "").strip().lower()
    if district:
        for d, s in _DISTRICT_TO_STATE.items():
            if d in district or district in d:
                return s

    # 3. Keyword scan across fields + OCR text
    combined_text = " ".join(
        str(v) for v in extracted_fields.values() if v
    ) + " " + ocr_text
    combined_lower = combined_text.lower()

    scores: Dict[str, int] = {s: 0 for s in SUPPORTED_STATES}
    for state, keywords in _STATE_KEYWORDS.items():
        for kw in keywords:
            if kw in combined_lower:
                scores[state] += 1

    best = max(scores, key=lambda s: scores[s])
    if scores[best] > 0:
        return best

    return None
