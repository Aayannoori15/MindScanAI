export default function LoadingPulse({ label = "Running multimodal inference…" }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/60">
      <span className="h-3 w-3 rounded-full bg-teal animate-ping" />
      {label}
    </div>
  );
}
