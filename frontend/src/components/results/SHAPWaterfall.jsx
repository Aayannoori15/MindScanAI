import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK, AXIS_TICK_STRONG, DIVERGING, TOOLTIP } from "../../utils/chartTheme";

export default function SHAPWaterfall({ items = [] }) {
  const data = items.slice(0, 8).map((i) => ({ name: i.label, v: i.contribution }));

  if (!data.length) {
    return (
      <div className="glass-card p-5 h-80 grid place-items-center">
        <p className="text-sm text-ink-400">No numerical features submitted, so there is nothing to attribute.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 h-80">
      <p className="text-sm font-medium text-white">Feature contributions</p>
      {/* Direction is encoded by side of zero and by fill brightness, not hue. */}
      <p className="text-xs text-ink-400 mb-2">
        Right of zero raises estimated burden; left lowers it.
      </p>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 12, top: 4, bottom: 8 }}>
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={AXIS_TICK_STRONG}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip {...TOOLTIP} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.28)" />
          <Bar dataKey="v" radius={[2, 2, 2, 2]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.v >= 0 ? DIVERGING.positive : DIVERGING.negative} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
