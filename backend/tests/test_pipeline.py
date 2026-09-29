from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_upload_pipeline_and_validation_match():
    body = (
        "Owner: Ram Kumar\n"
        "Survey No: 12A\n"
        "Khata Number: 44\n"
        "Village: Bhanpur\n"
        "District: Lucknow\n"
        "Area: 1.20\n"
    )

    response = client.post(
        "/api/v1/documents/upload",
        data={"state": "up"},
        files={"file": ("land_record.txt", body.encode("utf-8"), "text/plain")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["doc_classification"] == "land_record"
    assert data["validation_result"]["record_found"] is True
    assert data["validation_result"]["owner_match"] is True
    assert data["risk_level"] in {"low", "medium"}
    assert len(data["pipeline"]["stages"]) >= 8


def test_voice_search_fallback_text_query():
    response = client.post(
        "/api/v1/voice/search",
        data={"state": "up", "query_text": "Ram Kumar"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["transcript"] == "Ram Kumar"
    assert data["matches"]
