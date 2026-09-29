from pathlib import Path
import json

BASE = Path(__file__).parent
PDF_FOLDER = BASE / "documents"
GROUND_TRUTH = BASE / "ground_truth"

GROUND_TRUTH.mkdir(exist_ok=True)

for pdf in sorted(PDF_FOLDER.glob("*.pdf")):
    data = {
        "document_id": pdf.stem,
        "file_name": pdf.name,
        "state": "Bihar",
        "district": "Patna",
        "anchal": "Sampatchak",
        "halka": "Bairiya Karnpura",
        "mauja": "Karnpura-121",
        "jamabandi_number": None,
        "computerized_jamabandi_number": None,
        "khata_number": [],
        "khesra_plot_number": [],
        "raiyat_name": None,
        "father_or_husband_name": None,
        "land_area": [],
        "document_type": "Jamabandi Register-II",
        "language": "Hindi",
        "verified": False
    }

    with open(GROUND_TRUTH / f"{pdf.stem}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

print("✅ Ground-truth JSON files created!")