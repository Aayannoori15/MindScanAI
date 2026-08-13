import { useDispatch, useSelector } from "react-redux";
import FacialCapture from "../components/assessment/FacialCapture";
import SpeechRecorder from "../components/assessment/SpeechRecorder";
import NumericalForm from "../components/assessment/NumericalForm";
import ModalitySelector from "../components/assessment/ModalitySelector";
import ProgressStepper from "../components/assessment/ProgressStepper";
import LoadingPulse from "../components/shared/LoadingPulse";
import { setLanguageHint, setStep } from "../store/assessmentSlice";
import { useAssessment } from "../hooks/useAssessment";

export default function Assessment() {
  const dispatch = useDispatch();
  const { step, modalities, loading, error, submit } = useAssessment();
  const languageHint = useSelector((s) => s.assessment.languageHint);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-display text-3xl mb-2">Assessment</h1>
      <p className="text-slate-500 mb-6">Choose modalities, capture signals, then run fusion + XAI.</p>
      <ProgressStepper step={step} />

      {step === 0 && (
        <div className="space-y-6">
          <ModalitySelector />
          <label className="block text-sm">
            Speech language hint
            <select
              className="mt-1 w-full border rounded-xl p-2"
              value={languageHint}
              onChange={(e) => dispatch(setLanguageHint(e.target.value))}
            >
              <option value="language-agnostic">Language-agnostic (prosody)</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
            </select>
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          {modalities.includes("facial") && <FacialCapture />}
          {modalities.includes("speech") && <SpeechRecorder />}
          {modalities.includes("numerical") && (
            <div className="md:col-span-2">
              <NumericalForm />
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-3">
          <p>Modalities: {modalities.join(", ") || "none"}</p>
          <p className="text-sm text-slate-500">
            Inference uses teammate weights when present; otherwise a documented mock fusion so the demo never hard-fails.
          </p>
          {error && <p className="text-rose text-sm">{error}</p>}
          {loading && <LoadingPulse />}
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          disabled={step === 0}
          onClick={() => dispatch(setStep(Math.max(0, step - 1)))}
          className="px-4 py-2 rounded-xl border disabled:opacity-40"
        >
          Back
        </button>
        {step < 2 ? (
          <button onClick={() => dispatch(setStep(step + 1))} className="px-5 py-2 rounded-xl bg-teal text-navy font-medium">
            Continue
          </button>
        ) : (
          <button onClick={submit} disabled={loading || !modalities.length} className="px-5 py-2 rounded-xl bg-navy text-white">
            Run MindScan
          </button>
        )}
      </div>
    </div>
  );
}
