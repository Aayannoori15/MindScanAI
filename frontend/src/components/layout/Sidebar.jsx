import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, LayoutDashboard, ScanFace, Radio, Info } from "lucide-react";
import TopBar from "./TopBar";

const links = [
  { to: "/assessment", label: "Assessment", icon: ScanFace },
  { to: "/realtime", label: "Live", icon: Radio },
  { to: "/dashboard", label: "Trends", icon: LayoutDashboard },
  { to: "/about", label: "About", icon: Info },
];

export default function PageContainer() {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <div className="ambient-stage min-h-screen flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/10 bg-black/25 backdrop-blur-xl p-6">
        <Link to="/" className="flex items-center gap-2 mb-10 group">
          <Activity className="text-teal transition group-hover:brightness-125" size={20} />
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
                    ? "bg-white/[0.08] text-teal nav-active-glow"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white/90"
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
          <p className="text-[11px] text-white/35 leading-relaxed">
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
