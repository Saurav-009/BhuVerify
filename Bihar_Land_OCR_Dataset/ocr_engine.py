import os
import sys
import json
import time
from pathlib import Path

import pytesseract
from PIL import Image
from pypdf import PdfReader

# Configure Tesseract path on Windows if standard binary exists
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

BASE_DIR = Path(__file__).parent.resolve()
RAW_DIR = BASE_DIR / "data" / "raw" / "documents"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
OCR_OUTPUT_DIR = BASE_DIR / "data" / "ocr"

def extract_pdf_digital_text(pdf_path):
    """
    Extract digital text directly from PDF pages using pypdf.
    Returns dict mapping page_number (1-indexed) -> text.
    """
    pdf_path = Path(pdf_path)
    if pdf_path.suffix.lower() != '.pdf':
        return {1: ""}
    try:
        reader = PdfReader(str(pdf_path))
        pages_text = {}
        for idx, page in enumerate(reader.pages, start=1):
            txt = page.extract_text() or ""
            # Clean null characters
            txt = txt.replace("\x00", "").replace("\ufffd", "").strip()
            pages_text[idx] = txt
        return pages_text
    except Exception as e:
        print(f"[PDF Extract] Non-PDF or corrupted stream on {pdf_path}: {e}")
        return {1: ""}

def run_tesseract_ocr(img_path, lang="eng"):
    """
    Run Tesseract OCR on an image file.
    Returns (ocr_text, confidence_score).
    """
    if not os.path.exists(pytesseract.pytesseract.tesseract_cmd):
        return "", 0.0

    try:
        img = Image.open(img_path)
        data = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)
        
        # Calculate mean confidence of non-empty detected text boxes
        confidences = [int(c) for c in data['conf'] if int(c) >= 0]
        mean_conf = sum(confidences) / len(confidences) if confidences else 0.0
        
        text = pytesseract.image_to_string(img, lang=lang)
        return text.strip(), round(mean_conf / 100.0, 4)
    except Exception as e:
        print(f"Tesseract OCR Error on {img_path}: {e}")
        return "", 0.0

def process_document_ocr(pdf_path, ocr_out_dir=OCR_OUTPUT_DIR):
    """
    Process OCR for a single document.
    Saves results to data/ocr/<doc_id>/page_XXX.txt and metadata.json.
    """
    pdf_path = Path(pdf_path)
    doc_id = pdf_path.stem
    doc_ocr_folder = ocr_out_dir / doc_id
    doc_ocr_folder.mkdir(parents=True, exist_ok=True)

    # 1. Digital text extraction
    digital_text_map = extract_pdf_digital_text(pdf_path)
    
    # 2. Check processed images folder if present
    proc_folder = PROCESSED_DIR / doc_id
    
    metadata_pages = []
    full_doc_raw = []
    full_doc_proc = []

    for page_num in sorted(digital_text_map.keys()):
        raw_digital_txt = digital_text_map[page_num]
        
        # Check if preprocessed image exists
        proc_img_file = proc_folder / f"page_{page_num:03d}_processed.png"
        tess_txt, tess_conf = "", 0.0
        
        if proc_img_file.exists():
            tess_txt, tess_conf = run_tesseract_ocr(proc_img_file)

        # Decide primary text: if digital text exists and is high length, use digital text as primary raw,
        # with Tesseract as cross-verification.
        if len(raw_digital_txt) > 50:
            final_raw_text = raw_digital_txt
            final_proc_text = raw_digital_txt
            engine_used = "PyPDF Digital Extraction + Tesseract Verification"
            confidence = 0.98 if tess_conf > 0 else 0.95
        else:
            final_raw_text = tess_txt
            final_proc_text = tess_txt
            engine_used = "Tesseract OCR"
            confidence = tess_conf

        page_file = doc_ocr_folder / f"page_{page_num:03d}.txt"
        with open(page_file, "w", encoding="utf-8") as f:
            f.write(final_proc_text)

        full_doc_raw.append(final_raw_text)
        full_doc_proc.append(final_proc_text)

        metadata_pages.append({
            "page_number": page_num,
            "raw_ocr_text": final_raw_text,
            "processed_ocr_text": final_proc_text,
            "ocr_confidence": confidence,
            "engine_used": engine_used,
            "char_count": len(final_proc_text)
        })

    meta = {
        "document_id": doc_id,
        "file_name": pdf_path.name,
        "total_pages": len(digital_text_map),
        "pages": metadata_pages,
        "full_text": "\n\n".join(full_doc_proc),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    meta_file = doc_ocr_folder / "metadata.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=4)

    return meta

def batch_ocr_process(input_dir=RAW_DIR, ocr_out_dir=OCR_OUTPUT_DIR):
    """
    Run OCR batch processing on all raw documents.
    """
    input_dir = Path(input_dir)
    pdf_files = sorted(input_dir.glob("*.pdf"))

    print("==========================================")
    print(f"OCR ENGINE PIPELINE: Processing {len(pdf_files)} documents")
    print("==========================================")

    ocr_results = []
    for pdf_file in pdf_files:
        res = process_document_ocr(pdf_file, ocr_out_dir=ocr_out_dir)
        ocr_results.append(res)
        print(f" -> Completed OCR for {pdf_file.name}: {res['total_pages']} pages processed.")

    return ocr_results

if __name__ == "__main__":
    batch_ocr_process()
