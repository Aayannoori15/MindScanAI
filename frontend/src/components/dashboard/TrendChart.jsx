import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function TrendChart({ sessions = [] }) {
  const data = sessions.map((s) => ({
    t: new Date(s.created_at).toLocaleDateString(),
    depression: s.depression_score,
    anxiety: s.anxiety_score,
    stress: s.stress_score,
  }));
  return (
    <div className="glass-card p-5 h-80">
      <p className="text-sm font-medium mb-2 text-white">Longitudinal D / A / S</p>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#0F1B2D", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }}
            labelStyle={{ color: "white" }}
            itemStyle={{ color: "white" }}
          />
          <Line type="monotone" dataKey="depression" stroke="#7c8cff" dot={false} />
          <Line type="monotone" dataKey="anxiety" stroke="#F59E0B" dot={false} />
          <Line type="monotone" dataKey="stress" stroke="#FB7185" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
