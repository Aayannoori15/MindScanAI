export default function ExplainPanel({ explanation }) {
  if (!explanation) return null;
  const clinical = explanation.level3_clinical || [];
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-5 border border-slate-100">
        <p className="text-xs uppercase tracking-wide text-teal font-medium">Level 1 · Plain English</p>
        <p className="mt-2 leading-relaxed">{explanation.level1_plain_english}</p>
      </section>
      <section className="bg-white rounded-2xl p-5 border border-slate-100 overflow-x-auto">
        <p className="text-xs uppercase tracking-wide text-teal font-medium mb-3">Level 3 · Clinical table</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2">Feature</th>
              <th>Value</th>
              <th>Contribution</th>
              <th>Direction</th>
            </tr>
          </thead>
          <tbody>
            {clinical.slice(0, 12).map((r) => (
              <tr key={r.feature} className="border-t border-slate-100">
                <td className="py-2">{r.feature}</td>
                <td>{r.value}</td>
                <td>{r.contribution}</td>
                <td className="text-slate-500">{r.direction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-slate-500">{explanation.disclaimer}</p>
    </div>
  );
}
