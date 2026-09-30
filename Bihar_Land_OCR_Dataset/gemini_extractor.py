"""
BhuVerify Gemini Extractor
SIH 2026 - Intelligent Land Record Digitization and Validation System
Uses Google Gemini API (gemini-3.6-flash) for structured land record extraction with grounding/evidence,
with automatic fallback to local rule-based extractor.
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from google import genai
from google.genai import types
from PIL import Image

from extractor import extract_land_record_fields
from normalizer import normalize_digits

# API key is loaded exclusively from the GEMINI_API_KEY environment variable.
# Set it in Bihar_Land_OCR_Dataset/.env (local) or Netlify environment (production).
# See .env.example at the project root for the required format.

GEMINI_PROMPT = """
You are an expert AI Indian Land Record (Jamabandi / Bhu-Abhilekh) analyst for the Ministry of Rural Development and Department of Land Resources (DoLR), Bihar.
Analyze the provided Bihar land record text / document image.

Extract all key land registry attributes with strict grounding and confidence.
For EACH attribute, return an object containing:
- "original": the exact verbatim raw text in Hindi/English as seen on the document
- "normalized": clean standardized representation (English transliteration or standard numerals, e.g. "211500100010001", "Ramesh Kumar")
- "confidence": floating point between 0.0 and 1.0 representing extraction confidence
- "evidence": list of objects each with:
    - "page": page number (integer, starting at 1)
    - "text": verbatim contextual snippet around this field (10-30 characters)
    - "bbox": normalized bounding box array [ymin, xmin, ymax, xmax] between 0 and 1000 (approximate coordinates if known, or estimate based on layout)

The fields to extract are:
1. "raiyat_name": Name of the Raiyat (Titleholder / Land Owner)
2. "father_or_husband_name": Father's or Husband's name
3. "computerized_jamabandi_number": 15-16 digit computerized Jamabandi ID (often begins with 21...)
4. "jamabandi_number": Legacy Jamabandi number
5. "bhag_vartaman": Bhag Vartaman (Current Volume number)
6. "prishth_sankhya": Prishth Sankhya (Page number in volume)
7. "district": District (e.g., Patna)
8. "anchal": Revenue Block / Circle (e.g., Sampatchak)
9. "halka": Revenue Halka (e.g., Bairiya Karnpura)
10. "mauja": Revenue Village / Mauza (e.g., Karnpura-121)
11. "khata_number": Khata number (Account/Ledger)
12. "khesra_plot_number": Khesra / Plot number
13. "land_area": Area of the parcel (e.g., "0 एकड़ 12.5 डिसमिल")
14. "mutation_status": Dakhil-Kharij / Mutation status (e.g., "स्वीकृत", "Mutation Cases Not Found", "विवादित")

Respond ONLY with a valid JSON object with the exact field names above. No markdown codeblock wrapper, no preamble.
"""

def get_gemini_client() -> Optional[genai.Client]:
    """Retrieve Gemini client exclusively from the GEMINI_API_KEY environment variable."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print(
            "[Gemini Extractor] Gemini API is not configured. "
            "Please set GEMINI_API_KEY in .env or your deployment environment. "
            "Falling back to local rule-based extraction."
        )
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[Gemini Extractor] Client init error: {e}")
        return None

def fallback_local_extraction(ocr_text: str, document_id: str = "") -> Dict[str, Any]:
    """
    Fallback extraction using regex and rules from extractor.py,
    shaped into the evidence-bearing structured format.
    """
    local_res = extract_land_record_fields(ocr_text, document_id=document_id)
    fields = local_res.get("fields", {})

    structured_fields = {}
    for key, data in fields.items():
        orig = data.get("original")
        norm = data.get("corrected") or data.get("normalized") or orig
        if not orig and not norm:
            structured_fields[key] = {
                "original": None,
                "normalized": None,
                "confidence": 0.0,
                "evidence": []
            }
            continue

        conf = data.get("confidence", 0.75)
        
        # Build evidence snippet if found in text
        snippet = ""
        if orig and orig in ocr_text:
            idx = ocr_text.find(orig)
            start = max(0, idx - 15)
            end = min(len(ocr_text), idx + len(orig) + 15)
            snippet = ocr_text[start:end].replace("\n", " ")
        else:
            snippet = orig or norm

        structured_fields[key] = {
            "original": orig,
            "normalized": norm,
            "confidence": conf,
            "evidence": [
                {
                    "page": 1,
                    "text": snippet,
                    "bbox": [100, 100, 200, 400]
                }
            ]
        }

    return structured_fields

def extract_with_gemini(
    text: str,
    image_paths: Optional[List[Path]] = None,
    document_id: str = ""
) -> Dict[str, Any]:
    """
    Extract structured land record information using Gemini with fallback.
    """
    client = get_gemini_client()
    if not client:
        print("[Gemini Extractor] No Gemini client available. Using local extraction.")
        return fallback_local_extraction(text, document_id)

    # Prepare contents for Gemini
    contents = [GEMINI_PROMPT]
    
    if text and len(text.strip()) > 20:
        contents.append(f"DOCUMENT TEXT LAYER / OCR TRANSCRIPT:\n---\n{text}\n---")

    # If document images provided, attach first page image
    if image_paths and len(image_paths) > 0:
        try:
            for img_path in image_paths[:2]:  # Send up to 2 pages
                if Path(img_path).exists():
                    pil_img = Image.open(img_path)
                    contents.append(pil_img)
        except Exception as img_err:
            print(f"[Gemini Extractor] Failed to load image: {img_err}")

    # Models to try in order of preference
    model_candidates = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.8-flash"]
    
    raw_response_text = ""
    for model_name in model_candidates:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents
            )
            if response and response.text:
                raw_response_text = response.text.strip()
                break
        except Exception as call_err:
            print(f"[Gemini Extractor] Attempt with {model_name} failed: {call_err}")
            continue

    if not raw_response_text:
        print("[Gemini Extractor] All Gemini calls failed or returned empty. Falling back to local rules.")
        return fallback_local_extraction(text, document_id)

    # Clean markdown if enclosed
    cleaned_json = raw_response_text
    if cleaned_json.startswith("```"):
        cleaned_json = re.sub(r"^```(?:json)?\n?", "", cleaned_json)
        cleaned_json = re.sub(r"\n?```$", "", cleaned_json)

    try:
        parsed = json.loads(cleaned_json)
        # Ensure all expected fields exist and match structure
        standardized = {}
        expected_keys = [
            "raiyat_name", "father_or_husband_name", "computerized_jamabandi_number",
            "jamabandi_number", "bhag_vartaman", "prishth_sankhya", "district",
            "anchal", "halka", "mauja", "khata_number", "khesra_plot_number",
            "land_area", "mutation_status"
        ]

        for key in expected_keys:
            val = parsed.get(key)
            if isinstance(val, dict):
                standardized[key] = {
                    "original": val.get("original") or "",
                    "normalized": val.get("normalized") or val.get("original") or "",
                    "confidence": float(val.get("confidence") or 0.85),
                    "evidence": val.get("evidence") or []
                }
            elif isinstance(val, str):
                standardized[key] = {
                    "original": val,
                    "normalized": val,
                    "confidence": 0.85,
                    "evidence": [{"page": 1, "text": val, "bbox": [100, 100, 200, 400]}]
                }
            else:
                standardized[key] = {
                    "original": None,
                    "normalized": None,
                    "confidence": 0.0,
                    "evidence": []
                }

        return standardized

    except Exception as parse_err:
        print(f"[Gemini Extractor] JSON parsing failed: {parse_err}. Response was:\n{raw_response_text[:300]}")
        return fallback_local_extraction(text, document_id)
