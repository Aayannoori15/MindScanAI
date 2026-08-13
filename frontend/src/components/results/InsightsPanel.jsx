import { ScanFace, AudioLines, SlidersHorizontal } from "lucide-react";

/*
 * Distress reads as brightness, matching StatusBadge: the more distress the
 * models see, the more light the bar catches. A glow is added above the
 * halfway mark so a high reading is unmistakable without introducing hue.
 */
function Bar({ pct, tone = "muted" }) {
  const p = Math.min(100, Math.max(0, pct));
  const fill = tone === "high" ? "#f4f4f5" : tone === "mid" ? "#a8a8a8" : "#6a6a6a";
  return (
    <div className="h-2 w-full rounded-full bg-white/[0.09] overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${p}%`,
          background: fill,
          boxShadow: tone === "high" ? "0 0 12px 0 rgba(244,244,245,0.55)" : "none",
        }}
      />
    </div>
  );
}

function distressTone(pct) {
  if (pct >= 60) return "high";
  if (pct >= 30) return "mid";
  return "muted";
}

function Unavailable({ icon: Icon, title, reason }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 text-ink-300">
        <Icon size={16} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-xs text-ink-400 mt-2">{reason}</p>
    </div>
  );
}

export default function InsightsPanel({ insights }) {
  if (!insights || !Object.keys(insights).length) return null;
  const { facial, speech, numerical } = insights;

  return (
    <section className="space-y-4">
      <div>
        <p className="eyebrow">What the models actually detected</p>
        <p className="text-sm text-ink-300 mt-1">
          Per-modality output from this submission — the evidence behind the scores above.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {facial &&
          (facial.available ? (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ScanFace size={16} className="text-ink-200" />
                <p className="text-sm font-medium text-white">Facial expression</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl text-white capitalize">{facial.detected_emotion}</span>
                <span className="text-sm text-ink-200"><span className="text-ink-50 font-semibold tabular-nums">{facial.confidence}%</span> confident</span>
              </div>
              <p className="text-xs text-ink-300 mt-1">
                maps to <span className="text-ink-200">{facial.maps_to.replace("_", " ")}</span>
              </p>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-300">Distress level</span>
                  <span className="text-ink-50 font-semibold tabular-nums text-sm">{facial.distress_level}%</span>
                </div>
                <Bar pct={facial.distress_level} tone={distressTone(facial.distress_level)} />
              </div>

              <div className="mt-4 space-y-2">
                {facial.top_emotions.map((e) => (
                  <div key={e.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-300 capitalize">{e.label}</span>
                      <span className="text-ink-200 tabular-nums font-medium">{e.probability}%</span>
                    </div>
                    <Bar pct={e.probability} />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-ink-400 mt-4">{facial.source}</p>
            </div>
          ) : (
            <Unavailable icon={ScanFace} title="Facial expression" reason={facial.reason} />
          ))}

        {speech &&
          (speech.available ? (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AudioLines size={16} className="text-ink-200" />
                <p className="text-sm font-medium text-white">Voice</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl text-white">
                  {speech.detected_status.replace("_", " ")}
                </span>
                <span className="text-sm text-ink-200"><span className="text-ink-50 font-semibold tabular-nums">{speech.confidence}%</span> confident</span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-300">Distress level</span>
                  <span className="text-ink-50 font-semibold tabular-nums text-sm">{speech.distress_level}%</span>
                </div>
                <Bar pct={speech.distress_level} tone={distressTone(speech.distress_level)} />
              </div>

              <div className="mt-4 space-y-2">
                {speech.top_statuses.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-300">{s.label.replace("_", " ")}</span>
                      <span className="text-ink-200 tabular-nums font-medium">{s.probability}%</span>
                    </div>
                    <Bar pct={s.probability} />
                  </div>
                ))}
              </div>

              {speech.extracted_acoustics && (
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-white/10 pt-3">
                  {Object.entries(speech.extracted_acoustics).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-ink-300">{k.replace(/_/g, " ")}</dt>
                      <dd className="text-ink-50 font-medium tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="text-[11px] text-ink-400 mt-4">{speech.source}</p>
            </div>
          ) : (
            <Unavailable icon={AudioLines} title="Voice" reason={speech.reason} />
          ))}
      </div>

      {numerical?.available && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={16} className="text-ink-200" />
            <p className="text-sm font-medium text-white">Strongest inputs from your form</p>
          </div>
          <div className="space-y-2.5">
            {numerical.top_drivers.map((d) => (
              <div key={d.feature} className="flex items-center gap-3 text-xs">
                <span className="text-ink-200 flex-1 min-w-0 truncate">{d.label}</span>
                <span className="text-ink-50 font-semibold tabular-nums w-14 text-right">{d.value}</span>
                <span className="text-ink-300 tabular-nums w-16 text-right">
                  {d.z_score > 0 ? "+" : ""}
                  {d.z_score} SD
                </span>
                <span
                  className={`w-28 text-right ${d.effect === "raises burden" ? "text-ink-50" : "text-ink-200"}`}
                >
                  {d.effect}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-400 mt-4">{numerical.source}</p>
        </div>
      )}
    </section>
  );
}
