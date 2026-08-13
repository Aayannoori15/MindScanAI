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
      <p className="eyebrow mb-2">Step {step + 1} of 3</p>
      <h1 className="font-display text-3xl md:text-4xl text-white mb-2">Assessment</h1>
      <p className="text-white/50 mb-8">Choose modalities, capture signals, then run fusion + XAI.</p>
      <ProgressStepper step={step} />

      {step === 0 && (
        <div className="space-y-6">
          <ModalitySelector />
          <label className="field-label max-w-sm">
            Speech language hint
            <select
              className="field-input"
              value={languageHint}
              onChange={(e) => dispatch(setLanguageHint(e.target.value))}
            >
              <option className="bg-navy" value="language-agnostic">Language-agnostic (prosody)</option>
              <option className="bg-navy" value="en">English</option>
              <option className="bg-navy" value="hi">Hindi</option>
              <option className="bg-navy" value="ta">Tamil</option>
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
        <div className="glass-card p-6 space-y-3 text-white">
          <p>Modalities: {modalities.join(", ") || "none"}</p>
          <p className="text-sm text-white/50">
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
          className="pill-btn-ghost"
        >
          Back
        </button>
        {step < 2 ? (
          <button onClick={() => dispatch(setStep(step + 1))} className="pill-btn-primary">
            Continue
          </button>
        ) : (
          <button onClick={submit} disabled={loading || !modalities.length} className="pill-btn-solid">
            Run MindScan
          </button>
        )}
      </div>
    </div>
  );
}
