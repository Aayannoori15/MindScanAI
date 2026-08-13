import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, LayoutDashboard, ScanFace, Radio, Info, Leaf, MessagesSquare, BookOpen, LifeBuoy } from "lucide-react";
import TopBar from "./TopBar";
import RingScene from "./RingScene";

const links = [
  { to: "/assessment", label: "Assessment", icon: ScanFace },
  { to: "/realtime", label: "Live", icon: Radio },
  { to: "/dashboard", label: "Trends", icon: LayoutDashboard },
  { to: "/relax", label: "Relax", icon: Leaf },
  { to: "/companion", label: "Companion", icon: MessagesSquare },
  { to: "/library", label: "Reading", icon: BookOpen },
  { to: "/help", label: "Help", icon: LifeBuoy },
  { to: "/about", label: "About", icon: Info },
];

export default function PageContainer() {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <div className="ambient-stage min-h-screen flex">
      {/*
        The hero's ring, kept as a faint presence behind the whole app so inner
        pages sit in the same space rather than a different one. Low opacity and
        pointer-events-none: it is scenery, never a target.
      */}
      <RingScene className="pointer-events-none fixed -right-[18vw] -top-[12vh] -z-10 h-[80vh] w-[80vw] opacity-[0.28]" />

      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/[0.07] bg-black/40 backdrop-blur-xl p-6">
        <Link to="/" className="flex items-center gap-2 mb-10 group">
          <Activity className="text-ink-200 transition group-hover:text-white" size={20} />
          <span className="font-display text-xl tracking-tight text-white">MindScan</span>
        </Link>

        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-white/[0.07] text-white nav-active-glow"
                    : "text-ink-400 hover:bg-white/[0.04] hover:text-ink-100"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <div className="rule-teal w-full mb-3" />
          <p className="text-[11px] text-ink-400 leading-relaxed">
            Decision support only. Not a clinical diagnosis.
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-8">
          {/* Keyed on pathname so each route change replays the entrance. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
