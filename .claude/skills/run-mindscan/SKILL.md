---
name: run-mindscan
description: Launch the MindScan AI stack (FastAPI backend + Vite frontend) with the real trained models loaded, and verify they are actually serving. Use whenever asked to run, start, restart, or smoke-test the app.
---

# Running MindScan AI

Two processes: FastAPI on `:8000`, Vite on `:5173`. Vite proxies `/api` (including
websockets) to the backend, so **always exercise the app through `:5173`** — that is
the path the browser uses.

## Prerequisites (check before launching)

```bash
test -f .env || cp .env.example .env          # backend reads .env at import time
grep USE_MOCK_INFERENCE .env                  # must be false to load real models
test -d frontend/node_modules || (cd frontend && npm install)
```

`USE_MOCK_INFERENCE=true` silently swaps in deterministic random-vector encoders.
The app still returns 200s and looks fine, so verify the flag rather than assuming.

Python deps: `pip install -r requirements.txt` plus `pip install -r requirements-ml.txt`.
The ML file is **not optional** despite its name — `opencv-python-headless` backs the
face detector, and without it facial results silently degrade (see `verify-pipeline`).

## Launch

```bash
# Backend — PYTHONPATH=. is required; the app uses absolute `backend.*` imports.
PYTHONPATH=. python -m uvicorn backend.app:app --port 8000 > /tmp/backend.log 2>&1 &

# Frontend
cd frontend && npm run dev > /tmp/frontend.log 2>&1 &
```

**Wait ~15s before the first health check.** Startup loads ~105M parameters
(wav2vec2-base alone is ~380MB on disk). Curl before that returns exit 7 /
`ECONNREFUSED`, which looks like a crash but is just a cold start. Poll instead of
sleeping blindly:

```bash
until curl -sf http://127.0.0.1:8000/api/health >/dev/null; do sleep 1; done
```

## Verify — health alone is not enough

```bash
curl -s http://127.0.0.1:8000/api/health
```

Expected:

```json
{"ok":true,"models_ready":true,"using_mock":false,
 "loaded":["facial_encoder","speech_encoder","classifier","depression","anxiety","stress"]}
```

Check all three: `models_ready: true`, **`using_mock: false`**, and all six entries in
`loaded`. A 200 with `using_mock: true` means you are testing the mock pipeline.

Then drive one real request end-to-end (see `verify-pipeline` for the full
differential test):

```bash
curl -s -X POST http://localhost:5173/api/assessment/run \
  -F "payload=<payload.json;type=application/json" \
  -F "face=@dataset/Extracted_images/Happy/100.png;type=image/png" \
  -F "speech=@dataset/Audios/Actor_21/03-01-03-01-01-01-21.wav;type=audio/wav"
```

## Restarting — do not trust `--reload`

`uvicorn --reload` **gets stuck on this project**. It logs
`WatchFiles detected changes ... Reloading` but keeps serving the old code from a
stale worker, so edits appear to have no effect and you debug a fix that is already
correct. This cost real time in a previous session.

Always restart by full kill + cache clear:

```bash
tasklist | grep -i python | awk '{print $2}' | while read p; do taskkill //PID $p //F; done
find backend -iname "__pycache__" -exec rm -rf {} + 2>/dev/null
PYTHONPATH=. python -m uvicorn backend.app:app --port 8000 > /tmp/backend.log 2>&1 &
```

Reload kills both the reloader and worker process, hence the loop over all PIDs.
Vite HMR, by contrast, is reliable — the frontend rarely needs a manual restart.

## Gotchas

- `mindscan.db` cannot be deleted while the server holds it (`Device or resource busy`).
  Stop the backend first, or just leave it.
- Reading JSON responses on Windows: pass `encoding="utf-8"` to `open()`. Python's
  default (cp1252) mojibakes the en-dashes in feature labels and looks like a real
  encoding bug in the API when it is only a test-harness artifact.
- The server PDF route falls back to HTML when `weasyprint` is absent. That is
  intentional graceful degradation, not a failure.
