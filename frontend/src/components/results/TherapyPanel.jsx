import { Phone, Route } from "lucide-react";

const URGENCY_COPY = {
  high: "Worth acting on this week",
  moderate: "Worth looking into",
  low: "No rush, but keep an eye on it",
  none: "Nothing needed right now",
};

/**
 * Care signposting, deliberately framed as options to consider rather than a
 * prescription — a screening tool cannot decide what someone needs.
 */
export default function TherapyPanel({ therapy }) {
  if (!therapy?.available) return null;

  return (
    <section className="space-y-4">
      <div>
        <p className="eyebrow">Support that might help</p>
        <div className="rule-teal w-16 mt-1.5 mb-2" />
        <h2 className="font-display text-2xl text-white">{therapy.headline}</h2>
        <p className="text-sm text-ink-300 mt-2 max-w-2xl leading-relaxed">{therapy.rationale}</p>
        <p className="text-[11px] uppercase tracking-wider text-ink-400 mt-3">
          {URGENCY_COPY[therapy.urgency] || ""}
        </p>
      </div>

      {!!therapy.options?.length && (
        <div className="grid md:grid-cols-2 gap-4">
          {therapy.options.map((o) => (
            <article key={o.name} className="glass-card glass-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-white">{o.name}</h3>
                <span className="text-[11px] text-ink-400 shrink-0 mt-0.5">{o.effort}</span>
              </div>
              <p className="text-sm text-ink-200 mt-2 leading-relaxed">{o.what}</p>
              <p className="text-xs text-ink-400 mt-2.5 flex gap-1.5">
                <Route size={13} className="shrink-0 mt-0.5" />
                {o.why}
              </p>
            </article>
          ))}
        </div>
      )}

      {!!therapy.directories?.length && (
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-white mb-3">Where to start, in India</p>
          <ul className="space-y-3">
            {therapy.directories.map((d) => (
              <li key={d.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-ink-100 font-medium">{d.name}</span>
                <a
                  href={`tel:${d.contact.replace(/[^0-9]/g, "")}`}
                  className="text-ink-50 font-semibold tracking-wide inline-flex items-center gap-1.5 hover:underline"
                >
                  <Phone size={13} />
                  {d.contact}
                </a>
                <span className="text-xs text-ink-400 basis-full">{d.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-ink-400">{therapy.disclaimer}</p>
    </section>
  );
}
