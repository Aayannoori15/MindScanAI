from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.middleware.auth import get_current_user_optional
from backend.database.models import AssessmentSession, User
from backend.database.session import get_db
from backend.features.trend_analyzer import analyze_trends

router = APIRouter()


@router.get("/sessions")
def list_sessions(
    user_id: int | None = None,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    q = db.query(AssessmentSession).order_by(AssessmentSession.created_at.asc())
    uid = user.id if user else user_id
    if uid:
        q = q.filter(AssessmentSession.user_id == uid)
    rows = q.all()
    return {
        "sessions": [
            {
                "id": s.id,
                "created_at": s.created_at.isoformat(),
                "status_label": s.status_label,
                "depression_score": s.depression_score,
                "anxiety_score": s.anxiety_score,
                "stress_score": s.stress_score,
                "crisis_flag": s.crisis_flag,
            }
            for s in rows
        ],
        "trends": analyze_trends(rows),
    }


@router.get("/sessions/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not s:
        raise HTTPException(404, "Session not found")
    return {
        "id": s.id,
        "created_at": s.created_at.isoformat(),
        "status_label": s.status_label,
        "depression_score": s.depression_score,
        "anxiety_score": s.anxiety_score,
        "stress_score": s.stress_score,
        "modalities_used": s.modalities_used,
        "numerical_features": s.numerical_features,
        "explanation": s.explanation,
        "emotion_timeline": s.emotion_timeline,
        "wellness": s.wellness,
        "crisis_flag": s.crisis_flag,
    }
