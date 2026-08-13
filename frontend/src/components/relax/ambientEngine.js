/*
 * Procedural ambient sound, synthesised in the browser.
 *
 * Deliberately generated rather than shipped as audio files: no licensing
 * question, nothing to download, and it never loops audibly because no two
 * minutes are ever identical. Each preset is a small arrangement of Web Audio
 * nodes — a chord pad, filtered noise for texture, and a sparse melodic voice.
 *
 * The musical choices are the conventional ones for calming audio: slow
 * tempos, low-passed high end (the "lofi" character), gentle detuning so
 * nothing sounds clinical, and pentatonic note pools so randomly chosen notes
 * cannot land on a dissonant interval.
 */

const PENTATONIC = [0, 2, 4, 7, 9]; // scale degrees that never clash
const A4 = 440;

function midiToFreq(m) {
  return A4 * Math.pow(2, (m - 69) / 12);
}

export const PRESETS = [
  {
    id: "rain",
    name: "Rain on glass",
    blurb: "Steady rainfall and a low pad. Good for shutting out a noisy room.",
    root: 48,
    noise: { level: 0.055, lp: 1400, tilt: 0.6 },
    pad: { level: 0.09, cutoff: 620, detune: 6 },
    voice: { level: 0.05, rateMs: 5200, octave: 2 },
  },
  {
    id: "dusk",
    name: "Dusk tape",
    blurb: "Warm, slightly worn chords. The classic lofi feel.",
    root: 45,
    noise: { level: 0.03, lp: 900, tilt: 0.35 },
    pad: { level: 0.12, cutoff: 520, detune: 11 },
    voice: { level: 0.07, rateMs: 3400, octave: 2 },
  },
  {
    id: "deepwork",
    name: "Deep work",
    blurb: "Minimal and even, with little to grab your attention.",
    root: 43,
    noise: { level: 0.022, lp: 700, tilt: 0.25 },
    pad: { level: 0.1, cutoff: 460, detune: 4 },
    voice: { level: 0.028, rateMs: 7000, octave: 3 },
  },
  {
    id: "drift",
    name: "Drift",
    blurb: "Long, slow swells. Built for winding down rather than focusing.",
    root: 41,
    noise: { level: 0.035, lp: 1100, tilt: 0.5 },
    pad: { level: 0.13, cutoff: 380, detune: 14 },
    voice: { level: 0.045, rateMs: 8200, octave: 2 },
  },
  {
    id: "morning",
    name: "Slow morning",
    blurb: "Brighter and a little more open. Eases you into the day.",
    root: 50,
    noise: { level: 0.028, lp: 1800, tilt: 0.7 },
    pad: { level: 0.095, cutoff: 780, detune: 8 },
    voice: { level: 0.06, rateMs: 4200, octave: 2 },
  },
  {
    id: "grounding",
    name: "Grounding hum",
    blurb: "A low sustained drone. Pairs well with the breathing exercise.",
    root: 36,
    noise: { level: 0.02, lp: 520, tilt: 0.2 },
    pad: { level: 0.15, cutoff: 300, detune: 3 },
    voice: { level: 0, rateMs: 0, octave: 0 },
  },
];

/** Pink-ish noise buffer: softer than white, closer to rain or room tone. */
function makeNoiseBuffer(ctx, tilt) {
  const seconds = 4;
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    // One-pole low-pass tilts the spectrum toward the low end.
    last = (last * tilt + white * (1 - tilt)) * 1.02;
    data[i] = last;
  }
  return buf;
}

export function createAmbientEngine() {
  let ctx = null;
  let master = null;
  let nodes = [];
  let voiceTimer = null;
  let lfoRaf = 0;

  const stopAll = () => {
    if (voiceTimer) clearInterval(voiceTimer);
    voiceTimer = null;
    cancelAnimationFrame(lfoRaf);
    nodes.forEach((n) => {
      try {
        n.stop?.();
        n.disconnect?.();
      } catch {
        /* already torn down */
      }
    });
    nodes = [];
  };

  return {
    get context() {
      return ctx;
    },

    async play(preset, volume = 0.7) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!ctx) {
        ctx = new AudioCtx();
        master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
      }
      // Browsers start contexts suspended until a user gesture.
      if (ctx.state === "suspended") await ctx.resume();

      stopAll();

      const now = ctx.currentTime;
      const p = preset;

      // --- pad: a detuned triad, low-passed into a soft bed -------------
      const padGain = ctx.createGain();
      padGain.gain.value = p.pad.level;
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = "lowpass";
      padFilter.frequency.value = p.pad.cutoff;
      padFilter.Q.value = 0.7;
      padGain.connect(padFilter).connect(master);

      [0, 7, 12, 16].forEach((interval, i) => {
        const osc = ctx.createOscillator();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.frequency.value = midiToFreq(p.root + interval);
        osc.detune.value = (i - 1.5) * p.pad.detune;
        const g = ctx.createGain();
        g.gain.value = 1 / 4;
        osc.connect(g).connect(padGain);
        osc.start(now);
        nodes.push(osc, g);
      });
      nodes.push(padGain, padFilter);

      // --- texture: filtered noise for rain / tape hiss -----------------
      if (p.noise.level > 0) {
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuffer(ctx, p.noise.tilt);
        src.loop = true;
        const nf = ctx.createBiquadFilter();
        nf.type = "lowpass";
        nf.frequency.value = p.noise.lp;
        const ng = ctx.createGain();
        ng.gain.value = p.noise.level;
        src.connect(nf).connect(ng).connect(master);
        src.start(now);
        nodes.push(src, nf, ng);
      }

      // --- voice: sparse pentatonic notes, so it never sounds random ----
      if (p.voice.level > 0 && p.voice.rateMs > 0) {
        const pluck = () => {
          if (!ctx || ctx.state !== "running") return;
          const t = ctx.currentTime;
          const deg = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
          const note = p.root + 12 * p.voice.octave + deg;
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = midiToFreq(note);
          const g = ctx.createGain();
          // Long, soft envelope — a bell rather than a stab.
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(p.voice.level, t + 0.35);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
          osc.connect(g).connect(master);
          osc.start(t);
          osc.stop(t + 3.6);
        };
        // Jitter the interval so the pattern never becomes predictable.
        voiceTimer = setInterval(() => {
          if (Math.random() < 0.75) pluck();
        }, p.voice.rateMs);
        setTimeout(pluck, 900);
      }

      // --- slow breathing swell on the pad ------------------------------
      const start = performance.now();
      const swell = () => {
        lfoRaf = requestAnimationFrame(swell);
        if (!ctx || ctx.state !== "running") return;
        const secs = (performance.now() - start) / 1000;
        // ~11s period: close to a relaxed breath cycle.
        const depth = 0.18;
        padFilter.frequency.value = p.pad.cutoff * (1 + depth * Math.sin(secs * (Math.PI * 2) / 11));
      };
      lfoRaf = requestAnimationFrame(swell);

      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(volume, now + 2.2);
    },

    setVolume(v) {
      if (!ctx || !master) return;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(v, now + 0.15);
    },

    async stop() {
      if (!ctx || !master) return;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 1.1);
      await new Promise((r) => setTimeout(r, 1150));
      stopAll();
    },

    dispose() {
      stopAll();
      try {
        ctx?.close();
      } catch {
        /* already closed */
      }
      ctx = null;
      master = null;
    },
  };
}
