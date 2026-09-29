import os
import json
import time
from pathlib import Path
import pandas as pd

from preprocess import process_single_document
from ocr_engine import process_document_ocr
from extractor import extract_land_record_fields
from matching import match_extracted_to_reference

BASE_DIR = Path(__file__).parent.resolve()
RAW_DIR = BASE_DIR / "data" / "raw" / "documents"
OUTPUT_DIR = BASE_DIR / "data" / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
CHECKPOINT_FILE = OUTPUT_DIR / "batch_checkpoint.json"
REF_CSV = BASE_DIR / "data" / "reference" / "bihar_records_clean.csv"

def load_checkpoint():
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"processed_documents": {}, "last_updated": ""}

def save_checkpoint(ckpt):
    ckpt["last_updated"] = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(ckpt, f, ensure_ascii=False, indent=4)

def run_resumable_batch_pipeline():
    print("==========================================")
    print("BATCH PROCESSING PIPELINE (RESUMABLE)")
    print("==========================================")

    pdf_files = sorted(RAW_DIR.glob("*.pdf"))
    if not pdf_files:
        print("ERROR: No raw documents found in data/raw/documents/")
        return

    ckpt = load_checkpoint()
    processed_dict = ckpt.get("processed_documents", {})

    df_ref = pd.read_csv(REF_CSV) if REF_CSV.exists() else pd.DataFrame()
    ref_dict = {row["document_id"]: row.to_dict() for _, row in df_ref.iterrows()} if not df_ref.empty else {}

    results = []

    for idx, pdf_file in enumerate(pdf_files, start=1):
        doc_id = pdf_file.stem
        
        # Checkpoint check for resumability
        if doc_id in processed_dict and processed_dict[doc_id].get("status") == "SUCCESS":
            print(f"[{idx}/{len(pdf_files)}] Skipping already completed document: {doc_id}")
            results.append(processed_dict[doc_id]["result"])
            continue

        print(f"[{idx}/{len(pdf_files)}] Processing document: {pdf_file.name}...")
        
        try:
            # 1. Preprocess
            proc_info = process_single_document(pdf_file)
            
            # 2. OCR Engine
            ocr_info = process_document_ocr(pdf_file)
            ocr_text = ocr_info.get("full_text", "")

            # 3. Field Extraction
            ext_info = extract_land_record_fields(ocr_text, document_id=doc_id)

            # 4. Reference Matching
            ref_rec = ref_dict.get(doc_id, {})
            match_info = match_extracted_to_reference(ext_info, ref_rec)

            doc_summary = {
                "document_id": doc_id,
                "file_name": pdf_file.name,
                "total_pages": ocr_info.get("total_pages", 1),
                "extracted_fields": {k: v.get("corrected") for k, v in ext_info["fields"].items()},
                "overall_confidence": match_info["overall_confidence"],
                "verification_status": match_info["status"],
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }

            # Update checkpoint
            processed_dict[doc_id] = {
                "status": "SUCCESS",
                "result": doc_summary
            }
            ckpt["processed_documents"] = processed_dict
            save_checkpoint(ckpt)

            results.append(doc_summary)
            print(f"  -> Completed: Status={doc_summary['verification_status']}, Conf={doc_summary['overall_confidence']}")

        except Exception as e:
            print(f"  -> ERROR processing {doc_id}: {e}")
            processed_dict[doc_id] = {
                "status": "FAILED",
                "error": str(e)
            }
            ckpt["processed_documents"] = processed_dict
            save_checkpoint(ckpt)

    summary_file = OUTPUT_DIR / "final_batch_results.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=4)

    print("\nBatch processing complete:")
    print(f"  - Total Documents Processed: {len(results)}")
    print(f"  - Summary Saved to: {summary_file.relative_to(BASE_DIR)}")

    return results

if __name__ == "__main__":
    run_resumable_batch_pipeline()
