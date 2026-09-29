import json
import csv
from pathlib import Path

BASE_DIR = Path(__file__).parent

PDF_DIR = BASE_DIR / "documents"
TXT_DIR = BASE_DIR / "extracted_text"
JSON_DIR = BASE_DIR / "ground_truth"
CSV_FILE = BASE_DIR / "master_dataset.csv"

print("\n==============================")
print("DATASET VALIDATION")
print("==============================")

errors = []

# -----------------------------
# Check PDFs
# -----------------------------
pdfs = sorted(PDF_DIR.glob("*.pdf"))
print(f"\nPDF files: {len(pdfs)}")

# -----------------------------
# Check TXT files
# -----------------------------
txts = sorted(TXT_DIR.glob("*.txt"))
print(f"TXT files: {len(txts)}")

# -----------------------------
# Check JSON files
# -----------------------------
jsons = sorted(JSON_DIR.glob("*.json"))
print(f"JSON files: {len(jsons)}")

# -----------------------------
# Validate JSON ↔ PDF ↔ TXT
# -----------------------------
document_ids = []

for json_file in jsons:

    try:
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        document_id = data.get("document_id")
        file_name = data.get("file_name")

        document_ids.append(document_id)

        if not document_id:
            errors.append(f"{json_file.name}: missing document_id")

        if not file_name:
            errors.append(f"{json_file.name}: missing file_name")

        # Check PDF
        if file_name:
            pdf_path = PDF_DIR / file_name

            if not pdf_path.exists():
                errors.append(
                    f"{json_file.name}: PDF missing -> {file_name}"
                )

        # Check TXT
        if document_id:
            txt_path = TXT_DIR / f"{document_id}.txt"

            if not txt_path.exists():
                errors.append(
                    f"{json_file.name}: TXT missing -> {document_id}.txt"
                )

        # Check important fields
        required_fields = [
            "state",
            "district",
            "anchal",
            "halka",
            "mauja",
            "document_type",
            "language"
        ]

        for field in required_fields:
            if field not in data:
                errors.append(
                    f"{json_file.name}: missing field -> {field}"
                )

    except Exception as e:
        errors.append(
            f"{json_file.name}: invalid JSON -> {e}"
        )

# -----------------------------
# Duplicate IDs
# -----------------------------
duplicates = set(
    x for x in document_ids
    if document_ids.count(x) > 1
)

if duplicates:
    errors.append(
        f"Duplicate document IDs: {duplicates}"
    )

# -----------------------------
# Check CSV
# -----------------------------
csv_records = 0

if CSV_FILE.exists():

    with open(
        CSV_FILE,
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as f:

        reader = csv.DictReader(f)

        for row in reader:
            if row.get("document_id"):
                csv_records += 1

else:
    errors.append("master_dataset.csv not found")

print(f"CSV records: {csv_records}")

# -----------------------------
# Final result
# -----------------------------
print("\n==============================")

if not errors:

    print("VALIDATION PASSED")
    print("==============================")
    print("Everything looks consistent.")
    print("Dataset is ready for the next stage.")

else:

    print("VALIDATION FOUND PROBLEMS")
    print("==============================")

    for error in errors:
        print("X", error)

print("\nExpected:")
print("PDFs  = 10")
print("TXTs  = 10")
print("JSONs = 10")
print("CSV   = 10")