export default function LoadingPulse({ label = "Running multimodal inference…" }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-300">
      <span className="h-3 w-3 rounded-full bg-ink-50 animate-ping" />
      {label}
    </div>
  );
}
