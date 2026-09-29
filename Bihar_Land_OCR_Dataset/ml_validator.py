import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier

from matching import match_extracted_to_reference, fuzzy_similarity, exact_digit_match

BASE_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = BASE_DIR / "data" / "outputs"
REF_CSV = BASE_DIR / "data" / "reference" / "bihar_records_clean.csv"

def extract_feature_vector(extracted_fields: dict, ref_record: dict) -> np.ndarray:
    """
    Construct numeric feature vector for ML verification classification:
    - f0: Computerized Jamabandi Present (0/1)
    - f1: Computerized Jamabandi Match (0-1)
    - f2: Jamabandi Match Score (0-1)
    - f3: Khata Match Score (0-1)
    - f4: Khesra Match Score (0-1)
    - f5: Raiyat Name Fuzzy Score (0-1)
    - f6: Mauja Match Score (0-1)
    - f7: Overall Extraction Confidence (0-1)
    """
    ext = extracted_fields.get("fields", {})
    comp_ext = ext.get("computerized_jamabandi_number", {}).get("corrected")
    comp_ref = ref_record.get("computerized_jamabandi_number")
    
    comp_present = 1.0 if comp_ext else 0.0
    comp_match = exact_digit_match(comp_ext, comp_ref)
    
    jam_match = exact_digit_match(ext.get("jamabandi_number", {}).get("corrected"), ref_record.get("jamabandi_number"))
    khata_match = exact_digit_match(ext.get("khata_number", {}).get("corrected"), ref_record.get("khata_number"))
    khesra_match = exact_digit_match(ext.get("khesra_plot_number", {}).get("corrected"), ref_record.get("khesra_plot_number"))
    raiyat_fuzzy = fuzzy_similarity(ext.get("raiyat_name", {}).get("corrected"), ref_record.get("raiyat_name"))
    mauja_match = fuzzy_similarity(ext.get("mauja", {}).get("corrected"), ref_record.get("mauja"))
    ext_conf = extracted_fields.get("overall_extraction_confidence", 0.8)

    return np.array([comp_present, comp_match, jam_match, khata_match, khesra_match, raiyat_fuzzy, mauja_match, ext_conf])

def train_and_save_ml_validator():
    """
    Train a Random Forest classifier on dataset feature vectors to classify status.
    """
    print("==========================================")
    print("LIGHTWEIGHT ML VALIDATOR TRAINING")
    print("==========================================")

    # Load extracted fields batch & reference records
    batch_file = OUTPUT_DIR / "extracted_fields_batch.json"
    if not batch_file.exists():
        print(f"Error: {batch_file} not found! Run extractor.py first.")
        return

    with open(batch_file, "r", encoding="utf-8") as f:
        extracted_batch = json.load(f)

    df_ref = pd.read_csv(REF_CSV)
    ref_dict = {row["document_id"]: row.to_dict() for _, row in df_ref.iterrows()}

    X = []
    y = []

    for ext_doc in extracted_batch:
        doc_id = ext_doc["document_id"]
        ref_rec = ref_dict.get(doc_id, {})
        
        # Calculate ground truth match result
        match_res = match_extracted_to_reference(ext_doc, ref_rec)
        feat = extract_feature_vector(ext_doc, ref_rec)
        
        X.append(feat)
        y.append(match_res["status"])

    X = np.array(X)
    y = np.array(y)

    # Train lightweight Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=10, random_state=42)
    clf.fit(X, y)

    # Save model
    model_path = OUTPUT_DIR / "record_validation_model.joblib"
    joblib.dump(clf, model_path)

    # Save model metadata summary
    summary = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 10,
        "features": [
            "computerized_jamabandi_present",
            "computerized_jamabandi_match",
            "jamabandi_match",
            "khata_match",
            "khesra_match",
            "raiyat_fuzzy_similarity",
            "mauja_match",
            "overall_extraction_confidence"
        ],
        "target_classes": list(clf.classes_),
        "trained_samples": len(X),
        "train_accuracy": float(clf.score(X, y)),
        "model_file": str(model_path.relative_to(BASE_DIR))
    }

    summary_path = OUTPUT_DIR / "model_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=4)

    print(f"Trained lightweight ML validator model successfully!")
    print(f"  - Trained Samples: {len(X)}")
    print(f"  - Target Classes: {list(clf.classes_)}")
    print(f"  - Model Accuracy: {summary['train_accuracy'] * 100:.1f}%")
    print(f"  - Saved Model Artifact: {model_path.relative_to(BASE_DIR)}")

    return clf, summary

if __name__ == "__main__":
    train_and_save_ml_validator()
