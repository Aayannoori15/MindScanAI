import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import StatusBadge from "../components/results/StatusBadge";
import ScoreGauge from "../components/results/ScoreGauge";
import ModalityContribution from "../components/results/ModalityContribution";
import GradCAMOverlay from "../components/results/GradCAMOverlay";
import SHAPWaterfall from "../components/results/SHAPWaterfall";
import ExplainPanel from "../components/results/ExplainPanel";
import DownloadReport from "../components/results/DownloadReport";
import WellnessSuggestions from "../components/dashboard/WellnessSuggestions";
import EmotionTimeline from "../components/dashboard/EmotionTimeline";
import CrisisAlert from "../components/shared/CrisisAlert";

export default function Results() {
  const result = useSelector((s) => s.assessment.result);
  const [showCrisis, setShowCrisis] = useState(true);

  if (!result) {
    return (
      <p className="text-slate-500">
        No result in memory. <Link className="text-teal" to="/assessment">Run an assessment</Link>.
      </p>
    );
  }

  const cam = result.explanation?.level2_visual?.gradcam || {};
  const shap = result.explanation?.level2_visual?.shap_waterfall || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showCrisis && <CrisisAlert crisis={result.crisis} onClose={() => setShowCrisis(false)} />}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">Results</h1>
          <p className="text-sm text-slate-500">Session #{result.session_id}</p>
        </div>
        <StatusBadge label={result.status_label} />
      </div>
      {result.using_mock_models && (
        <p className="text-xs text-amber bg-amber/10 rounded-xl px-3 py-2">
          Running the documented mock pipeline — drop .pt files into backend/models to switch to trained weights.
        </p>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        <ScoreGauge label="Depression" value={result.scores.depression} max={34} range={result.scores.depression_range} />
        <ScoreGauge label="Anxiety" value={result.scores.anxiety} max={24} range={result.scores.anxiety_range} />
        <ScoreGauge label="Stress" value={result.scores.stress} max={39} range={result.scores.stress_range} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <ModalityContribution weights={result.modality_weights} confidence={result.modality_confidence} />
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <p className="text-sm font-medium mb-3">Level 2 · Grad-CAM</p>
          <GradCAMOverlay b64={cam.heatmap_png_b64} focus={cam.focus} />
        </div>
      </div>
      <SHAPWaterfall items={shap} />
      <EmotionTimeline timeline={result.emotion_timeline} />
      <ExplainPanel explanation={result.explanation} />
      <h2 className="font-display text-2xl">Personalized wellness</h2>
      <WellnessSuggestions wellness={result.wellness} />
      <DownloadReport result={result} />
    </div>
  );
}
