export default function EmotionMeter({ emotions = {} }) {
  const entries = Object.entries(emotions);
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-xs text-slate-500">
            <span className="capitalize">{k}</span>
            <span>{Math.round(v * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal animate-pulse" style={{ width: `${v * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
