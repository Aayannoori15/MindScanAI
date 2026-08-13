import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";

export default function ModalityContribution({ weights = {}, confidence = {} }) {
  const data = ["facial", "speech", "numerical"].map((k) => ({
    k,
    weight: Math.round((weights[k] || 0) * 100),
    confidence: confidence[k] || 0,
  }));
  return (
    <div className="glass-card p-5 h-72">
      <p className="text-sm font-medium mb-2 text-white">Modality contribution & confidence</p>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.12)" />
          <PolarAngleAxis dataKey="k" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
          <Radar dataKey="weight" stroke="#00BFA6" fill="#00BFA6" fillOpacity={0.35} />
          <Radar dataKey="confidence" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
