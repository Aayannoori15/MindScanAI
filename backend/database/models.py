from datetime import datetime, timezone


def _utc_now() -> datetime:
    """Naive UTC, matching the existing column type.

    Stored naive for backwards compatibility with rows already in the database;
    the API layer attaches the UTC offset on the way out so clients can convert
    correctly instead of guessing.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utc_now)

    sessions: Mapped[list["AssessmentSession"]] = relationship(back_populates="user")


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utc_now)
    status_label: Mapped[str] = mapped_column(String(32))
    depression_score: Mapped[float] = mapped_column(Float)
    anxiety_score: Mapped[float] = mapped_column(Float)
    stress_score: Mapped[float] = mapped_column(Float)
    modalities_used: Mapped[str] = mapped_column(String(120))
    numerical_features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    explanation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    emotion_timeline: Mapped[list | None] = mapped_column(JSON, nullable=True)
    wellness: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    crisis_flag: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped[User | None] = relationship(back_populates="sessions")
