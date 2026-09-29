# Machine Learning & Verification Model Report

## Overview & Architecture Philosophy

The Bihar Land Record Validation System employs a modular multi-tier verification approach:

1. **Deterministic & Rule-Based Baseline Engine**:
   - Exact digit matching for key numeric land identifiers (15-digit Computerized Jamabandi Number, Khata Number, Khesra Plot Number).
   - Hindi Devanagari ↔ Arabic digit mapping (`०-९` -> `0-9`).
   - Token set fuzzy string similarity for Raiyat/Owner names and Mauja/Village names.

2. **Lightweight ML Verification Classifier (`ml_validator.py`)**:
   - Model Type: `RandomForestClassifier` (Scikit-Learn).
   - Feature Dimension: 8-dimensional feature vector.
   - Purpose: Classify record verification status into `VERIFIED`, `PARTIALLY VERIFIED`, `MISMATCH`, `INSUFFICIENT DATA`.

---

## Feature Vector Representation

| Feature Index | Feature Name | Description | Range |
|---|---|---|---|
| `f0` | `computerized_jamabandi_present` | Indicator if 15-digit computerized number was extracted | `0.0` or `1.0` |
| `f1` | `computerized_jamabandi_match` | Exact digit match score against reference database | `[0.0, 1.0]` |
| `f2` | `jamabandi_match` | Match score for standard Jamabandi number | `[0.0, 1.0]` |
| `f3` | `khata_match` | Match score for Khata number (खाता सं०) | `[0.0, 1.0]` |
| `f4` | `khesra_match` | Match score for Khesra/Plot number (खेसरा सं०) | `[0.0, 1.0]` |
| `f5` | `raiyat_fuzzy_similarity` | Token fuzzy similarity score for Raiyat name | `[0.0, 1.0]` |
| `f6` | `mauja_match` | Fuzzy match score for Mauja/Village | `[0.0, 1.0]` |
| `f7` | `overall_extraction_confidence` | Mean OCR and field extraction confidence | `[0.0, 1.0]` |

---

## Training Rationale & Anti-Fabrication Policy

- **No Synthetic Deep Learning Training**: With 10 sample documents, attempting to train a 50-million parameter vision transformer or deep learning network from scratch would lead to extreme overfitting and fake claims.
- **Model Artifact Location**: Saved at [record_validation_model.joblib](file:///e:/Bihar_Land_OCR_Dataset/data/outputs/record_validation_model.joblib) and [model_summary.json](file:///e:/Bihar_Land_OCR_Dataset/data/outputs/model_summary.json).
- **Scalability**: The architecture is designed so that when larger dataset batches are ingested, `ml_validator.py` can be re-run directly without changing the system interface.
