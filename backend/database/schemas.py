from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from backend.core.dataset_spec import NUMERICAL_FEATURE_KEYS  # noqa: F401


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterIn(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class NumericalFeatures(BaseModel):
    """18 numeric columns from the Hack2Health tabular set (4000 rows)."""

    model_config = ConfigDict(populate_by_name=True)

    Sleep_Quality: float = Field(ge=1, le=5)
    Social_Engagement: float = Field(ge=1, le=5)
    Daily_App_Usage_Min: float = Field(ge=0, le=720)
    Typing_Speed_WPM: float = Field(ge=5, le=180)
    Session_Frequency: float = Field(ge=0, le=120)
    Idle_Time_Min: float = Field(ge=0, le=720)
    Facial_Emotion_Variance: float = Field(ge=0, le=30)
    Eye_Blink_Rate: float = Field(ge=0, le=80)
    Smile_Intensity: float = Field(ge=0, le=1)
    Head_Motion_Index: float = Field(ge=0, le=40)
    MFCC_Mean: float = Field(ge=-80, le=80)
    MFCC_Variance: float = Field(ge=0, le=200)
    Pitch_Mean: float = Field(ge=50, le=500)
    Speech_Rate: float = Field(ge=0, le=10)
    Heart_Rate_BPM: float = Field(ge=40, le=180)
    HRV_Index: float = Field(ge=0, le=200)
    Skin_Temperature: float = Field(ge=30, le=40)
    GSR_Level: float = Field(ge=0, le=50)


class EmotionPoint(BaseModel):
    t: float
    emotions: dict[str, float]


class AssessmentRequest(BaseModel):
    user_id: int | None = None
    modalities: list[str] = Field(default_factory=lambda: ["facial", "speech", "numerical"])
    numerical: NumericalFeatures | None = None
    emotion_timeline: list[EmotionPoint] = Field(default_factory=list)
    language_hint: str | None = None
    facial_label_hint: str | None = None
    speech_filename: str | None = None


class ModalityConfidence(BaseModel):
    facial: float
    speech: float
    numerical: float
    quality_flags: list[str] = Field(default_factory=list)


class ScoresOut(BaseModel):
    depression: float
    anxiety: float
    stress: float
    depression_range: str
    anxiety_range: str
    stress_range: str


class AssessmentResult(BaseModel):
    session_id: int
    status_label: str
    scores: ScoresOut
    modality_confidence: ModalityConfidence
    modality_weights: dict[str, float]
    explanation: dict[str, Any]
    wellness: dict[str, Any]
    crisis: dict[str, Any]
    created_at: datetime


class SessionSummary(BaseModel):
    id: int
    created_at: datetime
    status_label: str
    depression_score: float
    anxiety_score: float
    stress_score: float
    crisis_flag: int

    class Config:
        from_attributes = True
