# Setup & Installation Guide

This document outlines how to set up and run the Bihar Land Record Digitization & Validation System on a clean machine.

## Prerequisites

1. **Python**: Python 3.10+ installed and added to system PATH.
2. **Tesseract OCR**:
   - Download Tesseract Windows installer from UB-Mannheim: `tesseract-ocr-w64-setup-v5.3.x.exe`.
   - Install to standard location: `C:\Program Files\Tesseract-OCR\tesseract.exe`.
   - Note: The system automatically detects Tesseract at `C:\Program Files\Tesseract-OCR\tesseract.exe`.

## Step-by-Step Installation

### 1. Clone / Open Project Workspace
Navigating to project root:
```bash
cd e:\Bihar_Land_OCR_Dataset
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Verify System Installation
Run environment check script:
```bash
python audit_and_setup_phase1_2.py
```

### 4. Run Complete Processing Pipeline
```bash
python process_dataset.py
```

### 5. Launch Backend Server & UI
```bash
python server.py
```
Open web browser at `http://localhost:8000`.
