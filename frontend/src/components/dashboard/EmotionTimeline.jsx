import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TOOLTIP, series } from "../../utils/chartTheme";

export default function EmotionTimeline({ timeline }) {
  if (!timeline?.available) return <p className="text-sm text-ink-400">No live emotion samples in this session.</p>;
  const keys = Object.keys(timeline.series || {});
  const n = timeline.series[keys[0]]?.length || 0;
  const data = Array.from({ length: n }, (_, i) => {
    const row = { t: i };
    keys.forEach((k) => {
      row[k] = timeline.series[k][i]?.v ?? 0;
    });
    return row;
  });
  return (
    <div className="glass-card p-5 h-72">
      <p className="text-sm font-medium mb-1 text-white">Session emotion timeline</p>
      <p className="text-xs text-ink-400 mb-2">Dominant: {timeline.dominant}</p>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="t" hide />
          <YAxis domain={[0, 1]} hide />
          <Tooltip {...TOOLTIP} />
          <Legend wrapperStyle={{ fontSize: 11, color: "rgba(244,244,245,0.6)" }} iconType="plainline" />
          {keys.map((k, i) => {
            const { stroke, dash } = series(i);
            return (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={stroke}
                strokeDasharray={dash}
                dot={false}
                strokeWidth={1.5}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
