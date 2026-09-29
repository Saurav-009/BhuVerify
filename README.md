# BhuVerify

BhuVerify is a modular hackathon-ready prototype for AI-assisted land-record digitization and validation.

It processes old scanned/handwritten land documents into structured records, links extracted fields to evidence, validates data against state connectors, performs GIS parcel visualization support, computes risk, and keeps a human officer in the loop before final verification.

## End-to-End Pipeline

`Upload → Document Classification → Preprocessing → OCR/HTR → Gemini Extraction → Structured Digital Record → Source Evidence → Validation → State Land Record Data → GIS/Parcel Verification → Risk Analysis → Human Officer Review → Verified Digital Record`

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy (PostgreSQL-ready, SQLite default for local demo)
- **Frontend:** React + Vite + Leaflet/OpenStreetMap
- **AI extraction:** Gemini API (with fallback extractor)
- **OCR/HTR:** `pytesseract` when available, fallback parser for prototype inputs
- **Voice search:** local/open-source Whisper architecture (`whisper` package) with fallback text query

## Repository Structure

- `/backend/app/main.py` - FastAPI entrypoint
- `/backend/app/routers` - API routes (`documents`, `voice`)
- `/backend/app/services` - modular pipeline services
- `/backend/app/state_data` - state portal connector sample datasets (UP/Bihar)
- `/backend/tests` - focused API tests
- `/frontend` - React app with upload flow, evidence, review actions, and parcel map

## Backend Setup

```bash
cd /home/runner/work/BhuVerify/BhuVerify/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run API:

```bash
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup

```bash
cd /home/runner/work/BhuVerify/BhuVerify/frontend
npm install
npm run dev
```

Set optional frontend API base:

```bash
export VITE_API_BASE=http://localhost:8000/api/v1
```

## Environment Variables

- `DATABASE_URL` (optional): PostgreSQL/SQLite SQLAlchemy URL.  
  Example: `******localhost:5432/bhuverify`
- `GEMINI_API_KEY` (optional): enables Gemini extraction.
- `GEMINI_MODEL` (optional): defaults to `gemini-1.5-flash`.

If Gemini key is not provided, the fallback extractor still produces structured JSON from OCR text.

## Core API Endpoints

- `POST /api/v1/documents/upload`  
  multipart form: `state`, `file`
- `GET /api/v1/documents/{id}`
- `POST /api/v1/documents/{id}/review` (approve/reject by officer)
- `GET /api/v1/documents/{id}/download` (download readable digitized output)
- `POST /api/v1/voice/search` (voice-based land search; supports fallback `query_text`)

## Notes on State Connectors

Current connectors support a **limited initial set**:
- Uttar Pradesh (`up`)
- Bihar (`bihar`)

Add new states by adding JSON datasets and registering new connectors in:
`/backend/app/services/state_connectors.py`

## Testing

Run focused backend tests:

```bash
cd /home/runner/work/BhuVerify/BhuVerify/backend
pytest tests/test_pipeline.py
```

## Security and Cost

- Uses open-source and free components for prototype use.
- No paid managed dependencies are required.
- Secrets are expected via environment variables only.
