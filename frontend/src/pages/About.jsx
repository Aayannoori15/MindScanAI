export default function About() {
  return (
    <div className="max-w-3xl mx-auto prose prose-slate">
      <h1 className="font-display text-3xl mb-4">About MindScan AI</h1>
      <p className="text-slate-600 leading-relaxed">
        MindScan is an explainable multimodal framework for psychiatric evaluation built for Hack2Health. It fuses facial
        affect, speech prosody (including Hindi and Tamil without ASR), and 18 numerical wellness features.
      </p>
      <p className="text-slate-600 leading-relaxed mt-4">
        Explanations are layered: plain English, visual Grad-CAM / SHAP, and a clinical contribution table. Crisis
        messaging follows a warm, non-alarmist tone and surfaces Indian helplines (iCall, Vandrevala, KIRAN).
      </p>
      <p className="text-sm text-slate-500 mt-6">This software is not a medical device and does not diagnose illness.</p>
    </div>
  );
}
