import { createSlice } from "@reduxjs/toolkit";

// Dataset medians (dataset/mental_health_multimodal.csv), so a fresh
// assessment starts at a neutral in-distribution baseline. Several previous
// defaults sat outside the real feature range entirely (Head_Motion_Index 4.2
// vs. a 0..1 feature, GSR_Level 10 vs. 0.1..5), which z-scored to +12 / +5 SD
// and saturated the stress score at its cap on every single submission.
const initialNumerical = {
  Sleep_Quality: 3,
  Social_Engagement: 3,
  Daily_App_Usage_Min: 248,
  Typing_Speed_WPM: 53,
  Session_Frequency: 10,
  Idle_Time_Min: 91,
  Facial_Emotion_Variance: 0.55,
  Eye_Blink_Rate: 22,
  Smile_Intensity: 0.5,
  Head_Motion_Index: 0.5,
  MFCC_Mean: -0.9,
  MFCC_Variance: 15.4,
  Pitch_Mean: 192,
  Speech_Rate: 4,
  Heart_Rate_BPM: 87,
  HRV_Index: 55,
  Skin_Temperature: 34.5,
  GSR_Level: 2.5,
};

const RESULT_KEY = "mindscan.lastResult";

function readPersistedResult() {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistResult(result) {
  try {
    if (result) sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    else sessionStorage.removeItem(RESULT_KEY);
  } catch {
    /* private mode / quota */
  }
}

const slice = createSlice({
  name: "assessment",
  initialState: {
    step: 0,
    modalities: ["facial", "speech", "numerical"],
    numerical: initialNumerical,
    faceBlob: null,
    speechBlob: null,
    speechFilename: null,
    facialLabelHint: null,
    emotionTimeline: [],
    languageHint: "language-agnostic",
    result: readPersistedResult(),
    loading: false,
    error: null,
  },
  reducers: {
    setStep: (s, a) => {
      s.step = a.payload;
    },
    toggleModality: (s, a) => {
      const m = a.payload;
      s.modalities = s.modalities.includes(m)
        ? s.modalities.filter((x) => x !== m)
        : [...s.modalities, m];
    },
    setNumerical: (s, a) => {
      s.numerical = { ...s.numerical, ...a.payload };
    },
    setFaceBlob: (s, a) => {
      s.faceBlob = a.payload;
    },
    setSpeechBlob: (s, a) => {
      s.speechBlob = a.payload;
    },
    setSpeechFilename: (s, a) => {
      s.speechFilename = a.payload;
    },
    setFacialLabelHint: (s, a) => {
      s.facialLabelHint = a.payload;
    },
    addEmotionPoint: (s, a) => {
      s.emotionTimeline.push(a.payload);
    },
    setLanguageHint: (s, a) => {
      s.languageHint = a.payload;
    },
    setLoading: (s, a) => {
      s.loading = a.payload;
    },
    setError: (s, a) => {
      s.error = a.payload;
    },
    setResult: (s, a) => {
      s.result = a.payload;
      persistResult(a.payload);
    },
    resetAssessment: () => ({
      step: 0,
      modalities: ["facial", "speech", "numerical"],
      numerical: initialNumerical,
      faceBlob: null,
      speechBlob: null,
      speechFilename: null,
      facialLabelHint: null,
      emotionTimeline: [],
      languageHint: "language-agnostic",
      result: null,
      loading: false,
      error: null,
    }),
  },
});

export const {
  setStep,
  toggleModality,
  setNumerical,
  setFaceBlob,
  setSpeechBlob,
  setSpeechFilename,
  setFacialLabelHint,
  addEmotionPoint,
  setLanguageHint,
  setLoading,
  setError,
  setResult,
  resetAssessment,
} = slice.actions;

export default slice.reducer;
