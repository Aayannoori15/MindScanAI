import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

export default function TopBar() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 md:px-8">
      <Link to="/" className="md:hidden flex items-center gap-2 font-display text-navy">
        <Activity className="text-teal" size={18} />
        MindScan
      </Link>
      <p className="hidden md:block text-sm text-slate-500">Explainable multimodal psychiatric screening</p>
      <span className="text-xs px-3 py-1 rounded-full bg-teal/15 text-teal font-medium">Hack2Health</span>
    </header>
  );
}
