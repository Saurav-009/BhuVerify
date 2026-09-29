import os
import json
import csv
import shutil

from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw" / "documents"
REF_CSV = DATA_DIR / "reference" / "bihar_records_clean.csv"

TRAIN_DIR = DATA_DIR / "train"
VAL_DIR = DATA_DIR / "validation"
TEST_DIR = DATA_DIR / "test"

def perform_dataset_split(train_ratio=0.70, val_ratio=0.15, test_ratio=0.15):
    print("==========================================")
    print("DATASET SPLIT PIPELINE (Document-Level)")
    print("==========================================")
    
    for d in [TRAIN_DIR, VAL_DIR, TEST_DIR]:
        d.mkdir(parents=True, exist_ok=True)

    pdf_files = sorted(RAW_DIR.glob("*.pdf"))
    total_docs = len(pdf_files)
    
    if total_docs == 0:
        print("ERROR: No PDF documents found in raw directory!")
        return

    # Calculate exact counts for 10 documents: 7 train, 1 val, 2 test
    n_train = max(1, int(total_docs * train_ratio))  # 7
    n_val = max(1, int(total_docs * val_ratio))      # 1
    n_test = total_docs - n_train - n_val            # 2

    train_files = pdf_files[:n_train]
    val_files = pdf_files[n_train:n_train + n_val]
    test_files = pdf_files[n_train + n_val:]

    def copy_split_files(files_list, target_dir):
        split_records = []
        for pdf_file in files_list:
            doc_id = pdf_file.stem
            dest_pdf = target_dir / pdf_file.name
            shutil.copy2(pdf_file, dest_pdf)
            
            # Copy corresponding annotation if present
            ann_file = DATA_DIR / "annotations" / f"{doc_id}.json"
            if ann_file.exists():
                shutil.copy2(ann_file, target_dir / ann_file.name)

            split_records.append(doc_id)
        return split_records

    train_ids = copy_split_files(train_files, TRAIN_DIR)
    val_ids = copy_split_files(val_files, VAL_DIR)
    test_ids = copy_split_files(test_files, TEST_DIR)

    split_manifest = {
        "total_documents": total_docs,
        "split_counts": {
            "train": len(train_ids),
            "validation": len(val_ids),
            "test": len(test_ids)
        },
        "splits": {
            "train": train_ids,
            "validation": val_ids,
            "test": test_ids
        },
        "leakage_check": {
            "intersection_train_val": len(set(train_ids).intersection(set(val_ids))),
            "intersection_train_test": len(set(train_ids).intersection(set(test_ids))),
            "intersection_val_test": len(set(val_ids).intersection(set(test_ids))),
            "passed": len(set(train_ids).intersection(set(val_ids))) == 0 and len(set(train_ids).intersection(set(test_ids))) == 0
        }
    }

    manifest_file = DATA_DIR / "dataset_split_manifest.json"
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(split_manifest, f, ensure_ascii=False, indent=4)

    print(f"Dataset split complete:")
    print(f"  - Train Documents ({len(train_ids)}): {train_ids}")
    print(f"  - Validation Documents ({len(val_ids)}): {val_ids}")
    print(f"  - Test Documents ({len(test_ids)}): {test_ids}")
    print(f"  - Data Leakage Check: {'PASSED (Zero Leakage)' if split_manifest['leakage_check']['passed'] else 'FAILED'}")

    return split_manifest

if __name__ == "__main__":
    perform_dataset_split()
