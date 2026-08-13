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
      <p className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</p>
      {/* The number is the point of this card, so it carries the visual weight. */}
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-5xl font-semibold tabular-nums leading-none text-white">
          {shown.toFixed(1)}
        </span>
        <span className="text-sm text-ink-400 font-normal">/ {max}</span>
      </p>
      <p className="text-xs text-ink-300 mt-2">{range} range</p>
      <div className="h-2.5 bg-white/[0.09] rounded-full mt-3 overflow-hidden">
        <div
          className="h-full bg-ink-50 rounded-full"
          style={{ width: `${pct}%`, boxShadow: "0 0 14px -2px rgba(244,244,245,0.5)" }}
        />
      </div>
    </div>
  );
}
