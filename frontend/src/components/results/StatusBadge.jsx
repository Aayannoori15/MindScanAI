import { statusColor, statusDisplay, statusForeground, statusWeight } from "../../utils/colorMapper";

/**
 * Severity reads through luminance plus a glow whose intensity scales with
 * risk, so a Severe result is unmistakable in a greyscale UI without relying
 * on hue (which colour-blind users and greyscale print would lose).
 */
export default function StatusBadge({ label }) {
  const bg = statusColor(label);
  const fg = statusForeground(label);
  const w = statusWeight(label);

  return (
    <span
      className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium tracking-wide"
      style={{
        background: bg,
        color: fg,
        boxShadow: w > 0 ? `0 0 ${10 + w * 26}px ${-2 + w * 2}px rgba(244,244,245,${0.12 + w * 0.4})` : "none",
      }}
    >
      {statusDisplay(label)}
    </span>
  );
}
