import { useDispatch, useSelector } from "react-redux";
import { setNumerical } from "../../store/assessmentSlice";

// Ranges mirror the observed min/max of dataset/mental_health_multimodal.csv
// (the same 4000 rows FEATURE_STATS z-scores against). Keeping the sliders
// inside the training distribution matters: values outside it produce extreme
// z-scores that saturate the scoring formula at its cap regardless of any
// other input -- e.g. the old Head_Motion_Index default of 4.2 sat ~12 SD
// above a feature whose real range is 0..1, pinning stress to 39 every time.
const FIELDS = [
  ["Sleep_Quality", "Sleep quality (1–5)", 1, 5, 1],
  ["Social_Engagement", "Social engagement (1–5)", 1, 5, 1],
  ["Daily_App_Usage_Min", "Daily app usage (min)", 30, 479, 1],
  ["Typing_Speed_WPM", "Typing speed (WPM)", 20, 89, 1],
  ["Session_Frequency", "Digital sessions / day", 1, 19, 1],
  ["Idle_Time_Min", "Idle time (min)", 5, 179, 1],
  ["Facial_Emotion_Variance", "Facial emotion variance", 0.1, 1, 0.01],
  ["Eye_Blink_Rate", "Eye blink rate (/min)", 10, 34, 1],
  ["Smile_Intensity", "Smile intensity (0–1)", 0, 1, 0.01],
  ["Head_Motion_Index", "Head motion index", 0, 1, 0.01],
  ["MFCC_Mean", "MFCC mean", -50, 50, 0.1],
  ["MFCC_Variance", "MFCC variance", 1, 30, 0.1],
  ["Pitch_Mean", "Pitch mean (Hz)", 80, 300, 1],
  ["Speech_Rate", "Speech rate (words/s)", 2, 6, 0.1],
  ["Heart_Rate_BPM", "Heart rate (BPM)", 55, 119, 1],
  ["HRV_Index", "HRV index", 10, 100, 0.1],
  ["Skin_Temperature", "Skin temperature (°C)", 32, 37, 0.1],
  ["GSR_Level", "GSR level", 0.1, 5, 0.1],
];

export default function NumericalForm() {
  const values = useSelector((s) => s.assessment.numerical);
  const dispatch = useDispatch();
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {FIELDS.map(([key, label, min, max, step]) => (
        <label key={key} className="text-sm">
          <span className="flex justify-between text-ink-300 mb-1">
            {label}
            <span className="font-medium text-ink-200">{values[key]}</span>
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={values[key]}
            onChange={(e) => dispatch(setNumerical({ [key]: Number(e.target.value) }))}
            className="w-full accent-white"
          />
        </label>
      ))}
    </div>
  );
}
