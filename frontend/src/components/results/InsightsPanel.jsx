import { ScanFace, AudioLines, SlidersHorizontal } from "lucide-react";

function Bar({ pct, tone = "teal" }) {
  const color = tone === "rose" ? "bg-rose" : tone === "amber" ? "bg-amber" : "bg-teal";
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function distressTone(pct) {
  if (pct >= 60) return "rose";
  if (pct >= 30) return "amber";
  return "teal";
}

function Unavailable({ icon: Icon, title, reason }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 text-white/50">
        <Icon size={16} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-xs text-white/35 mt-2">{reason}</p>
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
        <p className="text-sm text-white/45 mt-1">
          Per-modality output from this submission — the evidence behind the scores above.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {facial &&
          (facial.available ? (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ScanFace size={16} className="text-teal" />
                <p className="text-sm font-medium text-white">Facial expression</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl text-white capitalize">{facial.detected_emotion}</span>
                <span className="text-sm text-white/45">{facial.confidence}% confident</span>
              </div>
              <p className="text-xs text-white/45 mt-1">
                maps to <span className="text-teal">{facial.maps_to.replace("_", " ")}</span>
              </p>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">Distress level</span>
                  <span className="text-white/80">{facial.distress_level}%</span>
                </div>
                <Bar pct={facial.distress_level} tone={distressTone(facial.distress_level)} />
              </div>

              <div className="mt-4 space-y-2">
                {facial.top_emotions.map((e) => (
                  <div key={e.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60 capitalize">{e.label}</span>
                      <span className="text-white/45">{e.probability}%</span>
                    </div>
                    <Bar pct={e.probability} />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/30 mt-4">{facial.source}</p>
            </div>
          ) : (
            <Unavailable icon={ScanFace} title="Facial expression" reason={facial.reason} />
          ))}

        {speech &&
          (speech.available ? (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AudioLines size={16} className="text-teal" />
                <p className="text-sm font-medium text-white">Voice</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl text-white">
                  {speech.detected_status.replace("_", " ")}
                </span>
                <span className="text-sm text-white/45">{speech.confidence}% confident</span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">Distress level</span>
                  <span className="text-white/80">{speech.distress_level}%</span>
                </div>
                <Bar pct={speech.distress_level} tone={distressTone(speech.distress_level)} />
              </div>

              <div className="mt-4 space-y-2">
                {speech.top_statuses.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{s.label.replace("_", " ")}</span>
                      <span className="text-white/45">{s.probability}%</span>
                    </div>
                    <Bar pct={s.probability} />
                  </div>
                ))}
              </div>

              {speech.extracted_acoustics && (
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-white/10 pt-3">
                  {Object.entries(speech.extracted_acoustics).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-white/45">{k.replace(/_/g, " ")}</dt>
                      <dd className="text-white/75">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="text-[11px] text-white/30 mt-4">{speech.source}</p>
            </div>
          ) : (
            <Unavailable icon={AudioLines} title="Voice" reason={speech.reason} />
          ))}
      </div>

      {numerical?.available && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={16} className="text-teal" />
            <p className="text-sm font-medium text-white">Strongest inputs from your form</p>
          </div>
          <div className="space-y-2.5">
            {numerical.top_drivers.map((d) => (
              <div key={d.feature} className="flex items-center gap-3 text-xs">
                <span className="text-white/70 flex-1 min-w-0 truncate">{d.label}</span>
                <span className="text-white/90 tabular-nums w-14 text-right">{d.value}</span>
                <span className="text-white/40 tabular-nums w-16 text-right">
                  {d.z_score > 0 ? "+" : ""}
                  {d.z_score} SD
                </span>
                <span
                  className={`w-28 text-right ${d.effect === "raises burden" ? "text-rose" : "text-teal"}`}
                >
                  {d.effect}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/30 mt-4">{numerical.source}</p>
        </div>
      )}
    </section>
  );
}
