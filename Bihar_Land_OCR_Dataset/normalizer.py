import re

HINDI_DIGITS = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
}

SAFE_CONFUSION_MAP = {
    'O': '0', 'o': '0',
    'l': '1', 'I': '1', '|': '1',
    'S': '5', 's': '5',
    'B': '8'
}

def normalize_digits(text: str) -> str:
    """Convert Hindi Devanagari digits to standard Arabic digits (0-9)."""
    if not text:
        return ""
    res = list(text)
    for i, char in enumerate(res):
        if char in HINDI_DIGITS:
            res[i] = HINDI_DIGITS[char]
    return "".join(res)

def normalize_whitespace(text: str) -> str:
    """Normalize irregular spaces, zero-width spaces, non-breaking spaces."""
    if not text:
        return ""
    text = text.replace('\x00', '').replace('\ufffd', '').replace('\u200b', '')
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

def safe_numeric_clean(val: str, allow_decimal=True) -> dict:
    """
    Clean numeric values (e.g. Khata, Khesra, Jamabandi number, Area).
    Returns dict with original, normalized, corrected, and confidence.
    """
    if val is None:
        return {"original": None, "normalized": None, "corrected": None, "confidence": 0.0}

    orig = str(val).strip()
    norm = normalize_digits(orig)
    
    # Check if purely digits or numeric
    clean_digits = re.sub(r'[^\d.]' if allow_decimal else r'[^\d]', '', norm)
    
    # Evaluate ambiguity
    if clean_digits == norm or clean_digits == orig:
        corrected = clean_digits
        conf = 1.0
    elif len(clean_digits) > 0 and len(clean_digits) >= len(orig) * 0.7:
        corrected = clean_digits
        conf = 0.90
    else:
        corrected = norm
        conf = 0.60

    return {
        "original": orig,
        "normalized": norm,
        "corrected": corrected,
        "confidence": conf
    }

def safe_text_clean(text: str) -> dict:
    """
    Clean name and location text (Raiyat name, Father name, Mauza, Anchal).
    """
    if not text:
        return {"original": "", "normalized": "", "corrected": "", "confidence": 0.0}

    orig = str(text).strip()
    # Normalize Devanagari & Latin spaces
    norm = normalize_whitespace(orig)
    
    # Strip unnecessary trailing punctuation
    corrected = re.sub(r'^[,\-:\s]+|[,\-:\s]+$', '', norm)

    return {
        "original": orig,
        "normalized": norm,
        "corrected": corrected,
        "confidence": 0.95 if corrected else 0.0
    }
