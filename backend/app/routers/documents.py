from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import LandRecordDocument
from app.schemas import DocumentResponse, OfficerReviewRequest
from app.services.pipeline import UnsupportedDocumentError, run_pipeline

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    state: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        result = run_pipeline(file.filename or "uploaded-document", state, content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except UnsupportedDocumentError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    risk = result["risk"]

    document = LandRecordDocument(
        filename=file.filename or "uploaded-document",
        state=state,
        status="pending_officer_review",
        doc_classification=result["doc_classification"],
        raw_text=result["raw_text"],
        readable_text=result["readable_text"],
        risk_level=risk["risk_level"],
        risk_score=risk["risk_score"],
        pipeline=result["pipeline"],
        structured_record=result["structured_record"],
        evidence=result["evidence"],
        validation_result=result["validation_result"],
        gis_result=result["gis_result"],
        human_review={"status": "pending", "officer_name": None, "comments": None},
    )

    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    document = db.get(LandRecordDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/{document_id}/review", response_model=DocumentResponse)
def officer_review(document_id: str, request: OfficerReviewRequest, db: Session = Depends(get_db)):
    document = db.get(LandRecordDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    status = "verified" if request.decision == "approve" else "rejected"
    document.status = status
    document.human_review = {
        "status": status,
        "officer_name": request.officer_name,
        "comments": request.comments,
    }

    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("/{document_id}/download")
def download_readable_document(document_id: str, db: Session = Depends(get_db)):
    document = db.get(LandRecordDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return PlainTextResponse(
        content=document.readable_text,
        headers={"Content-Disposition": f"attachment; filename={document_id}.txt"},
    )
