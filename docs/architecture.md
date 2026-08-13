# Architecture

```
Frontend (React/Vite)
  webcam / mic / 18-feature form
        │ HTTP + WS
Backend (FastAPI)
  preprocessors → encoders → fusion → D/A/S + 4-class status
        │
  XAI: Grad-CAM, SHAP proxy, LIME-style speech cues
        │
  PostgreSQL / SQLite sessions, wellness, crisis flag
```

Crisis threshold: stress ≥ 32 or status Severe → iCall, Vandrevala, KIRAN.
