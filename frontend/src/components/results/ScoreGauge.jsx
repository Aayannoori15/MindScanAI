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
    <div className="glass-card glass-hover p-5">
      <p className="text-sm text-white/50">{label}</p>
      <p className="text-3xl font-semibold mt-1 text-white">
        {shown.toFixed(1)}
        <span className="text-base text-white/35 font-normal">/{max}</span>
      </p>
      <p className="text-xs text-white/40 mt-1">{range} range</p>
      <div className="h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-teal rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
