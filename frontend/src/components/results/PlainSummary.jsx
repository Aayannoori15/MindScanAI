import { statusWeight } from "../../utils/colorMapper";

const STATUS_SENTENCE = {
  Healthy: "Nothing here stands out as concerning today.",
  Mild_Stress: "You're carrying a bit more than usual, but it's within a manageable range.",
  Moderate_Stress: "There's a noticeable load showing up across several signals.",
  Severe_Stress: "The signals here are heavier than usual, across more than one measure.",
};

/** Plain wording for a score, so nobody has to interpret "19.8 / 34". */
function describe(label, value, max, range) {
  const pct = value / max;
  const level =
    pct >= 0.7 ? "high" : pct >= 0.45 ? "moderate" : pct >= 0.25 ? "mild" : "low";
  const phrasing = {
    Depression: {
      high: "Low mood looks like a strong theme right now.",
      moderate: "There are real signs of low mood.",
      mild: "Some low-mood signals, on the lighter side.",
      low: "Little sign of low mood.",
    },
    Anxiety: {
      high: "Worry and tension look prominent.",
      moderate: "There's a fair amount of tension showing.",
      mild: "Mild tension in the signals.",
      low: "Little sign of anxiety.",
    },
    Stress: {
      high: "You look stretched thin.",
      moderate: "Pressure is clearly showing.",
      mild: "A moderate amount of pressure.",
      low: "Stress looks well managed.",
    },
  };
  return { level, sentence: phrasing[label][level], range };
}

/**
 * The human-readable answer, first and largest. Everything below it on the
 * page is the evidence; this is the part someone should be able to read once
 * and understand without knowing what a z-score or a distress percentage is.
 */
export default function PlainSummary({ status, scores, insights }) {
  const items = [
    { label: "Depression", value: scores.depression, max: 34, range: scores.depression_range },
    { label: "Anxiety", value: scores.anxiety, max: 24, range: scores.anxiety_range },
    { label: "Stress", value: scores.stress, max: 39, range: scores.stress_range },
  ].map((i) => ({ ...i, ...describe(i.label, i.value, i.max, i.range) }));

  const heaviest = [...items].sort((a, b) => b.value / b.max - a.value / a.max)[0];
  const weight = statusWeight(status);

  const face = insights?.facial;
  const voice = insights?.speech;
  const observed = [];
  if (face?.available && face.detected_emotion) {
    observed.push(`your face looked mostly ${face.detected_emotion}`);
  }
  if (voice?.available && voice.detected_status) {
    observed.push(`your voice sounded ${voice.detected_status.replace("_", " ").toLowerCase()}`);
  } else if (voice?.available && voice.transcript_preview) {
    observed.push("your words were transcribed");
  }

  return (
    <div
      className="glass-card p-6 md:p-7"
      style={{
        boxShadow:
          weight > 0
            ? `0 1px 0 0 rgba(255,255,255,0.1) inset, 0 0 ${30 + weight * 40}px -24px rgba(244,244,245,${
                0.25 + weight * 0.45
              })`
            : undefined,
      }}
    >
      <p className="font-display text-2xl md:text-3xl text-white leading-snug">
        {STATUS_SENTENCE[status] || "Here's how today looks."}
      </p>

      {observed.length > 0 && (
        <p className="text-ink-300 mt-3 leading-relaxed">
          While you were checking in, {observed.join(" and ")}.
        </p>
      )}

      <p className="text-ink-200 mt-4 leading-relaxed">
        Of the three things measured, <span className="text-white">{heaviest.label.toLowerCase()}</span> is
        the most raised. {heaviest.sentence}
      </p>

      <ul className="grid sm:grid-cols-3 gap-3 mt-6">
        {items.map((i) => (
          <li key={i.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-400">{i.label}</p>
            <p className="text-ink-50 font-semibold capitalize mt-1 text-xl">{i.level}</p>
            <p className="text-[11px] text-ink-400 mt-1">{i.sentence}</p>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-ink-400 mt-5">
        This is a screening signal, not a diagnosis — it describes today, not you.
      </p>
    </div>
  );
}
