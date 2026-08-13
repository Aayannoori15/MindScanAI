export default function CrisisAlert({ crisis, onClose }) {
  if (!crisis?.flagged) return null;
  return (
    <div className="fixed inset-0 bg-navy/40 z-50 grid place-items-center p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-xl">
        <h2 className="font-display text-2xl">You are not alone in this</h2>
        <p className="text-slate-600 mt-3">{crisis.message}</p>
        <ul className="mt-4 space-y-3">
          {(crisis.resources || []).map((r) => (
            <li key={r.phone} className="border border-slate-100 rounded-xl p-3">
              <p className="font-medium">{r.name}</p>
              <p className="text-teal">{r.phone}</p>
              <p className="text-xs text-slate-500">{r.hours} · {r.note}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 mt-4">{crisis.disclaimer}</p>
        <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-xl bg-navy text-white">
          Continue to results
        </button>
      </div>
    </div>
  );
}
