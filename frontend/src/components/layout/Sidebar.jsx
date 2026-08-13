import { Link, NavLink, Outlet } from "react-router-dom";
import { Activity, LayoutDashboard, ScanFace, Radio, Info } from "lucide-react";
import TopBar from "./TopBar";

const links = [
  { to: "/assessment", label: "Assessment", icon: ScanFace },
  { to: "/realtime", label: "Live", icon: Radio },
  { to: "/dashboard", label: "Trends", icon: LayoutDashboard },
  { to: "/about", label: "About", icon: Info },
];

export default function PageContainer() {
  return (
    <div className="min-h-screen flex bg-navy neural-grid">
      <aside className="hidden md:flex w-60 flex-col shrink-0 bg-black/20 border-r border-white/10 text-white p-6">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <Activity className="text-teal" size={20} />
          <span className="font-display text-xl tracking-tight">MindScan</span>
        </Link>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  isActive ? "bg-white/10 text-teal" : "text-white/60 hover:bg-white/5 hover:text-white/90"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto text-[11px] text-white/35 leading-relaxed">
          Decision support only. Not a clinical diagnosis.
        </p>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
