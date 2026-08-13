/*
 * Severity is encoded as luminance rather than hue.
 *
 * The UI is greyscale to match the hero clip, but severity still has to be
 * perceivable at a glance — a Severe result must not look like a Healthy one.
 * So risk maps onto the hero's own logic: the more severe the state, the more
 * light the element catches. Healthy sits back in the dark; Severe is the lit
 * edge of the ring.
 *
 * Colour is never the only signal — every status also carries its text label,
 * and STATUS_WEIGHT drives border/ring emphasis — so this stays legible for
 * colour-blind users and in greyscale print.
 */
export const STATUS_COLORS = {
  Healthy: "#4a4a4a",
  Mild: "#7d7d7d",
  Mild_Stress: "#7d7d7d",
  Moderate: "#b0b0b0",
  Moderate_Stress: "#b0b0b0",
  Severe: "#f4f4f5",
  Severe_Stress: "#f4f4f5",
};

/** Foreground that stays readable on the matching STATUS_COLORS swatch. */
export const STATUS_FOREGROUND = {
  Healthy: "#f4f4f5",
  Mild: "#f4f4f5",
  Mild_Stress: "#f4f4f5",
  Moderate: "#0a0a0a",
  Moderate_Stress: "#0a0a0a",
  Severe: "#0a0a0a",
  Severe_Stress: "#0a0a0a",
};

/** 0..1 emphasis, for ring/glow intensity so severity reads beyond fill alone. */
export const STATUS_WEIGHT = {
  Healthy: 0,
  Mild: 0.34,
  Mild_Stress: 0.34,
  Moderate: 0.67,
  Moderate_Stress: 0.67,
  Severe: 1,
  Severe_Stress: 1,
};

export function statusColor(label) {
  return STATUS_COLORS[label] || "#4a4a4a";
}

export function statusForeground(label) {
  return STATUS_FOREGROUND[label] || "#f4f4f5";
}

export function statusWeight(label) {
  return STATUS_WEIGHT[label] ?? 0;
}

export function statusDisplay(label) {
  return (label || "").replaceAll("_", " ");
}
