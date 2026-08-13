import { useEffect, useState } from "react";

export default function ScoreGauge({ label, value, max, range }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(value * p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const pct = (shown / max) * 100;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-semibold mt-1">
        {shown.toFixed(1)}
        <span className="text-base text-slate-400 font-normal">/{max}</span>
      </p>
      <p className="text-xs text-slate-500 mt-1">{range} range</p>
      <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-teal rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
