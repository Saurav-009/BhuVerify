import json
import csv
from pathlib import Path

BASE_DIR = Path(__file__).parent

GROUND_TRUTH = BASE_DIR / "ground_truth"
EXTRACTED_TEXT = BASE_DIR / "extracted_text"
OUTPUT_FILE = BASE_DIR / "master_dataset.csv"

rows = []

for json_file in sorted(GROUND_TRUTH.glob("*.json")):

    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    document_id = data.get("document_id")

    txt_file = EXTRACTED_TEXT / f"{document_id}.txt"

    extracted_text = ""

    if txt_file.exists():
        with open(txt_file, "r", encoding="utf-8") as f:
            extracted_text = f.read()

    rows.append({
        "document_id": document_id,
        "file_name": data.get("file_name"),
        "state": data.get("state"),
        "district": data.get("district"),
        "anchal": data.get("anchal"),
        "halka": data.get("halka"),
        "mauja": data.get("mauja"),
        "jamabandi_number": data.get("jamabandi_number"),
        "computerized_jamabandi_number": data.get(
            "computerized_jamabandi_number"
        ),
        "khata_number": json.dumps(
            data.get("khata_number"),
            ensure_ascii=False
        ),
        "khesra_plot_number": json.dumps(
            data.get("khesra_plot_number"),
            ensure_ascii=False
        ),
        "raiyat_name": json.dumps(
            data.get("raiyat_name"),
            ensure_ascii=False
        ),
        "father_or_husband_name": json.dumps(
            data.get("father_or_husband_name"),
            ensure_ascii=False
        ),
        "land_area": json.dumps(
            data.get("land_area"),
            ensure_ascii=False
        ),
        "document_type": data.get("document_type"),
        "language": data.get("language"),
        "verified": data.get("verified"),
        "extracted_text": extracted_text
    })

fieldnames = rows[0].keys()

with open(OUTPUT_FILE, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print("================================")
print("MASTER DATASET CREATED")
print("================================")
print(f"Records: {len(rows)}")
print(f"Output: {OUTPUT_FILE}")