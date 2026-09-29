import os
import json
import csv
from pathlib import Path
import pandas as pd
from matching import match_extracted_to_reference, fuzzy_similarity

BASE_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = BASE_DIR / "data" / "outputs"
EVAL_DIR = BASE_DIR / "evaluation"
EVAL_DIR.mkdir(parents=True, exist_ok=True)
REF_CSV = BASE_DIR / "data" / "reference" / "bihar_records_clean.csv"

def evaluate_pipeline():
    print("==========================================")
    print("PIPELINE EVALUATION & ERROR ANALYSIS")
    print("==========================================")

    batch_file = OUTPUT_DIR / "extracted_fields_batch.json"
    if not batch_file.exists():
        print("ERROR: Extracted fields batch file missing!")
        return

    with open(batch_file, "r", encoding="utf-8") as f:
        extracted_batch = json.load(f)

    df_ref = pd.read_csv(REF_CSV)
    ref_dict = {row["document_id"]: row.to_dict() for _, row in df_ref.iterrows()}

    eval_rows = []
    error_analysis_rows = []

    total_fields_evaluated = 0
    exact_matches = 0
    fuzzy_matches_above_80 = 0

    for ext_doc in extracted_batch:
        doc_id = ext_doc["document_id"]
        ref_rec = ref_dict.get(doc_id, {})
        
        match_result = match_extracted_to_reference(ext_doc, ref_rec)
        
        doc_exact = 0
        doc_fields = 0

        for field_name, score_info in match_result["field_scores"].items():
            ext_val = score_info["extracted"]
            ref_val = score_info["reference"]
            score = score_info["score"]

            if ref_val is not None and str(ref_val).strip() not in ["None", "nan", "", "[]"]:
                total_fields_evaluated += 1
                doc_fields += 1
                if score == 1.0:
                    exact_matches += 1
                    doc_exact += 1
                if score >= 0.8:
                    fuzzy_matches_above_80 += 1

                if score < 1.0:
                    error_analysis_rows.append({
                        "document_id": doc_id,
                        "field_name": field_name,
                        "extracted_val": ext_val,
                        "reference_gt_val": ref_val,
                        "match_score": score,
                        "error_type": "Exact Mismatch" if score == 0.0 else "Partial/Fuzzy Match"
                    })

        eval_rows.append({
            "document_id": doc_id,
            "overall_confidence": match_result["overall_confidence"],
            "verification_status": match_result["status"],
            "fields_evaluated": doc_fields,
            "exact_matches": doc_exact
        })

    # Metrics computation
    exact_match_accuracy = round(exact_matches / total_fields_evaluated, 4) if total_fields_evaluated > 0 else 1.0
    fuzzy_accuracy = round(fuzzy_matches_above_80 / total_fields_evaluated, 4) if total_fields_evaluated > 0 else 1.0
    
    # Precision, Recall, F1 for verified status
    tp = sum(1 for r in eval_rows if r["verification_status"] == "VERIFIED")
    fp = sum(1 for r in eval_rows if r["verification_status"] == "MISMATCH")
    fn = sum(1 for r in eval_rows if r["verification_status"] == "INSUFFICIENT DATA")

    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 1.0
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 1.0
    f1_score = round(2 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 1.0

    metrics = {
        "total_documents_evaluated": len(extracted_batch),
        "total_fields_evaluated": total_fields_evaluated,
        "exact_match_accuracy": exact_match_accuracy,
        "fuzzy_match_accuracy": fuzzy_accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1_score,
        "verification_status_counts": pd.DataFrame(eval_rows)["verification_status"].value_counts().to_dict()
    }

    # Save evaluation/metrics.json
    with open(EVAL_DIR / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=4)

    # Save evaluation/metrics.csv
    df_eval = pd.DataFrame(eval_rows)
    df_eval.to_csv(EVAL_DIR / "metrics.csv", index=False, encoding="utf-8-sig")

    # Save evaluation/error_analysis.csv
    df_err = pd.DataFrame(error_analysis_rows)
    df_err.to_csv(EVAL_DIR / "error_analysis.csv", index=False, encoding="utf-8-sig")

    # Generate evaluation/evaluation_report.md
    report_md = f"""# Land Record Digitization & Verification System — Evaluation Report

## Evaluation Metrics Summary

- **Total Documents Evaluated**: {metrics['total_documents_evaluated']}
- **Total Fields Evaluated**: {metrics['total_fields_evaluated']}
- **Exact Match Accuracy**: {metrics['exact_match_accuracy'] * 100:.2f}%
- **Fuzzy Match Accuracy (>= 80% similarity)**: {metrics['fuzzy_match_accuracy'] * 100:.2f}%
- **Precision**: {metrics['precision'] * 100:.2f}%
- **Recall**: {metrics['recall'] * 100:.2f}%
- **F1 Score**: {metrics['f1_score'] * 100:.2f}%

---

## Verification Status Summary
```json
{json.dumps(metrics['verification_status_counts'], indent=2)}
```

---

## Error Analysis & Field Discrepancies
Below is the empirical error report listing discrepancies between extracted OCR values and reference records:

| Document ID | Field Name | Extracted OCR Value | Reference GT Value | Score | Error Type |
|---|---|---|---|---|---|
"""
    for err in error_analysis_rows:
        report_md += f"| `{err['document_id']}` | `{err['field_name']}` | `{err['extracted_val']}` | `{err['reference_gt_val']}` | {err['match_score']} | {err['error_type']} |\n"

    with open(EVAL_DIR / "evaluation_report.md", "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"Evaluation complete:")
    print(f"  - Exact Match Accuracy: {exact_match_accuracy * 100:.2f}%")
    print(f"  - Fuzzy Match Accuracy: {fuzzy_accuracy * 100:.2f}%")
    print(f"  - F1 Score: {f1_score * 100:.2f}%")
    print(f"  - Saved Evaluation Artifacts to {EVAL_DIR.relative_to(BASE_DIR)}")

    return metrics

if __name__ == "__main__":
    evaluate_pipeline()
