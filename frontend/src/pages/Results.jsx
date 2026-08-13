import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import StatusBadge from "../components/results/StatusBadge";
import ScoreGauge from "../components/results/ScoreGauge";
import ModalityContribution from "../components/results/ModalityContribution";
import GradCAMOverlay from "../components/results/GradCAMOverlay";
import SHAPWaterfall from "../components/results/SHAPWaterfall";
import InsightsPanel from "../components/results/InsightsPanel";
import ExplainPanel from "../components/results/ExplainPanel";
import DownloadReport from "../components/results/DownloadReport";
import WellnessSuggestions from "../components/dashboard/WellnessSuggestions";
import EmotionTimeline from "../components/dashboard/EmotionTimeline";
import CrisisAlert from "../components/shared/CrisisAlert";
import PageHeader from "../components/layout/PageHeader";
import PageTransition, { Reveal } from "../components/layout/PageTransition";

export default function Results() {
  const result = useSelector((s) => s.assessment.result);
  const [showCrisis, setShowCrisis] = useState(true);

  if (!result) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader eyebrow="Results" title="Nothing to show yet" lede="Run an assessment and its results will appear here." />
        <Link to="/assessment" className="pill-btn-primary mt-6">
          Start an assessment
        </Link>
      </div>
    );
  }

  const cam = result.explanation?.level2_visual?.gradcam || {};
  const shap = result.explanation?.level2_visual?.shap_waterfall || [];

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-10">
      {showCrisis && <CrisisAlert crisis={result.crisis} onClose={() => setShowCrisis(false)} />}

      <Reveal>
        <PageHeader
          eyebrow={`Session #${result.session_id}`}
          title="Results"
          lede="Face, voice and self-reported signals, fused and explained."
          actions={<StatusBadge label={result.status_label} />}
        />
      </Reveal>

      {result.using_mock_models && (
        <Reveal>
          <p className="text-xs text-amber bg-amber/10 border border-amber/20 rounded-xl px-3 py-2">
            Running the documented mock pipeline — drop .pt files into backend/models to switch to trained weights.
          </p>
        </Reveal>
      )}

      <Reveal>
        <div className="grid md:grid-cols-3 gap-4">
          <ScoreGauge label="Depression" value={result.scores.depression} max={34} range={result.scores.depression_range} />
          <ScoreGauge label="Anxiety" value={result.scores.anxiety} max={24} range={result.scores.anxiety_range} />
          <ScoreGauge label="Stress" value={result.scores.stress} max={39} range={result.scores.stress_range} />
        </div>
      </Reveal>

      <Reveal>
        <InsightsPanel insights={result.insights} />
      </Reveal>

      <Reveal>
        <section className="space-y-4">
          <SectionTitle eyebrow="Explainability" title="How the models got here" />
          <div className="grid md:grid-cols-2 gap-4">
            <ModalityContribution weights={result.modality_weights} confidence={result.modality_confidence} />
            <div className="glass-card p-5">
              <p className="text-sm font-medium mb-3 text-white">Grad-CAM · model attention</p>
              <GradCAMOverlay b64={cam.heatmap_png_b64} focus={cam.focus} />
            </div>
          </div>
          <SHAPWaterfall items={shap} />
          <EmotionTimeline timeline={result.emotion_timeline} />
          <ExplainPanel explanation={result.explanation} />
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-4">
          <SectionTitle eyebrow="Next steps" title="Personalized wellness" />
          <WellnessSuggestions wellness={result.wellness} />
          <DownloadReport result={result} />
        </section>
      </Reveal>
    </PageTransition>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <div className="rule-teal w-16 mt-1.5 mb-2" />
      <h2 className="font-display text-2xl text-white">{title}</h2>
    </div>
  );
}
