export const STATUS_COLORS = {
  Healthy: "#00BFA6",
  Mild: "#38bdf8",
  Mild_Stress: "#38bdf8",
  Moderate: "#F59E0B",
  Moderate_Stress: "#F59E0B",
  Severe: "#FB7185",
  Severe_Stress: "#FB7185",
};

export function statusColor(label) {
  return STATUS_COLORS[label] || "#64748b";
}

export function statusDisplay(label) {
  return (label || "").replaceAll("_", " ");
}
