import { Link, NavLink } from "react-router-dom";
import { Activity, LayoutDashboard, ScanFace, Radio, Info } from "lucide-react";

const links = [
  { to: "/assessment", label: "Assessment", icon: ScanFace },
  { to: "/realtime", label: "Live", icon: Radio },
  { to: "/dashboard", label: "Trends", icon: LayoutDashboard },
  { to: "/about", label: "About", icon: Info },
];

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-navy/60 backdrop-blur-xl flex items-center justify-between gap-3 px-4 md:px-8">
      <Link to="/" className="md:hidden flex items-center gap-2 font-display text-white shrink-0">
        <Activity className="text-teal" size={18} />
        MindScan
      </Link>

      <p className="hidden md:block text-sm text-white/45">Explainable multimodal psychiatric screening</p>

      {/* The sidebar is hidden below md, so the nav has to live here on phones. */}
      <nav className="md:hidden flex items-center gap-1 rounded-full bg-white/[0.07] border border-white/10 p-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `h-8 w-8 grid place-items-center rounded-full transition ${
                isActive ? "bg-teal/20 text-teal" : "text-white/55 hover:text-white/90"
              }`
            }
          >
            <Icon size={15} />
          </NavLink>
        ))}
      </nav>

      <span className="hidden sm:inline text-xs px-3 py-1 rounded-full bg-teal/15 border border-teal/20 text-teal font-medium tracking-wide shrink-0">
        Hack2Health
      </span>
    </header>
  );
}
