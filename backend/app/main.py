from fastapi import FastAPI

from app.config import get_settings
from app.database import Base, engine
from app.routers import documents, voice

settings = get_settings()
app = FastAPI(title=settings.app_name)

Base.metadata.create_all(bind=engine)

app.include_router(documents.router, prefix=settings.api_prefix)
app.include_router(voice.router, prefix=settings.api_prefix)


@app.get("/health")
def health_check():
    return {"status": "ok"}
