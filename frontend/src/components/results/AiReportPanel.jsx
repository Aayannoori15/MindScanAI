import { Quote, Sparkles, MessageSquareText, ListChecks, HeartHandshake } from "lucide-react";

function Unavailable({ title, reason }) {
  return (
    <div className="glass-card p-5">
      <p className="text-sm font-medium text-ink-200">{title}</p>
      <p className="text-xs text-ink-400 mt-1.5">{reason}</p>
    </div>
  );
}

/**
 * The language layer: what the person actually said, and an LLM reading of it
 * alongside the face/voice model output. Kept visually distinct from the
 * measured panels so a generated narrative is never mistaken for a measurement.
 */
export default function AiReportPanel({ transcript, report }) {
  if (!transcript && !report) return null;

  return (
    <section className="space-y-4">
      <div>
        <p className="eyebrow">In your own words</p>
        <div className="rule-teal w-16 mt-1.5 mb-2" />
        <p className="text-sm text-ink-300">
          Speech is transcribed, then read for content — separately from how your voice sounded.
        </p>
      </div>

      {transcript?.available ? (
        <figure className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Quote size={15} className="text-ink-300" />
            <span className="text-sm font-medium text-white">Transcript</span>
            <span className="text-xs text-ink-400">
              · {transcript.word_count} words · {transcript.duration_seconds}s
            </span>
          </div>
          <blockquote className="text-ink-100 leading-relaxed border-l-2 border-white/20 pl-4 italic">
            “{transcript.text}”
          </blockquote>
          <figcaption className="text-[11px] text-ink-400 mt-3">
            Transcribed by {transcript.model}
          </figcaption>
        </figure>
      ) : (
        <Unavailable title="Transcript" reason={transcript?.reason || "No audio submitted."} />
      )}

      {report?.available ? (
        <div className="glass-card p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-ink-300" />
            <span className="text-sm font-medium text-white">AI reading</span>
            <span className="text-xs text-ink-400">· generated, not measured</span>
          </div>

          {report.day_summary && (
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-1.5">Your day</p>
              <p className="text-ink-100 leading-relaxed">{report.day_summary}</p>
            </div>
          )}

          {!!report.language_signals?.length && (
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-2 flex items-center gap-1.5">
                <MessageSquareText size={13} /> Signals in your words
              </p>
              <ul className="flex flex-wrap gap-2">
                {report.language_signals.map((s) => (
                  <li
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-ink-200"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.mood_reading && (
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-1.5">
                Words vs. face &amp; voice
              </p>
              <p className="text-ink-100 leading-relaxed">{report.mood_reading}</p>
            </div>
          )}

          {!!report.recommendations?.length && (
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-2 flex items-center gap-1.5">
                <ListChecks size={13} /> Suggested next steps
              </p>
              <ul className="space-y-1.5">
                {report.recommendations.map((r) => (
                  <li key={r} className="text-sm text-ink-200 flex gap-2.5">
                    <span className="text-ink-400 select-none">—</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.motivation && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-1.5 flex items-center gap-1.5">
                <HeartHandshake size={13} /> A note for you
              </p>
              <p className="text-ink-50 leading-relaxed">{report.motivation}</p>
            </div>
          )}

          <p className="text-[11px] text-ink-400 border-t border-white/10 pt-3">
            {report.disclaimer} Written by {report.model}.
          </p>
        </div>
      ) : (
        <Unavailable title="AI reading" reason={report?.reason || "Not generated for this session."} />
      )}
    </section>
  );
}
