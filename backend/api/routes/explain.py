from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.models import AssessmentSession
from backend.database.session import get_db

router = APIRouter()


@router.get("/{session_id}")
def get_explanation(session_id: int, db: Session = Depends(get_db)):
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    return session.explanation or {}
