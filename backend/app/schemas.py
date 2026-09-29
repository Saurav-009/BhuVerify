from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    filename: str
    state: str


class OfficerReviewRequest(BaseModel):
    officer_name: str
    decision: str = Field(pattern="^(approve|reject)$")
    comments: str


class DocumentResponse(DocumentBase):
    id: str
    status: str
    doc_classification: str
    raw_text: str
    readable_text: str
    risk_level: str
    risk_score: float
    pipeline: dict[str, Any]
    structured_record: dict[str, Any]
    evidence: dict[str, Any]
    validation_result: dict[str, Any]
    gis_result: dict[str, Any]
    human_review: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VoiceSearchResponse(BaseModel):
    transcript: str
    state: str
    matches: list[dict[str, Any]]
