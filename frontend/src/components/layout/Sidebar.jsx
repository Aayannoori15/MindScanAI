import { NavLink, Outlet } from "react-router-dom";
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
    <div className="min-h-screen flex bg-mist">
      <aside className="hidden md:flex w-60 flex-col bg-navy text-white p-6">
        <div className="flex items-center gap-2 mb-10">
          <Activity className="text-teal" />
          <span className="font-display text-xl">MindScan</span>
        </div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                  isActive ? "bg-white/10 text-teal" : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto text-[11px] text-slate-400 leading-relaxed">
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
