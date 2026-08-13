import threading
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.api.middleware.rate_limit import limiter
from backend.api.routes import assessment, companion, explain, history, realtime, wellness
from backend.api.routes import report as report_routes
from backend.config import ROOT, settings
from backend.core.model_loader import registry
from backend.database.session import Base, engine

FRONTEND_DIST = ROOT / "frontend" / "dist"

app = FastAPI(title=settings.app_name, version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment.router, prefix="/api/assessment", tags=["assessment"])
app.include_router(explain.router, prefix="/api/explain", tags=["explain"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(wellness.router, prefix="/api/wellness", tags=["wellness"])
app.include_router(report_routes.router, prefix="/api/report", tags=["report"])
app.include_router(realtime.router, prefix="/api/realtime", tags=["realtime"])
app.include_router(companion.router, prefix="/api/companion", tags=["companion"])


@app.on_event("startup")
def startup():
    # Bind the HTTP port immediately. Loading wav2vec2 / ResNet in this
    # handler would block uvicorn's lifespan, so Render never sees an open port.
    Base.metadata.create_all(bind=engine)
    threading.Thread(target=registry.load, name="mindscan-model-load", daemon=True).start()


@app.api_route("/api/health", methods=["GET", "HEAD"])
def health():
    return {
        "ok": True,
        "models_ready": registry.ready,
        "using_mock": registry.using_mock,
        "loaded": list(registry.loaded.keys()),
    }


def _spa_index():
    return FileResponse(FRONTEND_DIST / "index.html")


@app.api_route("/", methods=["GET", "HEAD"])
def spa_root(request: Request):
    # Render probes HEAD / ; a GET-only route returns 405 and the deploy is killed.
    if request.method == "HEAD":
        return Response(status_code=200)
    if FRONTEND_DIST.is_dir():
        return _spa_index()
    return {"ok": True, "service": "mindscan"}


if FRONTEND_DIST.is_dir():

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    def spa_fallback(full_path: str, request: Request):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
        if request.method == "HEAD":
            return Response(status_code=200)
        target = FRONTEND_DIST / full_path
        if target.is_file():
            return FileResponse(target)
        return _spa_index()
