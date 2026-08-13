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
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <PingPongVideo src="/assets/landing-bg.mp4" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

      <div className="relative z-10 h-full flex flex-col justify-between px-6 md:px-14 py-8 md:py-12">
        <header className="flex items-center justify-between">
          <span className="font-display text-xl md:text-2xl text-white tracking-tight">MindScan AI</span>
          <nav className="hidden sm:flex items-center gap-1 rounded-[999px_999px_999px_28%] bg-white/8 backdrop-blur-md border border-white/15 p-1">
            {LINKS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm text-white/80 hover:text-white hover:bg-white/12 transition duration-200"
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="max-w-xl pb-6">
          <p className="text-white/45 text-xs md:text-sm tracking-[0.22em] uppercase mb-4">Hack2Health · decision support</p>
          <h1 className="font-display text-5xl md:text-7xl text-white leading-[0.95]">MindScan AI</h1>
          <p className="mt-5 text-white/70 text-base md:text-lg leading-relaxed max-w-md">
            Measured with clarity. Face, speech, and physiology — fused, explained, never diagnosed.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/assessment" className="btn-drop btn-drop-solid">
              Begin assessment
              <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="btn-drop btn-drop-ghost">
              Open dashboard
            </Link>
          </div>
          <nav className="sm:hidden flex gap-2 mt-8">
            {LINKS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="h-11 w-11 rounded-[60%_40%_55%_45%] bg-white/10 border border-white/20 text-white grid place-items-center hover:bg-white/20 hover:scale-105 transition"
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
