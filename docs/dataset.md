# Dataset alignment

Source: `Dataset_Description.docx`

## Speech (RAVDESS, 1440 files)

Filename: `03-01-06-01-02-01-12.wav` → modality, channel, emotion, intensity, statement, repetition, actor.

Emotions: neutral, calm, happy, sad, angry, fearful, disgust, surprised.

Stress map: Happy/Calm/Neutral → Healthy; Sad/Surprised → Mild_Stress; Fearful/Angry → Moderate_Stress; Disgust → Severe_Stress.

Preprocessor: `backend/core/preprocessors/speech_preprocessor.py` parses the 7-token name and extracts MFCC mean/variance, pitch, speech rate.

## Facial (FER, 28,709 images)

48×48 grayscale. Classes: 0 Angry, 1 Disgust, 2 Fear, 3 Happy, 4 Sad, 5 Surprise, 6 Neutral.

Stress map: Happy/Neutral → Healthy; Sad/Surprise → Mild_Stress; Fear/Disgust → Moderate_Stress; Angry → Severe_Stress.

Preprocessor outputs `(1, 48, 48)` float32.

## Numerical (4000 rows, 18 features)

`Sleep_Quality`, `Social_Engagement`, `Daily_App_Usage_Min`, `Typing_Speed_WPM`, `Session_Frequency`, `Idle_Time_Min`, `Facial_Emotion_Variance`, `Eye_Blink_Rate`, `Smile_Intensity`, `Head_Motion_Index`, `MFCC_Mean`, `MFCC_Variance`, `Pitch_Mean`, `Speech_Rate`, `Heart_Rate_BPM`, `HRV_Index`, `Skin_Temperature`, `GSR_Level`.

Targets: `Mental_Health_Status` ∈ {Healthy, Mild_Stress, Moderate_Stress, Severe_Stress}; Depression 0–34; Anxiety 0–24; Stress 0–39.
