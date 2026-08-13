# API reference

Base URL: `http://localhost:8000`

## Health

`GET /api/health` → `{ ok, models_ready, using_mock, loaded }`

## Assessment

`POST /api/assessment/run` multipart:

- `payload` (JSON string): `{ modalities, numerical, emotion_timeline, language_hint }`
- `face` optional image
- `speech` optional audio

Numerical keys (18, exact dataset names): Sleep_Quality, Social_Engagement, Daily_App_Usage_Min, Typing_Speed_WPM, Session_Frequency, Idle_Time_Min, Facial_Emotion_Variance, Eye_Blink_Rate, Smile_Intensity, Head_Motion_Index, MFCC_Mean, MFCC_Variance, Pitch_Mean, Speech_Rate, Heart_Rate_BPM, HRV_Index, Skin_Temperature, GSR_Level.

Optional payload fields: `speech_filename` (RAVDESS), `facial_label_hint` (FER class in the path).

## Auth

`POST /api/assessment/auth/register` `{ email, name, password }`
`POST /api/assessment/auth/login` `{ email, password }`

## History / XAI / PDF

- `GET /api/history/sessions`
- `GET /api/history/sessions/{id}`
- `GET /api/explain/{id}`
- `GET /api/report/{id}/pdf`
- `GET /api/wellness/tips`

## Realtime

WebSocket `ws://localhost:8000/api/realtime/ws`

Send `{ t, emotions }` or `{ energy }`. Receive smoothed probabilities.
