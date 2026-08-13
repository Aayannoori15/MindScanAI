import { useDispatch, useSelector } from "react-redux";
import { setNumerical } from "../../store/assessmentSlice";

const FIELDS = [
  ["Sleep_Quality", "Sleep quality (1–5)", 1, 5, 1],
  ["Social_Engagement", "Social engagement (1–5)", 1, 5, 1],
  ["Daily_App_Usage_Min", "Daily app usage (min)", 0, 720, 5],
  ["Typing_Speed_WPM", "Typing speed (WPM)", 5, 180, 1],
  ["Session_Frequency", "Digital sessions / day", 0, 120, 1],
  ["Idle_Time_Min", "Idle time (min)", 0, 720, 5],
  ["Facial_Emotion_Variance", "Facial emotion variance", 0, 30, 0.1],
  ["Eye_Blink_Rate", "Eye blink rate (/min)", 0, 80, 1],
  ["Smile_Intensity", "Smile intensity (0–1)", 0, 1, 0.01],
  ["Head_Motion_Index", "Head motion index", 0, 40, 0.1],
  ["MFCC_Mean", "MFCC mean", -80, 80, 0.5],
  ["MFCC_Variance", "MFCC variance", 0, 200, 0.5],
  ["Pitch_Mean", "Pitch mean (Hz)", 50, 500, 1],
  ["Speech_Rate", "Speech rate (words/s)", 0, 10, 0.1],
  ["Heart_Rate_BPM", "Heart rate (BPM)", 40, 180, 1],
  ["HRV_Index", "HRV index", 0, 200, 1],
  ["Skin_Temperature", "Skin temperature (°C)", 30, 40, 0.1],
  ["GSR_Level", "GSR level", 0, 50, 0.5],
];

export default function NumericalForm() {
  const values = useSelector((s) => s.assessment.numerical);
  const dispatch = useDispatch();
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {FIELDS.map(([key, label, min, max, step]) => (
        <label key={key} className="text-sm">
          <span className="flex justify-between text-slate-600 mb-1">
            {label}
            <span className="font-medium text-navy">{values[key]}</span>
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={values[key]}
            onChange={(e) => dispatch(setNumerical({ [key]: Number(e.target.value) }))}
            className="w-full accent-teal"
          />
        </label>
      ))}
    </div>
  );
}
