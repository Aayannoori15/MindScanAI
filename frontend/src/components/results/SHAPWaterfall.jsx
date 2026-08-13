import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function SHAPWaterfall({ items = [] }) {
  const data = items.slice(0, 8).map((i) => ({
    name: i.label,
    v: i.contribution,
  }));
  return (
    <div className="glass-card p-5 h-80">
      <p className="text-sm font-medium mb-2 text-white">SHAP-style feature contributions</p>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ background: "#0F1B2D", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }}
            labelStyle={{ color: "white" }}
            itemStyle={{ color: "white" }}
          />
          <Bar dataKey="v">
            {data.map((d, i) => (
              <Cell key={i} fill={d.v >= 0 ? "#FB7185" : "#00BFA6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
