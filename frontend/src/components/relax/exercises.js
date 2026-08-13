/*
 * Guided stretches, scored from MediaPipe pose landmarks.
 *
 * The sequence targets where stress is physically held — neck, shoulders and a
 * closed-off chest from hunching at a desk — plus one paced breathing block,
 * which is the only item here with direct evidence behind it for acute anxiety.
 *
 * Each exercise exposes a `measure(lm)` returning 0..1 progress toward the
 * target position. Reps count on a hysteresis crossing (rise above `hi`, then
 * fall below `lo`) so a single hold cannot rack up dozens of reps from jitter.
 *
 * Landmark indices follow MediaPipe Pose (33 points).
 */

export const L = {
  NOSE: 0,
  L_EAR: 7,
  R_EAR: 8,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Shoulder width normalises every measurement for distance from the camera. */
function scale(lm) {
  return Math.max(1e-6, dist(lm[L.L_SHOULDER], lm[L.R_SHOULDER]));
}

export const EXERCISES = [
  {
    id: "neck",
    name: "Neck release",
    cue: "Tilt your head slowly toward one shoulder, hold, then the other.",
    why: "Tension headaches and jaw clenching usually show up here first.",
    target: 6,
    hi: 0.68,
    lo: 0.32,
    measure(lm) {
      // Sideways head lean: horizontal offset of the nose from shoulder centre.
      const c = mid(lm[L.L_SHOULDER], lm[L.R_SHOULDER]);
      const lean = Math.abs(lm[L.NOSE].x - c.x) / scale(lm);
      return clamp01(lean / 0.34);
    },
  },
  {
    id: "shrug",
    name: "Shoulder rolls",
    cue: "Lift both shoulders up toward your ears, then let them drop.",
    why: "Shoulders creep up under stress and often stay there for hours.",
    target: 8,
    hi: 0.6,
    lo: 0.3,
    measure(lm) {
      // Shoulders rising = vertical gap to the ears closing.
      const gapL = lm[L.L_SHOULDER].y - lm[L.L_EAR].y;
      const gapR = lm[L.R_SHOULDER].y - lm[L.R_EAR].y;
      const gap = (gapL + gapR) / 2 / scale(lm);
      // ~0.85 relaxed, ~0.55 shrugged.
      return clamp01((0.85 - gap) / 0.3);
    },
  },
  {
    id: "openchest",
    name: "Chest opener",
    cue: "Raise both arms out and back, opening across your chest.",
    why: "Counters the closed, hunched posture of a long day at a screen.",
    target: 6,
    hi: 0.62,
    lo: 0.3,
    measure(lm) {
      // Wrists rising above shoulder line and spreading wide.
      const sc = scale(lm);
      const sh = mid(lm[L.L_SHOULDER], lm[L.R_SHOULDER]);
      const lift = ((sh.y - lm[L.L_WRIST].y) + (sh.y - lm[L.R_WRIST].y)) / 2 / sc;
      const spread = dist(lm[L.L_WRIST], lm[L.R_WRIST]) / sc;
      return clamp01((clamp01(lift / 0.55) * 0.6) + (clamp01((spread - 1.1) / 1.4) * 0.4));
    },
  },
  {
    id: "reach",
    name: "Overhead reach",
    cue: "Reach both hands straight up, lengthen, then lower slowly.",
    why: "Opens the ribcage so a full breath is physically easier to take.",
    target: 5,
    hi: 0.7,
    lo: 0.34,
    measure(lm) {
      const sc = scale(lm);
      const sh = mid(lm[L.L_SHOULDER], lm[L.R_SHOULDER]);
      const lift = ((sh.y - lm[L.L_WRIST].y) + (sh.y - lm[L.R_WRIST].y)) / 2 / sc;
      return clamp01(lift / 0.95);
    },
  },
  {
    id: "breathe",
    name: "Paced breathing",
    cue: "Follow the ring: in for four, hold four, out for six. Stay still.",
    why: "A longer exhale than inhale is the part that actually settles the nervous system.",
    target: 6,
    paced: true, // driven by a timer, not by pose
    hi: 0.9,
    lo: 0.1,
    measure() {
      return 0;
    },
  },
];

/**
 * Rep counter with hysteresis: a rep lands only after crossing high and
 * returning below low, so small tremors near a threshold cannot inflate it.
 */
export function createRepCounter(hi, lo) {
  let armed = false;
  return {
    update(progress) {
      if (!armed && progress >= hi) {
        armed = true;
        return false;
      }
      if (armed && progress <= lo) {
        armed = false;
        return true; // completed rep
      }
      return false;
    },
    reset() {
      armed = false;
    },
  };
}

/** Breathing phase from elapsed seconds: 4s in, 4s hold, 6s out. */
export function breathPhase(elapsedMs) {
  const cycle = 14000;
  const t = elapsedMs % cycle;
  if (t < 4000) return { label: "Breathe in", progress: t / 4000, phase: "in", cycleIndex: Math.floor(elapsedMs / cycle) };
  if (t < 8000) return { label: "Hold", progress: 1, phase: "hold", cycleIndex: Math.floor(elapsedMs / cycle) };
  return { label: "Breathe out", progress: 1 - (t - 8000) / 6000, phase: "out", cycleIndex: Math.floor(elapsedMs / cycle) };
}
