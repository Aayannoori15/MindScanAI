const STEPS = ["Modalities", "Signals", "Review"];

export default function ProgressStepper({ step }) {
  return (
    <ol className="flex gap-3 mb-8">
      {STEPS.map((label, i) => (
        <li key={label} className="flex-1">
          <div className={`h-1.5 rounded-full ${i <= step ? "bg-teal" : "bg-white/10"}`} />
          <p className={`mt-2 text-xs ${i === step ? "text-white font-medium" : "text-white/35"}`}>{label}</p>
        </li>
      ))}
    </ol>
  );
}
