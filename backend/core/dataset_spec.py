"""Ground-truth specs from Dataset_Description.docx.

Speech: RAVDESS-style 7-token filenames (1440 clips).
Facial: FER 48×48 grayscale, 7 emotion folders.
Numerical: 4000 rows, 18 features + Mental_Health_Status + D/A/S scores.
"""

from pathlib import Path

STATUS_LABELS = ["Healthy", "Mild_Stress", "Moderate_Stress", "Severe_Stress"]

SCORE_MAX = {"depression": 34.0, "anxiety": 24.0, "stress": 39.0}

# FER folder / class index → emotion name
FER_EMOTIONS = {
    0: "angry",
    1: "disgust",
    2: "fear",
    3: "happy",
    4: "sad",
    5: "surprise",
    6: "neutral",
}
FER_NAME_TO_ID = {v: k for k, v in FER_EMOTIONS.items()}

FER_TO_STATUS = {
    "happy": "Healthy",
    "neutral": "Healthy",
    "sad": "Mild_Stress",
    "surprise": "Mild_Stress",
    "fear": "Moderate_Stress",
    "disgust": "Moderate_Stress",
    "angry": "Severe_Stress",
}

# RAVDESS emotion id in filename token 3
RAVDESS_EMOTIONS = {
    1: "neutral",
    2: "calm",
    3: "happy",
    4: "sad",
    5: "angry",
    6: "fearful",
    7: "disgust",
    8: "surprised",
}

RAVDESS_TO_STATUS = {
    "neutral": "Healthy",
    "calm": "Healthy",
    "happy": "Healthy",
    "sad": "Mild_Stress",
    "surprised": "Mild_Stress",
    "fearful": "Moderate_Stress",
    "angry": "Moderate_Stress",
    "disgust": "Severe_Stress",
}

NUMERICAL_FEATURE_KEYS = [
    "Sleep_Quality",
    "Social_Engagement",
    "Daily_App_Usage_Min",
    "Typing_Speed_WPM",
    "Session_Frequency",
    "Idle_Time_Min",
    "Facial_Emotion_Variance",
    "Eye_Blink_Rate",
    "Smile_Intensity",
    "Head_Motion_Index",
    "MFCC_Mean",
    "MFCC_Variance",
    "Pitch_Mean",
    "Speech_Rate",
    "Heart_Rate_BPM",
    "HRV_Index",
    "Skin_Temperature",
    "GSR_Level",
]

FEATURE_LABELS = {
    "Sleep_Quality": "Sleep quality (1–5)",
    "Social_Engagement": "Social engagement (1–5)",
    "Daily_App_Usage_Min": "Daily app usage (min)",
    "Typing_Speed_WPM": "Typing speed (WPM)",
    "Session_Frequency": "Digital sessions / day",
    "Idle_Time_Min": "Idle time (min)",
    "Facial_Emotion_Variance": "Facial emotion variance",
    "Eye_Blink_Rate": "Eye blink rate (/min)",
    "Smile_Intensity": "Smile intensity",
    "Head_Motion_Index": "Head motion index",
    "MFCC_Mean": "MFCC mean",
    "MFCC_Variance": "MFCC variance",
    "Pitch_Mean": "Pitch mean (Hz)",
    "Speech_Rate": "Speech rate (wps)",
    "Heart_Rate_BPM": "Heart rate (BPM)",
    "HRV_Index": "HRV index",
    "Skin_Temperature": "Skin temperature (°C)",
    "GSR_Level": "GSR level",
}

# (mean, std) for z-scoring — computed from dataset/mental_health_multimodal.csv (n=4000)
FEATURE_STATS = {
    "Sleep_Quality": (3.0072, 1.4196),
    "Social_Engagement": (2.9558, 1.4161),
    "Daily_App_Usage_Min": (250.7337, 131.3240),
    "Typing_Speed_WPM": (53.6620, 20.1141),
    "Session_Frequency": (10.1335, 5.3981),
    "Idle_Time_Min": (92.0035, 50.6416),
    "Facial_Emotion_Variance": (0.5504, 0.2577),
    "Eye_Blink_Rate": (21.9405, 7.2277),
    "Smile_Intensity": (0.4987, 0.2894),
    "Head_Motion_Index": (0.5009, 0.2903),
    "MFCC_Mean": (-0.4357, 28.9122),
    "MFCC_Variance": (15.3979, 8.3718),
    "Pitch_Mean": (190.5683, 63.2144),
    "Speech_Rate": (4.0147, 1.1533),
    "Heart_Rate_BPM": (86.6778, 18.7176),
    "HRV_Index": (55.4815, 26.3150),
    "Skin_Temperature": (34.5053, 1.4462),
    "GSR_Level": (2.5254, 1.4259),
}

# SHAP-style signed weights (positive = increases burden)
FEATURE_DIRECTIONS = {
    "Sleep_Quality": -1.6,
    "Social_Engagement": -1.3,
    "Daily_App_Usage_Min": 0.8,
    "Typing_Speed_WPM": 0.2,
    "Session_Frequency": 0.6,
    "Idle_Time_Min": 0.9,
    "Facial_Emotion_Variance": 0.7,
    "Eye_Blink_Rate": 0.8,
    "Smile_Intensity": -1.4,
    "Head_Motion_Index": 0.7,
    "MFCC_Mean": 0.2,
    "MFCC_Variance": 0.5,
    "Pitch_Mean": 0.6,
    "Speech_Rate": 0.4,
    "Heart_Rate_BPM": 0.9,
    "HRV_Index": -1.1,
    "Skin_Temperature": 0.3,
    "GSR_Level": 1.0,
}

FACE_SIZE = 48  # FER grayscale
FACE_CHANNELS = 1


def parse_ravdess_filename(name: str | None) -> dict | None:
    """Parse 03-01-06-01-02-01-12.wav → stimulus metadata."""
    if not name:
        return None
    stem = Path(name).stem
    parts = stem.split("-")
    if len(parts) != 7 or not all(p.isdigit() for p in parts):
        return None
    ids = [int(p) for p in parts]
    emotion = RAVDESS_EMOTIONS.get(ids[2])
    actor = ids[6]
    return {
        "modality": {1: "full-AV", 2: "video-only", 3: "audio-only"}.get(ids[0], ids[0]),
        "vocal_channel": {1: "speech", 2: "song"}.get(ids[1], ids[1]),
        "emotion_id": ids[2],
        "emotion": emotion,
        "intensity": {1: "normal", 2: "strong"}.get(ids[3], ids[3]),
        "statement": {1: "kids", 2: "dogs"}.get(ids[4], ids[4]),
        "repetition": ids[5],
        "actor": actor,
        "sex": "male" if actor % 2 == 1 else "female",
        "mapped_status": RAVDESS_TO_STATUS.get(emotion),
    }


def parse_fer_hint(name: str | None) -> dict | None:
    """Infer FER class from folder/filename tokens (angry, fear, …)."""
    if not name:
        return None
    lower = str(name).lower()
    for emo in FER_NAME_TO_ID:
        if emo in lower:
            return {
                "emotion": emo,
                "emotion_id": FER_NAME_TO_ID[emo],
                "mapped_status": FER_TO_STATUS[emo],
            }
    return None


def display_status(label: str) -> str:
    return label.replace("_", " ")
