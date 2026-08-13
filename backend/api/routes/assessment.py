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
from backend.core.dataset_spec import (
    FEATURE_DIRECTIONS,
    FEATURE_LABELS,
    NUMERICAL_FEATURE_KEYS,
    STATUS_LABELS,
)
from backend.core.model_loader import registry
from backend.core.llm.groq_client import generate_report, transcribe
from backend.core.timeutil import iso_utc
from backend.core.preprocessors.facial_preprocessor import preprocess_face
from backend.core.preprocessors.numerical_preprocessor import preprocess_numerical
from backend.core.preprocessors.speech_preprocessor import preprocess_speech
from backend.database.models import AssessmentSession, User
from backend.database.schemas import AssessmentRequest, LoginIn, RegisterIn, TokenOut
from backend.database.session import get_db
from backend.features.crisis_detector import detect_crisis
from backend.features.therapy_recommender import recommend_therapy
from backend.features.emotion_timeline import summarize_timeline
from backend.features.wellness_engine import personalized_wellness

router = APIRouter()


def _build_insights(face_pred, speech_pred, speech_q, num_t, req, used) -> dict:
    """Per-modality account of what was actually detected in this submission.

    Everything here is derived from the current request -- model outputs,
    extracted acoustics, and the submitted feature vector -- so the UI can
    show why a result came out the way it did rather than asserting it.
    """
    insights: dict = {}

    if "facial" in used:
        if face_pred:
            top = sorted(face_pred["probabilities"].items(), key=lambda kv: kv[1], reverse=True)[:3]
            insights["facial"] = {
                "available": True,
                "source": "Trained ResNet18 FER classifier (70.3% val accuracy, 7 classes)",
                "detected_emotion": face_pred["emotion"],
                "confidence": round(face_pred["confidence"] * 100, 1),
                "maps_to": face_pred["mapped_status"],
                "distress_level": round(face_pred["distress"] * 100, 1),
                "top_emotions": [{"label": k, "probability": round(v * 100, 1)} for k, v in top],
            }
        else:
            insights["facial"] = {"available": False, "reason": "No face frame submitted, or encoder in mock mode."}

    if "speech" in used:
        if speech_pred:
            top = sorted(speech_pred["probabilities"].items(), key=lambda kv: kv[1], reverse=True)[:3]
            acoustics = {
                k: round(float(speech_q[k]), 2)
                for k in ("Pitch_Mean", "Speech_Rate", "MFCC_Mean", "MFCC_Variance")
                if speech_q.get(k) is not None
            }
            insights["speech"] = {
                "available": True,
                "source": "Fine-tuned wav2vec2-base (67.1% unseen-speaker accuracy, 4 classes)",
                "detected_status": speech_pred["status"],
                "confidence": round(speech_pred["confidence"] * 100, 1),
                "distress_level": round(speech_pred["distress"] * 100, 1),
                "top_statuses": [{"label": k, "probability": round(v * 100, 1)} for k, v in top],
                "extracted_acoustics": acoustics,
            }
        else:
            insights["speech"] = {"available": False, "reason": "No audio submitted, or encoder in mock mode."}

    if "numerical" in used and req.numerical is not None:
        raw = req.numerical.model_dump()
        # Which submitted features sit furthest from the dataset norm, and in
        # which direction FEATURE_DIRECTIONS says that pushes overall burden.
        drivers = []
        for i, key in enumerate(NUMERICAL_FEATURE_KEYS):
            z = float(num_t[i]) if i < len(num_t) else 0.0
            drivers.append(
                {
                    "feature": key,
                    "label": FEATURE_LABELS[key],
                    "value": raw[key],
                    "z_score": round(z, 2),
                    "effect": "raises burden" if z * FEATURE_DIRECTIONS[key] > 0 else "lowers burden",
                    "magnitude": round(abs(z * FEATURE_DIRECTIONS[key]), 3),
                }
            )
        drivers.sort(key=lambda d: d["magnitude"], reverse=True)
        insights["numerical"] = {
            "available": True,
            "source": "18 self-reported / sensor features, z-scored against the 4000-row dataset",
            "top_drivers": drivers[:6],
        }

    return insights


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

    # Real predictions from the trained classifier heads (70.3% FER / 67% RAVDESS).
    # None when a modality wasn't submitted or the encoders are in mock mode.
    face_pred = registry.predict_facial_emotion(face_t) if "facial" in used and face_bytes else None
    speech_pred = registry.predict_speech_emotion(speech_t) if "speech" in used and speech_bytes else None

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
    # The trained tabular model only ever sees the 18 numerical features -- no
    # dataset pairs real facial/speech embeddings with real labels to train it
    # on. Only let it drive the result when numerical is the *sole* selected
    # modality; the moment a photo or voice clip is provided, use the
    # heuristic engine instead, since it's the only path that actually reads
    # facial_emb/speech_emb/fused. Otherwise a submitted photo/voice would be
    # computed and then silently discarded whenever numerical was also picked
    # (the default), which is exactly what was happening before this fix.
    numerical_only = set(used) == {"numerical"}
    predicted_scores = registry.predict_scores(num_t) if numerical_only else None
    scores = predicted_scores or estimate_scores(
        num_t,
        facial_emb,
        speech_emb,
        face_distress=face_pred["distress"] if face_pred else None,
        speech_distress=speech_pred["distress"] if speech_pred else None,
    )
    # Status hints now come from the trained classifiers when available, falling
    # back to filename-derived labels (RAVDESS 7-token names / FER class in the
    # filename) only when a model prediction isn't available.
    hints = [
        h
        for h in (
            (face_pred or {}).get("mapped_status") or face_q.get("mapped_status"),
            (speech_pred or {}).get("mapped_status")
            or (speech_q.get("ravdess") or {}).get("mapped_status"),
        )
        if h
    ]
    predicted_status = registry.predict_status(num_t) if numerical_only else None
    status, probs = predicted_status or classify_status(fused, scores, hints=hints)
    timeline = summarize_timeline([p.model_dump() for p in req.emotion_timeline])
    shap = shap_numerical(req.numerical.model_dump() if req.numerical else None, scores)
    lime = lime_speech(speech_q, req.language_hint)
    grad = generate_gradcam(face_bytes if "facial" in used else None, face_tensor=face_t)
    flags = face_q["flags"] + speech_q["flags"] + num_q["flags"]
    explanation = build_report(status, scores, weights, shap, lime, grad, flags)
    wellness = personalized_wellness(
        req.numerical.model_dump() if req.numerical else None,
        scores,
        timeline.get("dominant"),
    )
    crisis = detect_crisis(status, scores["stress"])
    therapy = recommend_therapy(status, scores, bool(crisis["flagged"]))

    # Language layer: the encoders read *how* someone sounds, this reads what
    # they actually said. Both are best-effort — a failure here degrades the
    # report rather than failing the assessment.
    insights = _build_insights(face_pred, speech_pred, speech_q, num_t, req, used)
    transcript = (
        transcribe(speech_t)
        if "speech" in used and speech_bytes
        else {"available": False, "reason": "No audio submitted."}
    )
    ai_report = generate_report(
        transcript=transcript,
        scores=scores,
        status=status,
        facial=insights.get("facial"),
        speech=insights.get("speech"),
        numerical_drivers=(insights.get("numerical") or {}).get("top_drivers"),
        crisis_flagged=bool(crisis["flagged"]),
    )
    insights["transcript"] = transcript
    insights["ai_report"] = ai_report

    session = AssessmentSession(
        user_id=user.id if user else req.user_id,
        status_label=status,
        depression_score=scores["depression"],
        anxiety_score=scores["anxiety"],
        stress_score=scores["stress"],
        modalities_used=",".join(used),
        numerical_features=req.numerical.model_dump() if req.numerical else None,
        explanation={**explanation, "ai_report": ai_report, "transcript": transcript},
        emotion_timeline=timeline,
        wellness={**wellness, "therapy": therapy},
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
        "insights": insights,
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
        "therapy": therapy,
        "emotion_timeline": timeline,
        "created_at": iso_utc(session.created_at),
    }
