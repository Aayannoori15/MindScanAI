import threading
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.staticfiles import StaticFiles
from starlette.types import ASGIApp, Receive, Scope, Send

from backend.api.middleware.rate_limit import limiter
from backend.api.routes import assessment, companion, explain, history, realtime, wellness
from backend.api.routes import report as report_routes
from backend.config import ROOT, settings
from backend.core.model_loader import TorchEncoder, registry
from backend.database.session import Base, engine


def _frontend_dist() -> Path | None:
    for p in (
        ROOT / "frontend" / "dist",
        Path.cwd() / "frontend" / "dist",
        Path("/opt/render/project/src/frontend/dist"),
    ):
        if (p / "index.html").is_file():
            return p
    return None


FRONTEND_DIST = _frontend_dist()


class RenderHeadMiddleware:
    """Render probes HEAD / and kills the service on 405. Answer 200 before routing."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["method"] == "HEAD":
            await send(
                {
                    "type": "http.response.start",
                    "status": 200,
                    "headers": [(b"content-type", b"text/plain"), (b"content-length", b"0")],
                }
            )
            await send({"type": "http.response.body", "body": b""})
            return
        await self.app(scope, receive, send)


app = FastAPI(title=settings.app_name, version="0.1.0", redirect_slashes=False)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(RenderHeadMiddleware)
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
    Base.metadata.create_all(bind=engine)
    if settings.neural_encoders_enabled:
        def _deferred_load():
            import time

            time.sleep(12)
            registry.load()

        threading.Thread(target=_deferred_load, name="mindscan-model-load", daemon=True).start()
    else:
        registry.ready = True
        registry.using_mock = True


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "models_ready": registry.ready,
        "using_mock": registry.using_mock,
        "loaded": list(registry.loaded.keys()),
        "neural_encoders": settings.neural_encoders_enabled,
        "speech_fallback": None if settings.speech_encoder_enabled else "groq_whisper",
        "speech_fallback_notice": settings.speech_fallback_notice,
        "frontend_dist": str(FRONTEND_DIST) if FRONTEND_DIST else None,
    }


def _spa_index():
    return FileResponse(FRONTEND_DIST / "index.html")


@app.get("/")
def spa_root():
    if FRONTEND_DIST:
        return _spa_index()
    return JSONResponse({"ok": True, "service": "mindscan", "frontend_dist": None})


if FRONTEND_DIST is not None:
    for folder in ("assets", "models", "mediapipe-wasm"):
        directory = FRONTEND_DIST / folder
        if directory.is_dir():
            app.mount(f"/{folder}", StaticFiles(directory=str(directory)), name=folder)

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
        target = FRONTEND_DIST / full_path
        if target.is_file():
            return FileResponse(target)
        return _spa_index()
