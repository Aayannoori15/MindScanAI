import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function EmotionTimeline({ timeline }) {
  if (!timeline?.available) return <p className="text-sm text-slate-500">No live emotion samples in this session.</p>;
  const keys = Object.keys(timeline.series || {});
  const n = timeline.series[keys[0]]?.length || 0;
  const data = Array.from({ length: n }, (_, i) => {
    const row = { t: i };
    keys.forEach((k) => {
      row[k] = timeline.series[k][i]?.v ?? 0;
    });
    return row;
  });
  const palette = ["#00BFA6", "#F59E0B", "#FB7185", "#7c8cff", "#38bdf8", "#94a3b8"];
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 h-72">
      <p className="text-sm font-medium mb-1">Session emotion timeline</p>
      <p className="text-xs text-slate-500 mb-2">Dominant: {timeline.dominant}</p>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis domain={[0, 1]} hide />
          <Tooltip />
          {keys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={palette[i % palette.length]} dot={false} strokeWidth={1.5} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
