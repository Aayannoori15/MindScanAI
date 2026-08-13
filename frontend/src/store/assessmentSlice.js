import { createSlice } from "@reduxjs/toolkit";

const initialNumerical = {
  Sleep_Quality: 3,
  Social_Engagement: 3,
  Daily_App_Usage_Min: 180,
  Typing_Speed_WPM: 42,
  Session_Frequency: 22,
  Idle_Time_Min: 95,
  Facial_Emotion_Variance: 2.4,
  Eye_Blink_Rate: 18,
  Smile_Intensity: 0.4,
  Head_Motion_Index: 4.2,
  MFCC_Mean: 0,
  MFCC_Variance: 16,
  Pitch_Mean: 165,
  Speech_Rate: 2.7,
  Heart_Rate_BPM: 78,
  HRV_Index: 48,
  Skin_Temperature: 33.1,
  GSR_Level: 10,
};

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
    result: null,
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
