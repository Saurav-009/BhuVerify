# Intelligent Land Record Digitization & Validation System
### SIH Prototype — Bihar Land Records (Jamabandi Register-II)

A complete, reproducible OCR, information extraction, fuzzy reference matching, and verification system designed around Bihar Jamabandi Land Records.

---

## Quick Start Commands

### 1. Environment Setup & Installation
```bash
python -m pip install -r requirements.txt
```

### 2. Run Complete Pipeline (Resumable)
```bash
python process_dataset.py
```

### 3. Run Pipeline Evaluation
```bash
python evaluator.py
```

### 4. Start Backend API & Web Verification UI
```bash
python server.py
```
*Access Web Verification Portal at:* `http://localhost:8000`

---

## Core System Architecture & Directory Layout

```
Bihar_Land_OCR_Dataset/
├── data/
│   ├── raw/                # Read-only original PDFs & annotations
│   ├── processed/          # Preprocessed 300 DPI images (CLAHE contrast, noise filter)
│   ├── ocr/                # Per-document page OCR outputs & metadata.json
│   ├── reference/          # Reference ground-truth CSVs (bihar_records.csv, clean.csv)
│   ├── train/              # Document-level training split (70%)
│   ├── validation/         # Document-level validation split (15%)
│   ├── test/               # Document-level testing split (15%)
│   └── outputs/            # Extracted fields, ML models, batch results
├── evaluation/             # Metrics, confusion matrix, error analysis
├── demo/                   # Real sample demonstrations (sample_01, 02, 03)
├── frontend/               # Glassmorphism Web Verification UI (HTML/CSS/JS)
├── preprocess.py           # Image preprocessing pipeline (PyMuPDF + OpenCV)
├── ocr_engine.py           # Hybrid PyPDF digital text + PyTesseract engine
├── extractor.py            # Bihar land record regex & layout field extractor
├── normalizer.py           # Devanagari ↔ Arabic digit & OCR error normalizer
├── matching.py             # Fuzzy token matching & field-level confidence scorer
├── ml_validator.py         # Lightweight ML Random Forest verification classifier
├── evaluator.py            # Metrics evaluation & error analysis generator
├── process_dataset.py      # Resumable batch processing engine
└── server.py               # FastAPI server serving POST /api/land-record/analyze
```

---

## System Workflow & Verification Statuses

1. **Preprocessing**: Converts PDF pages to 300 DPI images, applies grayscale, noise filtering (median blur), CLAHE contrast enhancement, and adaptive thresholding.
2. **Hybrid OCR**: Combines direct PDF digital text layer with PyTesseract OCR verification.
3. **Field Extraction**: Extracts computerized 15-digit Jamabandi numbers, Khata, Khesra/Plot numbers, Raiyat names, Mauja, Anchal, and Area.
4. **Digit & Text Normalization**: Maps Devanagari Hindi digits (`०-९`) to standard Arabic numerals (`0-9`) and fixes ambiguous OCR character confusion.
5. **Fuzzy Matching**: Computes exact digit matches for land identifiers and token fuzzy similarity for Raiyat/Owner names against reference database.
6. **Status Categories**:
   - `VERIFIED`: Exact primary identifier match with high confidence (>= 85%).
   - `PARTIALLY VERIFIED`: Partial field match (70% - 84%).
   - `MISMATCH`: Field dissimilarity or identifier conflict (< 70%).
   - `INSUFFICIENT DATA`: Unreadable or missing key fields.

---

## Documentation Index

- [SETUP.md](file:///e:/Bihar_Land_OCR_Dataset/SETUP.md) — Detailed environment setup guide
- [DATASET_REPORT.md](file:///e:/Bihar_Land_OCR_Dataset/DATASET_REPORT.md) — Dataset audit & schema analysis
- [MODEL_REPORT.md](file:///e:/Bihar_Land_OCR_Dataset/MODEL_REPORT.md) — Machine learning model & architecture breakdown
- [API_DOCUMENTATION.md](file:///e:/Bihar_Land_OCR_Dataset/API_DOCUMENTATION.md) — REST API endpoint specification
- [EVALUATION_REPORT.md](file:///e:/Bihar_Land_OCR_Dataset/evaluation/evaluation_report.md) — Empirical evaluation metrics & error analysis
- [FINAL_DATASET_REPORT.md](file:///e:/Bihar_Land_OCR_Dataset/FINAL_DATASET_REPORT.md) — Final summary report
