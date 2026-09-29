from app.services.classifier import classify_document
from app.services.gemini import extract_with_gemini
from app.services.gis import build_gis_result
from app.services.ocr import run_ocr_htr
from app.services.preprocessing import preprocess_document_bytes
from app.services.readable import generate_readable_document
from app.services.risk import analyze_risk
from app.services.validation import validate_against_state_data


class UnsupportedDocumentError(Exception):
    pass


def run_pipeline(filename: str, state: str, content: bytes) -> dict:
    pipeline = []

    pipeline.append({"stage": "upload", "status": "completed"})

    preprocessed = preprocess_document_bytes(content)
    pipeline.append({"stage": "preprocessing", "status": "completed"})

    raw_text = run_ocr_htr(preprocessed)
    pipeline.append({"stage": "ocr_htr", "status": "completed"})

    doc_class = classify_document(raw_text, filename)
    pipeline.append({"stage": "document_classification", "status": "completed", "result": doc_class})

    if doc_class != "land_record":
        raise UnsupportedDocumentError("Uploaded file does not appear to be a land-record document")

    structured_record, evidence = extract_with_gemini(raw_text)
    pipeline.append({"stage": "gemini_extraction", "status": "completed"})

    validation_result = validate_against_state_data(state, structured_record)
    pipeline.append({"stage": "state_data_validation", "status": "completed"})

    gis_result = build_gis_result(structured_record)
    pipeline.append({"stage": "gis_parcel_verification", "status": "completed"})

    risk = analyze_risk(structured_record, validation_result)
    pipeline.append({"stage": "risk_analysis", "status": "completed", "result": risk["risk_level"]})

    readable_text = generate_readable_document(structured_record, evidence)
    pipeline.append({"stage": "readable_document_generation", "status": "completed"})
    pipeline.append({"stage": "human_officer_review", "status": "pending"})

    return {
        "pipeline": {
            "flow": [
                "Upload",
                "Document Classification",
                "Preprocessing",
                "OCR/HTR",
                "Gemini Extraction",
                "Structured Digital Record",
                "Source Evidence",
                "Validation",
                "State Land Record Data",
                "GIS/Parcel Verification",
                "Risk Analysis",
                "Human Officer Review",
                "Verified Digital Record",
            ],
            "stages": pipeline,
        },
        "doc_classification": doc_class,
        "raw_text": raw_text,
        "structured_record": structured_record,
        "evidence": evidence,
        "validation_result": validation_result,
        "gis_result": gis_result,
        "risk": risk,
        "readable_text": readable_text,
    }
