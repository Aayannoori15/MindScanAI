import { useMemo, useState } from "react";
import { AlertTriangle, Clock, Globe, Phone, Search } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import PageTransition, { Reveal } from "../components/layout/PageTransition";
import { EMERGENCY, GROUPS, HELPLINES } from "../components/help/helplines";

const tel = (n) => `tel:${n.replace(/[^0-9+]/g, "")}`;

function HelplineCard({ h }) {
  return (
    <article className="glass-card glass-hover p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-white leading-snug">{h.name}</h3>
          <p className="text-[11px] text-ink-400 mt-0.5">{h.org}</p>
        </div>
        {h.hours === "24×7" && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.09] border border-white/15 text-ink-100 shrink-0">
            24×7
          </span>
        )}
      </div>

      {/* The number is the reason this card exists, so it gets the weight. */}
      <a
        href={tel(h.number)}
        className="mt-3 inline-flex items-center gap-2 text-2xl font-semibold tracking-wide text-ink-50 hover:underline underline-offset-4 tabular-nums"
      >
        <Phone size={17} className="shrink-0" />
        {h.number}
      </a>
      {h.alt && (
        <a href={tel(h.alt)} className="text-sm text-ink-300 mt-1 hover:text-ink-100 tabular-nums">
          or {h.alt}
        </a>
      )}

      <p className="text-sm text-ink-300 mt-3 leading-relaxed flex-1">{h.note}</p>

      <dl className="mt-3 pt-3 border-t border-white/10 space-y-1 text-[11px] text-ink-400">
        <div className="flex items-start gap-1.5">
          <Clock size={12} className="mt-0.5 shrink-0" />
          <dd>{h.hours}</dd>
        </div>
        <div className="flex items-start gap-1.5">
          <Globe size={12} className="mt-0.5 shrink-0" />
          <dd>{h.languages}</dd>
        </div>
        {(h.region || h.audience) && (
          <div className="text-ink-300">{h.region || h.audience}</div>
        )}
      </dl>
    </article>
  );
}

export default function Help() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return HELPLINES;
    return HELPLINES.filter((h) =>
      [h.name, h.org, h.region, h.audience, h.languages, h.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [q]);

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-8">
      <Reveal>
        <PageHeader
          eyebrow="Help"
          title="Someone will pick up"
          lede="Free, confidential helplines across India. You don't need to be in crisis to call one."
        />
      </Reveal>

      {/* Emergency sits above everything and breaks the palette deliberately. */}
      <Reveal>
        <div
          className="glass-card p-5"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.22) inset, 0 0 44px -20px rgba(244,244,245,0.6)" }}
        >
          <p className="flex items-center gap-2 text-white font-medium">
            <AlertTriangle size={16} />
            {EMERGENCY.label}
          </p>
          <p className="text-sm text-ink-300 mt-1.5">{EMERGENCY.note}</p>
          <div className="flex flex-wrap gap-3 mt-4">
            {EMERGENCY.numbers.map((n) => (
              <a key={n.number} href={tel(n.number)} className="drop-btn drop-btn-solid">
                <Phone size={16} />
                {n.name} · {n.number}
              </a>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <label className="glass-card flex items-center gap-3 px-4 py-3">
          <Search size={16} className="text-ink-400 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by city, language or service…"
            className="flex-1 bg-transparent text-ink-50 placeholder:text-ink-400 focus:outline-none"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-xs text-ink-400 hover:text-ink-100">
              Clear
            </button>
          )}
        </label>
      </Reveal>

      {GROUPS.map((g) => {
        const items = filtered.filter((h) => h.scope === g.id);
        if (!items.length) return null;
        return (
          <Reveal key={g.id}>
            <section className="space-y-4">
              <div>
                <p className="eyebrow">{g.label}</p>
                <div className="rule-teal w-16 mt-1.5 mb-1.5" />
                <p className="text-sm text-ink-400">{g.hint}</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((h) => (
                  <HelplineCard key={h.name} h={h} />
                ))}
              </div>
            </section>
          </Reveal>
        );
      })}

      {filtered.length === 0 && (
        <Reveal>
          <p className="text-sm text-ink-400">
            Nothing matched that. Try a city, a language, or clear the search — the national lines
            above cover all of India.
          </p>
        </Reveal>
      )}

      <Reveal>
        <div className="glass-card p-5 space-y-2">
          <p className="text-sm text-white font-medium">Before you call</p>
          <p className="text-sm text-ink-300 leading-relaxed">
            You don't need the right words, and you don't need to be at your worst to be worth
            someone's time. It's fine to say "I don't really know why I'm calling."
          </p>
          <p className="text-[11px] text-ink-400 pt-2">
            Helpline numbers and hours change. If one doesn't connect, try another rather than
            giving up — Tele-MANAS (14416) and KIRAN (1800-599-0019) are staffed around the clock.
          </p>
        </div>
      </Reveal>
    </PageTransition>
  );
}
