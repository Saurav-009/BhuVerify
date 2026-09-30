import os
import sys
import shutil
import tempfile
import json
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import pandas as pd
import pymupdf

# Ensure portal_connectors package is importable from the same directory
_HERE = Path(__file__).parent.resolve()
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from preprocess import process_single_document
from ocr_engine import process_document_ocr
from extractor import extract_land_record_fields
from matching import match_extracted_to_reference
from gemini_extractor import extract_with_gemini
from risk_calculator import calculate_land_record_risk
from portal_connectors import (
    get_portal_connector,
    detect_state,
    SUPPORTED_STATES,
    portal_result_to_dict,
)

# Load environment variables from .env if present
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

BASE_DIR = Path(__file__).parent.resolve()
UPLOAD_DIR = BASE_DIR / "data" / "outputs" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PAGE_PREVIEWS_DIR = BASE_DIR / "data" / "outputs" / "previews"
PAGE_PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

REF_CSV = BASE_DIR / "data" / "reference" / "bihar_records_clean.csv"
RAW_DOCS_DIR = BASE_DIR / "data" / "raw" / "documents"

app = FastAPI(
    title="BhuVerify — Bihar Land Record Intelligence API",
    description="SIH 2026 AI Backend for Hybrid OCR, Gemini Grounded Extraction, Cadastral Validation & Risk Scoring",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for preview images
app.mount("/static/previews", StaticFiles(directory=str(PAGE_PREVIEWS_DIR)), name="previews")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "BhuVerify OCR & Intelligence Engine",
        "has_gemini": bool(os.environ.get("GEMINI_API_KEY")),
        "reference_records_count": len(pd.read_csv(REF_CSV)) if REF_CSV.exists() else 0
    }

@app.get("/api/reference-records")
async def get_reference_records():
    """Returns list of ground truth reference records from Department of Land Resources."""
    if not REF_CSV.exists():
        return []
    df = pd.read_csv(REF_CSV)
    df = df.astype(object).where(pd.notnull(df), None)
    # Exclude heavy extracted_text field for summary
    cols = [c for c in df.columns if c != "extracted_text"]
    records = df[cols].to_dict(orient="records")
    return records

def extract_pdf_text_and_images(pdf_path: Path):
    """
    Extracts text layer using PyMuPDF and renders first 2 pages to PNG.
    Returns (text, is_digital, image_paths, page_count).
    """
    text_parts = []
    image_paths = []
    page_count = 0
    try:
        doc = pymupdf.open(str(pdf_path))
        page_count = len(doc)
        for i, page in enumerate(doc):
            t = page.get_text()
            if t:
                text_parts.append(t)
            # Render first 2 pages for preview & multimodal
            if i < 2:
                pix = page.get_pixmap(dpi=150)
                img_name = f"{pdf_path.stem}_p{i+1}.png"
                img_dest = PAGE_PREVIEWS_DIR / img_name
                pix.save(str(img_dest))
                image_paths.append(img_dest)
        doc.close()
    except Exception as e:
        print(f"[PDF Extractor] PyMuPDF error: {e}")

    full_text = "\n".join(text_parts).strip()
    is_digital = len(full_text) > 150
    return full_text, is_digital, image_paths, page_count

@app.post("/api/land-record/analyze")
@app.post("/api/analyze")
async def analyze_land_record(file: UploadFile = File(...)):
    """
    Unified end-to-end analysis endpoint:
    Dual OCR (PyPDF digital text layer vs Scanned Tesseract/Multimodal)
    -> Gemini Structured Extraction with Grounding/Evidence
    -> Reference Verification against Bihar Department Ground Truth
    -> Deterministic Risk Scoring
    -> GIS Cadastral Parcel mapping
    """
    if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg', '.tif', '.tiff')):
        raise HTTPException(status_code=400, detail="Invalid file type. Supported formats: PDF, PNG, JPG, JPEG, TIFF")

    # Save uploaded file
    temp_file_path = UPLOAD_DIR / file.filename
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {e}")

    try:
        doc_id = temp_file_path.stem
        is_pdf = file.filename.lower().endswith('.pdf')
        ocr_path_used = "UNKNOWN"
        full_text = ""
        image_paths = []
        page_count = 1

        # Dual OCR Pipeline:
        if is_pdf:
            full_text, is_digital, image_paths, page_count = extract_pdf_text_and_images(temp_file_path)
            if is_digital:
                ocr_path_used = "DIGITAL_PDF_TEXT_LAYER"
            else:
                ocr_path_used = "SCANNED_OCR_PREPROCESSED"
                # Scanned PDF: run image preprocessing & OCR
                proc_res = process_single_document(temp_file_path)
                ocr_res = process_document_ocr(temp_file_path)
                scanned_text = ocr_res.get("full_text", "")
                if len(scanned_text) > len(full_text):
                    full_text = scanned_text
        else:
            ocr_path_used = "IMAGE_OCR_PREPROCESSED"
            proc_res = process_single_document(temp_file_path)
            ocr_res = process_document_ocr(temp_file_path)
            full_text = ocr_res.get("full_text", "")
            image_paths = [temp_file_path]

        # 1.5 Document Content Classification Gate (BEFORE normal land-record extraction)
        import re as _re
        land_keywords = [
            r'जमाबंदी', r'जमाबी', r'रैयत', r'खाता', r'खेसरा', r'मौजा', r'अंचल', r'हलका',
            r'राजस्व', r'भूमि\s*सुधार', r'रकबा', r'दाखिल', r'खारिज', r'लगान',
            r'jamabandi', r'raiyat', r'khata', r'khesra', r'mauza', r'mauja',
            r'anchal', r'halka', r'bhu[\s\-]?abhilekh', r'khatian', r'patta', r'mutation',
            r'21\d{13}'
        ]
        matched_kw = [kw for kw in land_keywords if _re.search(kw, full_text, _re.IGNORECASE)]
        kw_count = len(matched_kw)

        # Also check if we can extract any core land fields
        fields_data = extract_with_gemini(
            text=full_text,
            image_paths=image_paths,
            document_id=doc_id
        )
        core_keys = ["raiyat_name", "computerized_jamabandi_number", "jamabandi_number", "khata_number", "khesra_plot_number", "land_area", "mauja"]
        populated_core = [k for k in core_keys if fields_data.get(k, {}).get("normalized") or fields_data.get(k, {}).get("original")]

        if kw_count >= 2 or len(populated_core) >= 2:
            doc_classification = "LAND_RECORD"
            doc_class_conf = min(0.98, 0.65 + 0.06 * (kw_count + len(populated_core)))
            doc_class_reason = f"Verified land record structure ({kw_count} revenue indicators and {len(populated_core)} core registry attributes detected)."
        elif kw_count == 1 or len(populated_core) == 1:
            doc_classification = "UNCERTAIN"
            doc_class_conf = 0.50
            doc_class_reason = "Document type could not be verified with high confidence — partial revenue indicators found. Marked for human officer review."
        else:
            doc_classification = "NON_LAND_DOCUMENT"
            doc_class_conf = 0.88
            doc_class_reason = "The uploaded file does not appear to contain a compatible land-record document. No Jamabandi, Khata, Khesra, Raiyat, or revenue department markers were found in the document content."

        # If NON_LAND_DOCUMENT: do NOT populate owner/parcel fields, do NOT run normal GIS/risk processing
        if doc_classification == "NON_LAND_DOCUMENT":
            empty_fields = {
                k: {"original": None, "normalized": None, "confidence": 0.0, "evidence": []}
                for k in [
                    "raiyat_name", "father_or_husband_name", "computerized_jamabandi_number",
                    "jamabandi_number", "bhag_vartaman", "prishth_sankhya", "district",
                    "anchal", "halka", "mauja", "khata_number", "khesra_plot_number",
                    "land_area", "mutation_status"
                ]
            }
            preview_urls = [f"/static/previews/{p.name}" for p in image_paths if p.exists()]
            return {
                "document_id": doc_id,
                "file_name": file.filename,
                "ocr_path_used": ocr_path_used,
                "page_count": page_count,
                "overall_confidence": 0.0,
                "status": "REVIEW_REQUIRED",
                "document_classification": doc_classification,
                "document_classification_confidence": doc_class_conf,
                "document_classification_reason": doc_class_reason,
                "fields": empty_fields,
                "matches": {},
                "matched_reference_record": {},
                "risk_analysis": {
                    "risk_score": 0,
                    "risk_level": "LOW",
                    "status_text": "Document not recognized as a land record",
                    "color": "slate",
                    "factors_count": 0,
                    "factors": []
                },
                "gis_parcel": {
                    "plot_number": "",
                    "khata_number": "",
                    "mauza": "",
                    "anchal": "",
                    "district": "",
                    "state": "",
                    "center": [25.5642, 85.1824],
                    "boundary_polygon": [],
                    "area_acres": "",
                    "is_simulated_cadastral": True
                },
                "preview_urls": preview_urls,
                "ocr_text_length": len(full_text),
                "ocr_text_sample": full_text[:300] if full_text else "",
                "detected_state": None,
                "portal_verification": None,
            }

        # 3. Ground Truth Reference Matching
        ref_record = {}
        if REF_CSV.exists():
            df_ref = pd.read_csv(REF_CSV)
            df_ref = df_ref.astype(object).where(pd.notnull(df_ref), None)
            
            # Match strategies
            # A. Match by document_id if standard dataset sample
            matching_rows = df_ref[df_ref["document_id"] == doc_id]
            
            # B. Match by Computerized Jamabandi Number
            comp_extracted = fields_data.get("computerized_jamabandi_number", {}).get("normalized")
            if matching_rows.empty and comp_extracted:
                matching_rows = df_ref[df_ref["computerized_jamabandi_number"].astype(str) == str(comp_extracted)]

            # C. Match by legacy Jamabandi Number
            jam_extracted = fields_data.get("jamabandi_number", {}).get("normalized")
            if matching_rows.empty and jam_extracted:
                matching_rows = df_ref[df_ref["jamabandi_number"].astype(str) == str(jam_extracted)]

            # D. Match by Raiyat name if available
            raiyat_extracted = fields_data.get("raiyat_name", {}).get("normalized")
            if matching_rows.empty and raiyat_extracted and len(str(raiyat_extracted)) > 3:
                matching_rows = df_ref[df_ref["raiyat_name"].astype(str).str.contains(str(raiyat_extracted), case=False, na=False)]

            if not matching_rows.empty:
                ref_record = matching_rows.iloc[0].to_dict()
                ref_record = {k: (None if pd.isna(v) or v == "nan" else v) for k, v in ref_record.items() if k != "extracted_text"}

        # Transform fields for matching engine
        mock_ext_res = {"fields": {}}
        for k, v in fields_data.items():
            mock_ext_res["fields"][k] = {
                "original": v.get("original"),
                "normalized": v.get("normalized"),
                "corrected": v.get("normalized") or v.get("original"),
                "confidence": v.get("confidence", 0.0)
            }

        match_res = match_extracted_to_reference(mock_ext_res, ref_record) if ref_record else {"field_scores": {}, "overall_confidence": 0.0}

        # Build clean matches dictionary
        clean_matches = {}
        for mname, mval in match_res.get("field_scores", {}).items():
            ext_v = mval.get("extracted")
            ref_v = mval.get("reference")
            clean_matches[mname] = {
                "score": float(mval.get("score", 0.0)),
                "extracted": None if pd.isna(ext_v) or ext_v == "nan" else ext_v,
                "reference": None if pd.isna(ref_v) or ref_v == "nan" else ref_v,
                "status": "MATCH" if mval.get("score", 0.0) >= 0.85 else ("PARTIAL" if mval.get("score", 0.0) >= 0.5 else "MISMATCH")
            }

        # 4. Confidence & Risk Assessment
        conf_list = [v.get("confidence", 0.0) for v in fields_data.values() if (v.get("original") or v.get("normalized")) and v.get("confidence") is not None]
        overall_conf = round(sum(conf_list) / max(1, len(fields_data)), 3) if conf_list else 0.0

        risk_data = calculate_land_record_risk(
            fields=fields_data,
            matches=clean_matches,
            overall_confidence=overall_conf
        )

        # Overall Status
        if doc_classification == "UNCERTAIN":
            overall_status = "REVIEW_REQUIRED"
        elif risk_data["risk_level"] == "LOW" and ref_record and match_res.get("overall_confidence", 0.0) > 0.8:
            overall_status = "VERIFIED"
        elif risk_data["risk_level"] == "HIGH":
            overall_status = "DISCREPANCY_FLAGGED"
        else:
            overall_status = "REVIEW_REQUIRED"

        # 5. GIS Cadastral Parcel Projection (Never fabricate defaults if not extracted)
        khata_val = fields_data.get("khata_number", {}).get("normalized") or ""
        khesra_val = fields_data.get("khesra_plot_number", {}).get("normalized") or ""
        mauza_val = fields_data.get("mauja", {}).get("normalized") or ""
        anchal_val = fields_data.get("anchal", {}).get("normalized") or ""
        district_val = fields_data.get("district", {}).get("normalized") or ""
        
        # Base coordinates for Sampatchak / Patna region
        base_lat = 25.5642
        base_lng = 85.1824
        plot_seed = sum(ord(c) for c in str(khesra_val)) % 100 if khesra_val else 0
        lat_offset = (plot_seed % 10) * 0.0012
        lng_offset = (plot_seed // 10) * 0.0015
        
        gis_parcel = {
            "plot_number": str(khesra_val),
            "khata_number": str(khata_val),
            "mauza": str(mauza_val),
            "anchal": str(anchal_val),
            "district": str(district_val),
            "state": "Bihar" if district_val else "",
            "center": [base_lat + lat_offset, base_lng + lng_offset],
            "boundary_polygon": [
                [base_lat + lat_offset, base_lng + lng_offset],
                [base_lat + lat_offset + 0.0008, base_lng + lng_offset],
                [base_lat + lat_offset + 0.0008, base_lng + lng_offset + 0.0011],
                [base_lat + lat_offset, base_lng + lng_offset + 0.0011],
            ] if khesra_val else [],
            "area_acres": fields_data.get("land_area", {}).get("normalized") or "",
            "is_simulated_cadastral": True
        }

        # Preview image URLs if generated
        preview_urls = [f"/static/previews/{p.name}" for p in image_paths if p.exists()]

        # 6. State Detection + Portal Verification
        flat_extracted = {
            k: (v.get("normalized") or v.get("original") if isinstance(v, dict) else str(v or ""))
            for k, v in fields_data.items()
        }
        detected_state = detect_state(flat_extracted, ocr_text=full_text)
        portal_verification = None
        if detected_state and doc_classification == "LAND_RECORD":
            try:
                connector = get_portal_connector(detected_state)
                pv_result = connector.verify(flat_extracted)
                portal_verification = portal_result_to_dict(pv_result)
            except Exception as pv_err:
                print(f"[PortalVerification] Error during portal check: {pv_err}")

        return {
            "document_id": doc_id,
            "file_name": file.filename,
            "ocr_path_used": ocr_path_used,
            "page_count": page_count,
            "overall_confidence": overall_conf,
            "status": overall_status,
            "document_classification": doc_classification,
            "document_classification_confidence": doc_class_conf,
            "document_classification_reason": doc_class_reason,
            "fields": fields_data,
            "matches": clean_matches,
            "matched_reference_record": ref_record,
            "risk_analysis": risk_data,
            "gis_parcel": gis_parcel,
            "preview_urls": preview_urls,
            "ocr_text_length": len(full_text),
            "ocr_text_sample": full_text[:500] if full_text else "",
            "detected_state": detected_state,
            "portal_verification": portal_verification,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@app.get("/api/sample/{doc_id}")
async def get_sample_document_analysis(doc_id: str):
    """
    Returns instant pre-cached analysis for any standard Bihar dataset document
    (e.g., BR_PATNA_SAMPATCHAK_001).
    """
    # Check if raw file exists
    pdf_file = RAW_DOCS_DIR / f"{doc_id}.pdf"
    if not pdf_file.exists():
        # Find any matching pdf
        candidates = list(RAW_DOCS_DIR.glob(f"*{doc_id}*.pdf"))
        if candidates:
            pdf_file = candidates[0]
        else:
            raise HTTPException(status_code=404, detail=f"Sample document {doc_id} not found.")

    with open(pdf_file, "rb") as f:
        file_obj = UploadFile(filename=pdf_file.name, file=f)
        return await analyze_land_record(file_obj)

# ─────────────────────────────────────────────────────────────
# Portal API Endpoints
# ─────────────────────────────────────────────────────────────

@app.get("/api/portal/states")
async def list_portal_states():
    """Returns the list of supported Indian states for portal verification."""
    return {
        "supported_states": SUPPORTED_STATES,
        "portals": {
            "Bihar": {
                "name": "Bihar Bhumi — Apna Khata",
                "url": "https://land.bihar.gov.in/",
                "data_source": "REFERENCE_DATA + USER_ASSISTED",
            },
            "West Bengal": {
                "name": "Banglarbhumi (RS/LR Khatian)",
                "url": "https://banglarbhumi.gov.in/",
                "data_source": "REFERENCE_DATA + USER_ASSISTED",
            },
            "Assam": {
                "name": "ILRMS Assam / Dharitree",
                "url": "https://ilrms.assam.gov.in/",
                "data_source": "REFERENCE_DATA + USER_ASSISTED",
            },
        }
    }


class PortalVerifyRequest(BaseModel):
    state: Optional[str] = None
    fields: dict = {}
    ocr_text: str = ""


@app.post("/api/portal/verify")
async def portal_verify(req: PortalVerifyRequest):
    """
    Manually trigger portal verification for a given state and extracted fields.
    Useful for re-running verification after a state change or user-assisted submission.
    """
    state = req.state
    if not state:
        state = detect_state(req.fields, ocr_text=req.ocr_text)
    if not state:
        raise HTTPException(status_code=400, detail="Could not detect state. Please specify 'state' explicitly.")
    if state not in SUPPORTED_STATES:
        raise HTTPException(status_code=400, detail=f"State '{state}' is not yet supported. Supported: {SUPPORTED_STATES}")
    try:
        connector = get_portal_connector(state)
        result = connector.verify(req.fields, use_cache=False)
        return portal_result_to_dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portal verification error: {str(e)}")


class UserAssistedSubmitRequest(BaseModel):
    state: str
    fields: dict = {}
    user_provided: dict = {}   # Data the user retrieved from the official portal


@app.post("/api/portal/user-assisted/submit")
async def user_assisted_submit(req: UserAssistedSubmitRequest):
    """
    Accepts data retrieved by the user from the official state portal
    (owner name, area, etc.) and re-runs cross-validation.
    Returns a PortalVerificationResult with data_source='LIVE_RESULT'.
    """
    from portal_connectors.base_connector import (
        PortalLandRecord, PortalVerificationResult,
        cross_validate, build_inconsistency_summary, portal_result_to_dict as _dict
    )
    up = req.user_provided
    portal_record = PortalLandRecord(
        owner_name=up.get("owner_name"),
        khata_number=up.get("khata_number"),
        plot_number=up.get("plot_number"),
        land_area=up.get("land_area"),
        district=up.get("district"),
        block_circle=up.get("block_circle"),
        village_mouza=up.get("village_mouza"),
        mutation_status=up.get("mutation_status"),
    )
    comparisons = cross_validate(req.fields, portal_record)
    has_inconsistency = any(c.inconsistency_flag for c in comparisons)
    summary = build_inconsistency_summary(comparisons)

    connector_cls_map = {
        "Bihar": "BiharPortalConnector",
        "West Bengal": "WestBengalPortalConnector",
        "Assam": "AssamPortalConnector",
    }
    connector = get_portal_connector(req.state)

    result = PortalVerificationResult(
        state=req.state,
        data_source="LIVE_RESULT",
        mode="USER_ASSISTED",
        portal_name=connector.portal_name,
        portal_url=connector.portal_url,
        portal_deeplink=None,
        portal_record=portal_record,
        field_comparisons=comparisons,
        has_inconsistency=has_inconsistency,
        inconsistency_summary=summary,
        confidence=0.90,
        instructions=None,
    )
    return portal_result_to_dict(result)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
