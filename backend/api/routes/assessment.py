from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.api.middleware.auth import (
    create_access_token,
    get_current_user_optional,
    hash_password,
    verify_password,
)
from backend.core.explainability.gradcam import generate_gradcam
from backend.core.explainability.lime_explainer import lime_speech
from backend.core.explainability.report_generator import build_report
from backend.core.explainability.shap_explainer import shap_numerical
from backend.core.inference.classification_engine import classify_status
from backend.core.inference.fusion_engine import fuse_modalities
from backend.core.inference.regression_engine import estimate_scores, score_range
from backend.core.dataset_spec import STATUS_LABELS
from backend.core.model_loader import registry
from backend.core.preprocessors.facial_preprocessor import preprocess_face
from backend.core.preprocessors.numerical_preprocessor import preprocess_numerical
from backend.core.preprocessors.speech_preprocessor import preprocess_speech
from backend.database.models import AssessmentSession, User
from backend.database.schemas import AssessmentRequest, LoginIn, RegisterIn, TokenOut
from backend.database.session import get_db
from backend.features.crisis_detector import detect_crisis
from backend.features.emotion_timeline import summarize_timeline
from backend.features.wellness_engine import personalized_wellness

router = APIRouter()


@router.post("/auth/register", response_model=TokenOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(email=payload.email, name=payload.name, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    return TokenOut(access_token=create_access_token(user.email))


@router.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    return TokenOut(access_token=create_access_token(user.email))


@router.post("/run")
async def run_assessment(
    payload: str = Form(...),
    face: UploadFile | None = File(default=None),
    speech: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    req = AssessmentRequest.model_validate_json(payload)
    used = [m for m in req.modalities if m in {"facial", "speech", "numerical"}]
    if not used:
        raise HTTPException(400, "Select at least one modality")

    face_bytes = await face.read() if face else None
    speech_bytes = await speech.read() if speech else None
    face_name = req.facial_label_hint or (face.filename if face else None)
    speech_name = req.speech_filename or (speech.filename if speech else None)

    face_t, face_q = preprocess_face(face_bytes if "facial" in used else None, filename=face_name)
    speech_t, speech_q = preprocess_speech(
        speech_bytes if "speech" in used else None, filename=speech_name
    )
    num_t, num_q = preprocess_numerical(req.numerical if "numerical" in used else None)

    facial_emb = registry.facial_encoder.encode(face_t)
    speech_emb = registry.speech_encoder.encode(speech_t)

    fused, weights, confidence = fuse_modalities(
        facial_emb,
        speech_emb,
        num_t,
        {
            "facial": face_q["quality"] if "facial" in used else 0,
            "speech": speech_q["quality"] if "speech" in used else 0,
            "numerical": num_q["quality"] if "numerical" in used else 0,
        },
        used,
    )
    predicted_scores = registry.predict_scores(num_t) if "numerical" in used else None
    scores = predicted_scores or estimate_scores(num_t, facial_emb, speech_emb)
    hints = [h for h in (face_q.get("mapped_status"), (speech_q.get("ravdess") or {}).get("mapped_status")) if h]
    predicted_status = registry.predict_status(num_t) if "numerical" in used else None
    status, probs = predicted_status or classify_status(fused, scores, hints=hints)
    timeline = summarize_timeline([p.model_dump() for p in req.emotion_timeline])
    shap = shap_numerical(req.numerical.model_dump() if req.numerical else None, scores)
    lime = lime_speech(speech_q, req.language_hint)
    grad = generate_gradcam(face_bytes if "facial" in used else None)
    flags = face_q["flags"] + speech_q["flags"] + num_q["flags"]
    explanation = build_report(status, scores, weights, shap, lime, grad, flags)
    wellness = personalized_wellness(
        req.numerical.model_dump() if req.numerical else None,
        scores,
        timeline.get("dominant"),
    )
    crisis = detect_crisis(status, scores["stress"])

    session = AssessmentSession(
        user_id=user.id if user else req.user_id,
        status_label=status,
        depression_score=scores["depression"],
        anxiety_score=scores["anxiety"],
        stress_score=scores["stress"],
        modalities_used=",".join(used),
        numerical_features=req.numerical.model_dump() if req.numerical else None,
        explanation=explanation,
        emotion_timeline=timeline,
        wellness=wellness,
        crisis_flag=1 if crisis["flagged"] else 0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "status_label": status,
        "status_probs": {k: float(v) for k, v in zip(STATUS_LABELS, probs)},
        "dataset_hints": {"facial": face_q.get("emotion"), "speech": (speech_q.get("ravdess") or {}).get("emotion")},
        "using_mock_models": registry.using_mock,
        "using_trained_tabular_model": predicted_scores is not None and predicted_status is not None,
        "scores": {
            "depression": round(scores["depression"], 1),
            "anxiety": round(scores["anxiety"], 1),
            "stress": round(scores["stress"], 1),
            "depression_range": score_range("depression", scores["depression"]),
            "anxiety_range": score_range("anxiety", scores["anxiety"]),
            "stress_range": score_range("stress", scores["stress"]),
        },
        "modality_confidence": {
            "facial": round(confidence["facial"], 1),
            "speech": round(confidence["speech"], 1),
            "numerical": round(confidence["numerical"], 1),
            "quality_flags": flags,
        },
        "modality_weights": {k: round(v, 3) for k, v in weights.items()},
        "explanation": explanation,
        "wellness": wellness,
        "crisis": crisis,
        "emotion_timeline": timeline,
        "created_at": session.created_at.isoformat(),
    }
