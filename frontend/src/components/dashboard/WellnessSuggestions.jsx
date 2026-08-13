export default function WellnessSuggestions({ wellness }) {
  const tips = wellness?.tips || [];
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {tips.map((t) => (
        <article key={t.id} className="glass-card glass-hover p-5">
          <p className="text-xs text-ink-200 font-medium">{t.minutes} min</p>
          <h3 className="font-medium mt-1 text-white">{t.title}</h3>
          <p className="text-sm text-ink-300 mt-2">{t.body}</p>
        </article>
      ))}
    </div>
  );
}
