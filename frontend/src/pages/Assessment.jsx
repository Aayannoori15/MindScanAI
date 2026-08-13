import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FacialCapture from "../components/assessment/FacialCapture";
import SpeechRecorder from "../components/assessment/SpeechRecorder";
import NumericalForm from "../components/assessment/NumericalForm";
import ModalitySelector from "../components/assessment/ModalitySelector";
import ProgressStepper from "../components/assessment/ProgressStepper";
import LoadingPulse from "../components/shared/LoadingPulse";
import { setLanguageHint, setStep } from "../store/assessmentSlice";
import { useAssessment } from "../hooks/useAssessment";
import { fetchHealth } from "../api/assessmentApi";
import PageHeader from "../components/layout/PageHeader";
import PageTransition, { Reveal } from "../components/layout/PageTransition";

export default function Assessment() {
  const dispatch = useDispatch();
  const { step, modalities, loading, error, submit } = useAssessment();
  const languageHint = useSelector((s) => s.assessment.languageHint);
  const [speechNotice, setSpeechNotice] = useState(null);

  useEffect(() => {
    fetchHealth()
      .then((h) => {
        if (h?.speech_fallback_notice) setSpeechNotice(h.speech_fallback_notice);
      })
      .catch(() => {});
  }, []);

  return (
    <PageTransition className="max-w-4xl mx-auto">
      <Reveal>
        <PageHeader
          eyebrow={`Step ${step + 1} of 3`}
          title="Assessment"
          lede="Choose modalities, capture signals, then run fusion + XAI."
        />
      </Reveal>
      <div className="mt-8" />
      <ProgressStepper step={step} />
      {speechNotice && (
        <p className="text-sm text-ink-100 bg-white/[0.06] border border-white/15 rounded-xl px-4 py-3 mb-6">
          {speechNotice}
        </p>
      )}

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
          <p className="text-sm text-ink-300">
            Inference uses teammate weights when present; otherwise a documented mock fusion so the demo never hard-fails.
          </p>
          {error && <p className="text-ink-50 text-sm">{error}</p>}
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
    </PageTransition>
  );
}
