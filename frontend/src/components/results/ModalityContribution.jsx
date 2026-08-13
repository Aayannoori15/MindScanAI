import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { AXIS_TICK, AXIS_TICK_STRONG, GRID_STROKE, series } from "../../utils/chartTheme";

export default function ModalityContribution({ weights = {}, confidence = {} }) {
  const data = ["facial", "speech", "numerical"].map((k) => ({
    k,
    weight: Math.round((weights[k] || 0) * 100),
    confidence: confidence[k] || 0,
  }));

  const w = series(0); // brightest, solid — the headline series
  const c = series(1); // dimmer, dashed

  return (
    <div className="glass-card p-5 h-72">
      <p className="text-sm font-medium mb-2 text-white">Modality contribution &amp; confidence</p>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke={GRID_STROKE} />
          <PolarAngleAxis dataKey="k" tick={AXIS_TICK_STRONG} />
          <PolarRadiusAxis domain={[0, 100]} tick={AXIS_TICK} axisLine={false} />
          <Radar
            name="weight"
            dataKey="weight"
            stroke={w.stroke}
            fill={w.stroke}
            fillOpacity={0.22}
            strokeWidth={1.75}
          />
          <Radar
            name="confidence"
            dataKey="confidence"
            stroke={c.stroke}
            strokeDasharray={c.dash}
            fill={c.stroke}
            fillOpacity={0.08}
            strokeWidth={1.5}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "rgba(244,244,245,0.6)" }} iconType="plainline" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
