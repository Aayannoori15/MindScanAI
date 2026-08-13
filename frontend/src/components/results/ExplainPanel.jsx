export default function ExplainPanel({ explanation }) {
  if (!explanation) return null;
  const clinical = explanation.level3_clinical || [];
  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <p className="eyebrow">Level 1 · Plain English</p>
        <p className="mt-2 leading-relaxed text-white/85">{explanation.level1_plain_english}</p>
      </section>
      <section className="glass-card p-5 overflow-x-auto">
        <p className="eyebrow mb-3">Level 3 · Clinical table</p>
        <table className="w-full text-sm text-white/80">
          <thead>
            <tr className="text-left text-white/40">
              <th className="pb-2">Feature</th>
              <th>Value</th>
              <th>Contribution</th>
              <th>Direction</th>
            </tr>
          </thead>
          <tbody>
            {clinical.slice(0, 12).map((r) => (
              <tr key={r.feature} className="border-t border-white/10">
                <td className="py-2">{r.feature}</td>
                <td>{r.value}</td>
                <td>{r.contribution}</td>
                <td className="text-white/50">{r.direction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-white/40">{explanation.disclaimer}</p>
    </div>
  );
}
