import PageHeader from "../components/layout/PageHeader";
import PageTransition, { Reveal } from "../components/layout/PageTransition";

const PILLARS = [
  {
    title: "Facial affect",
    body: "A fine-tuned ResNet18 reads expression from a detected, tightly-cropped face (70.3% validation accuracy across 7 FER classes).",
  },
  {
    title: "Speech prosody",
    body: "wav2vec2-base, fine-tuned on RAVDESS, judges tone rather than words — so it works without transcription, across languages.",
  },
  {
    title: "Self-reported signals",
    body: "18 wellness and autonomic features, z-scored against a 4,000-row reference distribution.",
  },
];

export default function About() {
  return (
    <PageTransition className="max-w-3xl mx-auto space-y-8">
      <Reveal>
        <PageHeader
          eyebrow="Hack2Health · decision support"
          title="About MindScan AI"
          lede="An explainable multimodal framework for psychiatric screening — face, voice and physiology, fused and accounted for."
        />
      </Reveal>

      <Reveal>
        <div className="grid sm:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <article key={p.title} className="glass-card glass-hover p-5">
              <h3 className="font-medium text-white">{p.title}</h3>
              <p className="text-sm text-white/55 mt-2 leading-relaxed">{p.body}</p>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-display text-2xl text-white">Explanations, three ways</h2>
          <p className="text-white/65 leading-relaxed">
            Every result is accounted for in plain English, visually through Grad-CAM saliency and feature
            contributions, and as a clinical table — so a score can be checked rather than taken on trust.
          </p>
          <p className="text-white/65 leading-relaxed">
            Crisis messaging stays warm and non-alarmist, surfacing Indian helplines (iCall, Vandrevala, KIRAN)
            when the signals warrant it.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <p className="text-sm text-white/35">
          This software is not a medical device and does not diagnose illness.
        </p>
      </Reveal>
    </PageTransition>
  );
}
