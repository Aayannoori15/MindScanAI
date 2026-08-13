/*
 * Greyscale chart theme.
 *
 * The UI is monochrome to match the hero, but several series on one axis can't
 * be told apart by luminance alone — mid-greys collapse into each other, and
 * on a dark ground the usable range is narrow. So every series carries two
 * independent cues: a distinct luminance *and* a distinct dash pattern. That
 * also happens to be the accessible default, since it survives colour-blind
 * vision and greyscale printing.
 */

/** Ordered so adjacent series never sit at adjacent luminances. */
export const SERIES = [
  { stroke: "#f4f4f5", dash: undefined }, // solid, brightest
  { stroke: "#9a9a9a", dash: "6 4" },
  { stroke: "#d4d4d4", dash: "2 3" },
  { stroke: "#6f6f6f", dash: "10 4" },
  { stroke: "#b8b8b8", dash: "6 3 2 3" },
  { stroke: "#4f4f4f", dash: "1 4" },
];

export function series(i) {
  return SERIES[i % SERIES.length];
}

/** Diverging fills for signed bars: bright = raises burden, dim = lowers it. */
export const DIVERGING = {
  positive: "#e8e8e8",
  negative: "#4a4a4a",
};

export const AXIS_TICK = { fill: "rgba(244,244,245,0.42)", fontSize: 11 };
export const AXIS_TICK_STRONG = { fill: "rgba(244,244,245,0.62)", fontSize: 11 };
export const GRID_STROKE = "rgba(255,255,255,0.08)";

export const TOOLTIP = {
  contentStyle: {
    background: "rgba(10,10,10,0.94)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12,
    backdropFilter: "blur(8px)",
  },
  labelStyle: { color: "#f4f4f5" },
  itemStyle: { color: "#dcdcdc" },
};
