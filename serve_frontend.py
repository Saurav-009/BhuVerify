import os
import sys
from pathlib import Path
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="BhuVerify Frontend Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_URL = "http://127.0.0.1:8000"
BASE_DIR = Path(__file__).parent.resolve()
DIST_DIR = BASE_DIR / "LandRecord-Intelligence" / "artifacts" / "landrecord-intelligence" / "dist" / "public"

# Reverse proxy for backend APIs
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_api(request: Request, path: str):
    target_url = f"{BACKEND_URL}/api/{path}"
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)
    
    body = await request.body()
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.request(
                method=request.method,
                url=target_url,
                params=request.query_params,
                headers=headers,
                content=body
            )
            # Remove transfer-encoding or content-encoding that might conflict
            out_headers = {k: v for k, v in resp.headers.items() if k.lower() not in ["transfer-encoding", "content-encoding", "content-length"]}
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=out_headers,
                media_type=resp.headers.get("content-type")
            )
        except Exception as e:
            return Response(
                content=f'{{"error": "Backend microservice at {BACKEND_URL} not reachable: {str(e)}"}}',
                status_code=502,
                media_type="application/json"
            )

@app.api_route("/static/{path:path}", methods=["GET"])
async def proxy_static(request: Request, path: str):
    target_url = f"{BACKEND_URL}/static/{path}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(target_url, params=request.query_params)
            out_headers = {k: v for k, v in resp.headers.items() if k.lower() not in ["transfer-encoding", "content-encoding", "content-length"]}
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=out_headers,
                media_type=resp.headers.get("content-type")
            )
        except Exception as e:
            return Response(status_code=404)

# Single Page Application (SPA) routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Normalize path
    target = (DIST_DIR / full_path).resolve()
    # Check if target is inside DIST_DIR and is a file
    try:
        target.relative_to(DIST_DIR)
        if target.is_file():
            return FileResponse(target)
    except ValueError:
        pass
    
    index_file = DIST_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return Response(content="Frontend bundle not found. Please build or check dist/public.", status_code=404)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"[*] Starting BhuVerify React Dashboard on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
