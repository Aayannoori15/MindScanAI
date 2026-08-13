import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

export default function TopBar() {
  return (
    <header className="h-16 border-b border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center justify-between px-4 md:px-8">
      <Link to="/" className="md:hidden flex items-center gap-2 font-display text-white">
        <Activity className="text-teal" size={18} />
        MindScan
      </Link>
      <p className="hidden md:block text-sm text-white/50">Explainable multimodal psychiatric screening</p>
      <span className="text-xs px-3 py-1 rounded-full bg-teal/15 text-teal font-medium tracking-wide">Hack2Health</span>
    </header>
  );
}
