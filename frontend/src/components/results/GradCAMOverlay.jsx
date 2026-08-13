export default function GradCAMOverlay({ b64, focus }) {
  if (!b64) return <p className="text-sm text-slate-500">No facial heatmap — capture a still to enable Grad-CAM.</p>;
  return (
    <div>
      <img src={`data:image/png;base64,${b64}`} alt="Grad-CAM overlay" className="rounded-2xl w-full max-w-xs" />
      <p className="text-sm text-slate-600 mt-2">{focus}</p>
    </div>
  );
}
