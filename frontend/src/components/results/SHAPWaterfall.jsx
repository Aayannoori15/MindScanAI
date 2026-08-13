import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function SHAPWaterfall({ items = [] }) {
  const data = items.slice(0, 8).map((i) => ({
    name: i.label,
    v: i.contribution,
  }));
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 h-80">
      <p className="text-sm font-medium mb-2">SHAP-style feature contributions</p>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
          <Tooltip />
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
