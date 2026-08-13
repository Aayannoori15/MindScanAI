import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

export default function TopBar() {
  return (
    <header className="h-16 border-b border-neutral-200 bg-white/90 backdrop-blur flex items-center justify-between px-4 md:px-8">
      <Link to="/" className="md:hidden flex items-center gap-2 font-display text-black">
        <Activity className="text-neutral-500" size={18} />
        MindScan
      </Link>
      <p className="hidden md:block text-sm text-neutral-500">Explainable multimodal psychiatric screening</p>
      <span className="text-xs px-3 py-1 rounded-[999px_999px_999px_28%] bg-neutral-100 text-neutral-700 border border-neutral-200 font-medium hover:bg-neutral-200 transition">
        Hack2Health
      </span>
    </header>
  );
}
