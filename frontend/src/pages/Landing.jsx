import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Info,
  LayoutDashboard,
  Leaf,
  MessagesSquare,
  Radio,
  ScanFace,
  LifeBuoy,
} from "lucide-react";
import PingPongVideo from "../components/layout/PingPongVideo";

const LINKS = [
  { to: "/assessment", icon: ScanFace, label: "Assessment" },
  { to: "/realtime", icon: Radio, label: "Live" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Trends" },
  { to: "/relax", icon: Leaf, label: "Relax" },
  { to: "/companion", icon: MessagesSquare, label: "Talk" },
  { to: "/library", icon: BookOpen, label: "Reading" },
  { to: "/help", icon: LifeBuoy, label: "Help" },
  { to: "/about", icon: Info, label: "About" },
];

export default function Landing() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <PingPongVideo src="/assets/landing-bg.mp4" className="absolute inset-0 h-full w-full object-cover" />
      {/* Left-weighted scrim so the copy sits on darkness while the ring stays visible right. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

      <div className="relative z-10 h-full flex items-center px-6 md:px-14 py-8">
        {/* Left: identity and the two actions, vertically centred. */}
        <main className="max-w-xl">
          <p className="text-white/45 text-xs md:text-sm tracking-[0.22em] uppercase mb-4">
            Hack2Health · decision support
          </p>
          <h1 className="font-display text-5xl md:text-7xl text-white leading-[0.95]">MindScan AI</h1>
          <p className="mt-5 text-white/70 text-base md:text-lg leading-relaxed max-w-md">
            Measured with clarity. Face, speech, and physiology — fused, explained, never diagnosed.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/assessment" className="drop-btn drop-btn-solid">
              Begin assessment
              <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="drop-btn drop-btn-quiet">
              Open dashboard
            </Link>
          </div>

          {/* Below md the right rail collapses into a wrapping row here. */}
          <nav className="md:hidden flex flex-wrap gap-2 mt-10">
            {LINKS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20 text-white/85 text-xs hover:bg-white/20 transition"
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>
        </main>

        {/*
          Right rail. `ml-auto` pins it to the far edge — the left column is
          width-capped, so without this the nav would settle mid-canvas.
          Fixed column width so every pill matches; icons are left-aligned
          inside so the labels form a clean vertical edge.
        */}
        <nav className="hidden md:flex flex-col gap-2.5 shrink-0 ml-auto pl-10 w-[13.5rem]">
          {LINKS.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="drop-btn drop-btn-quiet w-full !justify-start gap-3">
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Wordmark stays pinned so the centred block reads as the hero. */}
      <span className="absolute top-8 left-6 md:left-14 z-10 font-display text-xl md:text-2xl text-white/90 tracking-tight">
        MindScan AI
      </span>
    </div>
  );
}
