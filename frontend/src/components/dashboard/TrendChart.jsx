import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK, TOOLTIP, series } from "../../utils/chartTheme";
import { formatISTDate, formatISTTime, istDayKey } from "../../utils/datetime";

const SERIES_KEYS = ["depression", "anxiety", "stress"];

export default function TrendChart({ sessions = [] }) {
  /*
   * Label granularity follows the data's actual span. Several sessions run in
   * one sitting is the normal case here, and a date-only axis collapses them
   * all to the same tick — so fall back to clock time whenever every session
   * shares a calendar day.
   */
  const days = new Set(sessions.map((s) => istDayKey(s.created_at)));
  const sameDay = days.size <= 1;

  const data = sessions.map((s) => {
    return {
      t: sameDay ? formatISTTime(s.created_at) : formatISTDate(s.created_at),
      depression: s.depression_score,
      anxiety: s.anxiety_score,
      stress: s.stress_score,
    };
  });

  if (!data.length) {
    return (
      <div className="glass-card p-5 h-80 grid place-items-center">
        <p className="text-sm text-ink-400">No sessions yet — run an assessment to start the trend.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 h-80">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <p className="text-sm font-medium text-white">Longitudinal D / A / S</p>
        <p className="text-[11px] text-ink-400">
          {data.length} session{data.length === 1 ? "" : "s"}
          {sameDay ? " · today, by time (IST)" : " · by date (IST)"}
        </p>
      </div>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
          <XAxis dataKey="t" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip {...TOOLTIP} />
          {/* Legend matters more here than in colour: dash pattern is the key. */}
          <Legend
            wrapperStyle={{ fontSize: 11, color: "rgba(244,244,245,0.6)", paddingTop: 6 }}
            iconType="plainline"
          />
          {SERIES_KEYS.map((k, i) => {
            const { stroke, dash } = series(i);
            return (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={stroke}
                strokeDasharray={dash}
                strokeWidth={1.75}
                dot={false}
                activeDot={{ r: 3, fill: stroke, stroke: "#0a0a0a" }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
