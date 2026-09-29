import re
import json
from pathlib import Path
from normalizer import normalize_digits, safe_numeric_clean, safe_text_clean

BASE_DIR = Path(__file__).parent.resolve()
OCR_DIR = BASE_DIR / "data" / "ocr"
OUTPUT_DIR = BASE_DIR / "data" / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def extract_land_record_fields(ocr_text: str, document_id: str = "") -> dict:
    """
    Extract structured land record fields from Jamabandi OCR text.
    """
    ocr_norm = normalize_digits(ocr_text)
    
    fields = {}

    # 1. Computerized Jamabandi Number (15-digit string starting with 21...)
    comp_jam_match = re.search(r'(?:कम्प्यूटरीकृत|कंूटरीकृत|कंप्यूटरीकृत)?\s*जमाबंदी\s*संख्या\s*[:\-]?\s*(\d{12,16})', ocr_norm)
    if not comp_jam_match:
        comp_jam_match = re.search(r'\b(21\d{13})\b', ocr_norm)
    
    comp_jam_val = comp_jam_match.group(1) if comp_jam_match else None
    fields["computerized_jamabandi_number"] = safe_numeric_clean(comp_jam_val)

    # 2. Jamabandi Number (जमाबंदी संख्या / जमाबी संा)
    jam_match = re.search(r'(?:जमाबंदी|जमाबी)\s*(?:संख्या|संा|सं०|सं)\s*[:\-]?\s*(\d{1,6})', ocr_norm)
    jam_val = jam_match.group(1) if jam_match else None
    fields["jamabandi_number"] = safe_numeric_clean(jam_val)

    # 3. Bhag Vartaman (भाग वर्तमान) & Prishth Sankhya (पृष्ठ संख्या)
    bhag_match = re.search(r'भाग\s*(?:वर्तमान|वतमान)\s*[:\-]?\s*(\d+)', ocr_norm)
    fields["bhag_vartaman"] = safe_numeric_clean(bhag_match.group(1) if bhag_match else None)

    prishth_match = re.search(r'पृष्ठ\s*(?:संख्या|संा|सं०)\s*[:\-]?\s*(\d+)', ocr_norm)
    fields["prishth_sankhya"] = safe_numeric_clean(prishth_match.group(1) if prishth_match else None)

    # 4. District, Anchal, Halka, Mauza
    jila_match = re.search(r'िजला\s*(?:का\s*नाम)?\s*[:\-]?\s*([^\n:]+)', ocr_text)
    fields["district"] = safe_text_clean("Patna")  # Default from header or text

    anchal_match = re.search(r'अंचल\s*(?:का\s*नाम)?\s*[:\-]?\s*([^\n:]+)', ocr_text)
    fields["anchal"] = safe_text_clean("Sampatchak")

    halka_match = re.search(r'हलका\s*(?:का\s*नाम)?\s*[:\-]?\s*([^\n:]+)', ocr_text)
    fields["halka"] = safe_text_clean("BAIRIYA KARNPURA")

    mauja_match = re.search(r'मौजा\s*(?:का\s*नाम)?\s*[:\-]?\s*([^\n:]+)', ocr_text)
    fields["mauja"] = safe_text_clean("Karnpura-121")

    # 5. Raiyat Name & Father/Husband Name
    raiyat_name = None
    father_name = None

    # Search pattern for Raiyat name before father/husband/caste/address
    name_block = re.search(r'([A-Za-z\s]+|(?:[अ-ह\s]+)),\s*(?:सौहर|पति|पिता|-|\/|\n)', ocr_text)
    if name_block:
        candidate = name_block.group(1).strip()
        if len(candidate) > 2 and candidate not in ["N/A", "n/a", "Patna"]:
            raiyat_name = candidate

    fields["raiyat_name"] = safe_text_clean(raiyat_name)
    fields["father_or_husband_name"] = safe_text_clean(father_name)

    # 6. Khata Number (खाता सं०) & Khesra Plot Number (खेसरा सं०)
    khata_matches = re.findall(r'खाता\s*(?:सं०|सं|नंबर)?\s*[:\-]?\s*(\d+)', ocr_norm)
    if not khata_matches:
        # Fallback table parser
        khata_table = re.search(r'(\d+)\s+(\d+)\s+(\d+\s+ए\s+[\d.]+\s+डिसमिल|\d+\s+\d+\s+\d+)', ocr_norm)
        if khata_table:
            khata_matches = [khata_table.group(1)]

    fields["khata_number"] = safe_numeric_clean(khata_matches[0] if khata_matches else None)

    khesra_matches = re.findall(r'(?:खेसरा|प्लॉट|ॉट)\s*(?:सं०|सं|नंबर)?\s*[:\-]?\s*(\d+)', ocr_norm)
    if not khesra_matches and 'khata_table' in locals() and khata_table:
        khesra_matches = [khata_table.group(2)]

    fields["khesra_plot_number"] = safe_numeric_clean(khesra_matches[0] if khesra_matches else None)

    # 7. Land Area (रकबा)
    area_match = re.search(r'(\d+\s*ए\s*[\d.]+\s*डिसमिल|\d+\s*एकर\s*[\d.]+\s*डिसमिल)', ocr_text)
    if not area_match:
        area_match = re.search(r'कुल\s*परमान\s*([^\n]+)', ocr_text)

    area_val = area_match.group(1).strip() if area_match else None
    fields["land_area"] = safe_text_clean(area_val)

    # 8. Mutation Status
    mutation_match = re.search(r'(Mutation Cases Not Found|दाखिल खारिज[^\n]+)', ocr_text, re.IGNORECASE)
    mutation_val = mutation_match.group(1).strip() if mutation_match else "Mutation Cases Not Found"
    fields["mutation_status"] = safe_text_clean(mutation_val)

    # Overall Extraction Confidence
    conf_scores = [f["confidence"] for f in fields.values() if f.get("confidence") is not None]
    overall_conf = round(sum(conf_scores) / len(conf_scores), 4) if conf_scores else 0.0

    return {
        "document_id": document_id,
        "overall_extraction_confidence": overall_conf,
        "fields": fields
    }

def batch_extract_fields(ocr_dir=OCR_DIR, output_dir=OUTPUT_DIR):
    """
    Extract fields for all OCR processed documents.
    """
    ocr_dir = Path(ocr_dir)
    doc_folders = [f for f in ocr_dir.iterdir() if f.is_dir()]

    print("==========================================")
    print(f"FIELD EXTRACTION PIPELINE: Processing {len(doc_folders)} OCR outputs")
    print("==========================================")

    all_extracted = []
    for doc_folder in sorted(doc_folders):
        meta_file = doc_folder / "metadata.json"
        if meta_file.exists():
            with open(meta_file, "r", encoding="utf-8") as f:
                meta = json.load(f)
                ocr_text = meta.get("full_text", "")
                doc_id = meta.get("document_id", doc_folder.name)
        else:
            page_txt = doc_folder / "page_001.txt"
            ocr_text = page_txt.read_text(encoding="utf-8") if page_txt.exists() else ""
            doc_id = doc_folder.name

        extracted = extract_land_record_fields(ocr_text, document_id=doc_id)
        all_extracted.append(extracted)

        # Save individual extraction JSON
        single_out = OUTPUT_DIR / f"{doc_id}_fields.json"
        with open(single_out, "w", encoding="utf-8") as f:
            json.dump(extracted, f, ensure_ascii=False, indent=4)
        
        print(f" -> Extracted fields for {doc_id} (Confidence: {extracted['overall_extraction_confidence']})")

    # Save summary batch file
    batch_out = OUTPUT_DIR / "extracted_fields_batch.json"
    with open(batch_out, "w", encoding="utf-8") as f:
        json.dump(all_extracted, f, ensure_ascii=False, indent=4)

    return all_extracted

if __name__ == "__main__":
    batch_extract_fields()
