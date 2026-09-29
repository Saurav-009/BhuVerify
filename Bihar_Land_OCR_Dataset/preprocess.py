import os
import sys
import math
from pathlib import Path
from PIL import Image

try:
    import fitz  # PyMuPDF
    FITZ_AVAILABLE = True
except ImportError:
    FITZ_AVAILABLE = False

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

from pypdf import PdfReader

BASE_DIR = Path(__file__).parent.resolve()
RAW_DIR = BASE_DIR / "data" / "raw" / "documents"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

def convert_pdf_to_images_fitz(pdf_path, dpi=300):
    """Render PDF pages to PIL Images at 300 DPI using PyMuPDF."""
    doc = fitz.open(pdf_path)
    images = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)
    return images

def preprocess_image_cv2(pil_img):
    """
    Apply computer vision preprocessing:
    - Grayscale
    - CLAHE Contrast Enhancement
    - Noise Removal (Median Blur)
    - Thresholding / Binarization
    """
    if not CV2_AVAILABLE:
        # Fallback to PIL grayscale & contrast if OpenCV not installed
        gray = pil_img.convert("L")
        return gray

    # Convert PIL Image to OpenCV BGR array
    img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    
    # 1. Grayscale
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    
    # 2. Noise Removal
    denoised = cv2.medianBlur(gray, 3)
    
    # 3. Contrast Enhancement (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    contrast = clahe.apply(denoised)
    
    # 4. Otsu Adaptive Thresholding
    _, binarized = cv2.threshold(contrast, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Return processed image as PIL Image
    return Image.fromarray(binarized)

def process_single_document(pdf_path, output_dir=PROCESSED_DIR):
    """
    Preprocess a single PDF or image document.
    """
    pdf_path = Path(pdf_path)
    doc_id = pdf_path.stem
    doc_out = output_dir / doc_id
    doc_out.mkdir(parents=True, exist_ok=True)

    results = []

    if pdf_path.suffix.lower() == ".pdf":
        if FITZ_AVAILABLE:
            raw_images = convert_pdf_to_images_fitz(pdf_path, dpi=300)
        else:
            print(f"PyMuPDF fitz not available for {pdf_path.name}, skipping visual image extraction.")
            raw_images = []

        for idx, raw_img in enumerate(raw_images, start=1):
            raw_img_path = doc_out / f"page_{idx:03d}_raw.png"
            proc_img_path = doc_out / f"page_{idx:03d}_processed.png"

            raw_img.save(raw_img_path)
            proc_img = preprocess_image_cv2(raw_img)
            proc_img.save(proc_img_path)

            results.append({
                "page_number": idx,
                "raw_image_path": str(raw_img_path.relative_to(BASE_DIR)),
                "processed_image_path": str(proc_img_path.relative_to(BASE_DIR)),
                "width": raw_img.width,
                "height": raw_img.height
            })
    return {
        "document_id": doc_id,
        "pages_processed": len(results),
        "pages": results
    }

def batch_preprocess(input_dir=RAW_DIR, output_dir=PROCESSED_DIR):
    """
    Batch process all raw document PDFs/images.
    """
    input_dir = Path(input_dir)
    pdf_files = sorted(input_dir.glob("*.pdf"))
    
    print("==========================================")
    print(f"PREPROCESSING PIPELINE: Processing {len(pdf_files)} documents")
    print("==========================================")

    batch_summary = []
    for pdf_file in pdf_files:
        res = process_single_document(pdf_file, output_dir=output_dir)
        batch_summary.append(res)
        print(f" -> Processed {pdf_file.name}: {res['pages_processed']} pages rendered & enhanced.")

    return batch_summary

if __name__ == "__main__":
    batch_preprocess()
