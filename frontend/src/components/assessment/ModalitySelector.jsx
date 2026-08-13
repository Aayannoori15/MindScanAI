import { useDispatch, useSelector } from "react-redux";
import { toggleModality } from "../../store/assessmentSlice";

const OPTIONS = [
  { id: "facial", title: "Facial", body: "FER 48×48 grayscale still + live affect cues" },
  { id: "speech", title: "Speech", body: "Prosody / MFCC, language-agnostic" },
  { id: "numerical", title: "Physiological", body: "18 wellness & autonomic features" },
];

export default function ModalitySelector() {
  const selected = useSelector((s) => s.assessment.modalities);
  const dispatch = useDispatch();
  return (
    <div className="grid md:grid-cols-3 gap-3">
      {OPTIONS.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => dispatch(toggleModality(o.id))}
            className={`text-left rounded-[999px_999px_999px_28%] border p-4 transition hover:-translate-y-0.5 ${on ? "border-black bg-neutral-100" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
          >
            <p className="font-medium">{o.title}</p>
            <p className="text-sm text-slate-500 mt-1">{o.body}</p>
          </button>
        );
      })}
    </div>
  );
}
