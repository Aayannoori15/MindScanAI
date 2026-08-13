import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy text-white neural-grid">
      <header className="flex items-center justify-between px-6 md:px-12 py-6">
        <span className="font-display text-2xl">MindScan AI</span>
        <nav className="flex gap-6 text-sm text-slate-300">
          <Link to="/about">About</Link>
          <Link to="/assessment" className="text-teal">
            Start
          </Link>
        </nav>
      </header>
      <main className="px-6 md:px-12 py-16 md:py-24 max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-6xl leading-tight"
        >
          Explainable multimodal screening for psychiatric evaluation.
        </motion.h1>
        <p className="mt-6 text-slate-300 max-w-2xl text-lg">
          Face, speech, and 18 physiological signals — fused with confidence scores, Grad-CAM, SHAP, and a clinician-ready
          report. Decision support, never a diagnosis.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/assessment" className="px-6 py-3 rounded-full bg-teal text-navy font-medium">
            Begin assessment
          </Link>
          <Link to="/realtime" className="px-6 py-3 rounded-full border border-white/20">
            Live emotion track
          </Link>
        </div>
        <svg className="mt-16 w-full max-w-lg opacity-80" viewBox="0 0 400 120" fill="none">
          <path d="M0 60 C40 20, 80 100, 120 60 S200 20, 240 60 S320 100, 400 60" stroke="#00BFA6" strokeWidth="1.5" />
          <circle cx="120" cy="60" r="4" fill="#00BFA6" />
          <circle cx="240" cy="60" r="4" fill="#F59E0B" />
          <circle cx="320" cy="80" r="4" fill="#FB7185" />
        </svg>
      </main>
    </div>
  );
}
