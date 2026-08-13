from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.core.llm.companion import chat
from backend.database.models import AssessmentSession
from backend.database.session import get_db

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class ChatIn(BaseModel):
    messages: list[Message] = Field(default_factory=list)
    # Ground the reply in a specific session when the UI knows one.
    session_id: int | None = None


@router.post("/chat")
def companion_chat(payload: ChatIn, db: Session = Depends(get_db)):
    """One turn of conversation with the companion."""
    assessment = None
    row = None
    if payload.session_id:
        row = db.query(AssessmentSession).filter(AssessmentSession.id == payload.session_id).first()
    if row is None:
        # Fall back to the most recent session so the companion has context
        # even when the user lands here directly.
        row = db.query(AssessmentSession).order_by(AssessmentSession.created_at.desc()).first()
    if row is not None:
        assessment = {
            "status": row.status_label,
            "scores": {
                "depression": round(row.depression_score, 1),
                "anxiety": round(row.anxiety_score, 1),
                "stress": round(row.stress_score, 1),
            },
        }

    return chat([m.model_dump() for m in payload.messages], assessment=assessment)
