import { statusColor, statusDisplay } from "../../utils/colorMapper";

export default function StatusBadge({ label }) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
      style={{ background: statusColor(label) }}
    >
      {statusDisplay(label)}
    </span>
  );
}
