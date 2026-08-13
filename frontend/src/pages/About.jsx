export default function About() {
  return (
    <div className="max-w-3xl mx-auto">
      <p className="eyebrow mb-2">Hack2Health · decision support</p>
      <h1 className="font-display text-3xl md:text-4xl text-white mb-6">About MindScan AI</h1>
      <div className="glass-card p-6 space-y-4">
        <p className="text-white/70 leading-relaxed">
          MindScan is an explainable multimodal framework for psychiatric evaluation built for Hack2Health. It fuses facial
          affect, speech prosody (including Hindi and Tamil without ASR), and 18 numerical wellness features.
        </p>
        <p className="text-white/70 leading-relaxed">
          Explanations are layered: plain English, visual Grad-CAM / SHAP, and a clinical contribution table. Crisis
          messaging follows a warm, non-alarmist tone and surfaces Indian helplines (iCall, Vandrevala, KIRAN).
        </p>
      </div>
      <p className="text-sm text-white/35 mt-6">This software is not a medical device and does not diagnose illness.</p>
    </div>
  );
}
