# MindScan AI

Explainable multimodal screening for psychiatric evaluation (Hack2Health). Face, speech, and 18 numerical features are fused into DASS-style scores with three-level explanations.

This software is **decision support**, not a diagnosis.

## Quick start (local demo)

```bash
git clone <this-repo>
cd hack2health
cp .env.example .env

python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt    # API — see also backend/requirements.txt
PYTHONPATH=. uvicorn backend.app:app --reload --port 8000

cd frontend && npm install && npm run dev
```

Open http://localhost:5173

### Dependency files (commit these)

| File | What it is |
|---|---|
| `requirements.txt` | Python API dependencies (install from repo root) |
| `backend/requirements.txt` | Same API stack, canonical list |
| `backend/requirements-lock.txt` | Fully pinned pip freeze for identical installs |
| `requirements-ml.txt` / `backend/requirements-ml.txt` | Optional PyTorch, librosa, SHAP, Grad-CAM, WeasyPrint |
| `frontend/package.json` | React / Vite / Tailwind |
| `frontend/package-lock.json` | Locked npm tree — run `npm install` in `frontend/` |

Optional ML extras after the demo is running:

```bash
pip install -r requirements-ml.txt
```

The API boots with a **documented mock pipeline** until trained `.pt` files exist. Drop teammate weights into `backend/models/` (see `docs/model_placement.md`) and set `USE_MOCK_INFERENCE=false`.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Model load status |
| POST | `/api/assessment/run` | Multipart assessment |
| GET | `/api/explain/{id}` | Stored XAI payload |
| GET | `/api/history/sessions` | Longitudinal sessions |
| GET | `/api/report/{id}/pdf` | Clinical PDF |
| WS | `/api/realtime/ws` | Live emotion smoothing |

## Design

Navy `#0F1B2D` · teal `#00BFA6` · amber `#F59E0B` · rose `#FB7185` (no harsh reds).
