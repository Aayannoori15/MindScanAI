import { Link } from "react-router-dom";
import { ArrowRight, Info, LayoutDashboard, Radio, ScanFace } from "lucide-react";
import PingPongVideo from "../components/layout/PingPongVideo";

const LINKS = [
  { to: "/assessment", icon: ScanFace, label: "Assessment" },
  { to: "/realtime", icon: Radio, label: "Live" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Trends" },
  { to: "/about", icon: Info, label: "About" },
];

export default function Landing() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#111318]">
      <PingPongVideo src="/assets/landing-bg.mp4" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

      <div className="relative z-10 h-full flex flex-col justify-between px-6 md:px-14 py-8 md:py-12">
        <header className="flex items-center justify-between">
          <span className="font-display text-xl md:text-2xl text-white tracking-tight">MindScan AI</span>
          <nav className="hidden sm:flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 p-1">
            {LINKS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-white/90 hover:bg-white/10 hover:text-teal transition"
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="max-w-xl pb-6">
          <p className="text-teal text-xs md:text-sm tracking-[0.22em] uppercase mb-4">Hack2Health · decision support</p>
          <h1 className="font-display text-5xl md:text-7xl text-white leading-[0.95]">MindScan AI</h1>
          <p className="mt-5 text-white/80 text-base md:text-lg leading-relaxed max-w-md">
            Measured with clarity. Face, speech, and physiology — fused, explained, never diagnosed.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/assessment"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal text-navy font-medium hover:brightness-110 transition"
            >
              Begin assessment
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 rounded-full border border-white/25 text-white hover:bg-white/10 transition"
            >
              Open dashboard
            </Link>
          </div>
          <nav className="sm:hidden flex gap-2 mt-8">
            {LINKS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="h-11 w-11 rounded-full bg-white/10 border border-white/15 text-white grid place-items-center"
              >
                <Icon size={16} />
              </Link>
            ))}
          </nav>
        </main>
      </div>
    </div>
  );
}
