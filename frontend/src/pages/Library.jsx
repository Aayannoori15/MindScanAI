import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowUpRight, Clock } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import PageTransition, { Reveal } from "../components/layout/PageTransition";
import { ARTICLES, TOPICS } from "../components/articles/library";

/** Maps the latest screening onto the topics most worth reading first. */
function suggestedTopics(result) {
  if (!result?.scores) return [];
  const { depression, anxiety, stress } = result.scores;
  const ranked = [
    { topic: "low-mood", value: depression / 34 },
    { topic: "anxiety", value: anxiety / 24 },
    { topic: "stress", value: stress / 39 },
  ]
    .filter((r) => r.value >= 0.3)
    .sort((a, b) => b.value - a.value)
    .map((r) => r.topic);
  if (result.status_label === "Severe_Stress") ranked.push("getting-help");
  return ranked.slice(0, 2);
}

export default function Library() {
  const result = useSelector((s) => s.assessment.result);
  const [topic, setTopic] = useState("all");

  const suggested = useMemo(() => suggestedTopics(result), [result]);

  const articles = useMemo(() => {
    const list = topic === "all" ? ARTICLES : ARTICLES.filter((a) => a.topics.includes(topic));
    if (topic !== "all" || !suggested.length) return list;
    // With no filter applied, float whatever matches the latest screening.
    const score = (a) => (a.topics.some((t) => suggested.includes(t)) ? 0 : 1);
    return [...list].sort((a, b) => score(a) - score(b));
  }, [topic, suggested]);

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6">
      <Reveal>
        <PageHeader
          eyebrow="Reading"
          title="Things worth knowing"
          lede="Short, trustworthy pieces on getting through it — from WHO, NIMH, Mind, the NHS and others."
        />
      </Reveal>

      {suggested.length > 0 && (
        <Reveal>
          <p className="text-sm text-ink-300">
            Based on your last check-in, the{" "}
            {suggested.map((s, i) => (
              <span key={s}>
                {i > 0 && " and "}
                <button
                  onClick={() => setTopic(s)}
                  className="text-ink-50 underline underline-offset-4 hover:brightness-110"
                >
                  {TOPICS.find((t) => t.id === s)?.label.toLowerCase()}
                </button>
              </span>
            ))}{" "}
            {suggested.length > 1 ? "pieces are" : "piece is"} probably the most relevant place to start.
          </p>
        </Reveal>
      )}

      <Reveal>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition ${
                topic === t.id
                  ? "bg-ink-50 text-ink-950 border-white/60 font-medium"
                  : "border-white/12 bg-white/[0.04] text-ink-200 hover:bg-white/[0.09]"
              }`}
              aria-pressed={topic === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="grid md:grid-cols-2 gap-4">
          {articles.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card glass-hover p-5 group flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-ink-400">{a.source}</p>
                  <h3 className="font-medium text-white mt-1.5 leading-snug">{a.title}</h3>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-ink-400 shrink-0 transition group-hover:text-white group-hover:-translate-y-0.5"
                />
              </div>
              <p className="text-sm text-ink-300 mt-2.5 leading-relaxed flex-1">{a.blurb}</p>
              <p className="text-[11px] text-ink-400 mt-3 flex items-center gap-1.5">
                <Clock size={12} />
                {a.minutes} min read
              </p>
            </a>
          ))}
        </div>
      </Reveal>

      {articles.length === 0 && (
        <Reveal>
          <p className="text-sm text-ink-400">Nothing filed under that yet.</p>
        </Reveal>
      )}

      <Reveal>
        <p className="text-[11px] text-ink-400">
          Every link opens the original publisher. MindScan doesn't reproduce or host their content,
          so what you read is always their current version.
        </p>
      </Reveal>
    </PageTransition>
  );
}
