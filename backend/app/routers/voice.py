from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas import VoiceSearchResponse
from app.services.search import search_land_records
from app.services.voice import transcribe_audio

router = APIRouter(prefix="/voice", tags=["voice-search"])


@router.post("/search", response_model=VoiceSearchResponse)
async def voice_search(
    state: str = Form(...),
    file: UploadFile | None = File(default=None),
    query_text: str | None = Form(default=None),
):
    transcript = ""

    if file is not None:
        content = await file.read()
        if content:
            try:
                transcript = transcribe_audio(content)
            except RuntimeError:
                pass

    if not transcript:
        transcript = (query_text or "").strip()

    if not transcript:
        raise HTTPException(status_code=400, detail="No usable voice transcript or fallback query_text provided")

    matches = search_land_records(state, transcript)
    return VoiceSearchResponse(transcript=transcript, state=state, matches=matches)
