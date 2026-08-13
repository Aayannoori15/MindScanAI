import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useWebcam } from "../../hooks/useWebcam";
import { EXERCISES, breathPhase, createRepCounter } from "./exercises";

// Pairs of landmark indices to draw as the skeleton overlay.
const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [0, 11], [0, 12],
];

export default function PoseCoach() {
  const { videoRef, ready, error, start, captureBlob: _c } = useWebcam();
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const counterRef = useRef(null);
  const rafRef = useRef(0);
  const startedRef = useRef(0);

  const [status, setStatus] = useState("Loading pose model…");
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [reps, setReps] = useState(0);
  const [progress, setProgress] = useState(0);
  const [breath, setBreath] = useState(null);
  const [done, setDone] = useState([]);

  const exercise = EXERCISES[idx];

  useEffect(() => {
    start();
  }, [start]);

  // Load the vendored MediaPipe model. Both the wasm runtime and the .task
  // file are served from /public, so this works with no network access.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
        const fileset = await FilesetResolver.forVisionTasks("/mediapipe-wasm");
        const lm = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task", delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (cancelled) return;
        landmarkerRef.current = lm;
        setStatus("");
      } catch (e) {
        if (!cancelled) setStatus(`Pose model unavailable (${e?.name || "error"}). Exercises still work without tracking.`);
      }
    })();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    counterRef.current = createRepCounter(exercise.hi, exercise.lo);
    setReps(0);
    setProgress(0);
    startedRef.current = performance.now();
  }, [exercise]);

  const loop = useCallback(() => {
    rafRef.current = requestAnimationFrame(loop);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (canvas.width !== w) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    if (exercise.paced) {
      const b = breathPhase(performance.now() - startedRef.current);
      setBreath(b);
      setProgress(b.progress);
      setReps(Math.min(exercise.target, b.cycleIndex));
      return;
    }

    const lmk = landmarkerRef.current;
    if (!lmk) return;

    let result;
    try {
      result = lmk.detectForVideo(video, performance.now());
    } catch {
      return;
    }
    const pts = result?.landmarks?.[0];
    if (!pts) {
      setStatus("Step back so your head and shoulders are in frame.");
      return;
    }
    setStatus("");

    // Skeleton overlay in the monochrome palette.
    ctx.strokeStyle = "rgba(244,244,245,0.75)";
    ctx.lineWidth = Math.max(2, w / 320);
    BONES.forEach(([a, b]) => {
      const p = pts[a];
      const q = pts[b];
      if (!p || !q) return;
      ctx.beginPath();
      ctx.moveTo(p.x * w, p.y * h);
      ctx.lineTo(q.x * w, q.y * h);
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(244,244,245,0.95)";
    pts.slice(0, 25).forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, Math.max(2.5, w / 260), 0, Math.PI * 2);
      ctx.fill();
    });

    let value = 0;
    try {
      value = exercise.measure(pts);
    } catch {
      value = 0;
    }
    setProgress(value);
    if (counterRef.current?.update(value)) {
      setReps((r) => Math.min(exercise.target, r + 1));
    }
  }, [exercise, videoRef]);

  useEffect(() => {
    if (!active || !ready) return;
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, ready, loop]);

  // Advance when the target is met.
  useEffect(() => {
    if (!active || reps < exercise.target) return;
    setDone((d) => (d.includes(exercise.id) ? d : [...d, exercise.id]));
    const t = setTimeout(() => {
      if (idx < EXERCISES.length - 1) setIdx((i) => i + 1);
      else setActive(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [reps, exercise, active, idx]);

  const pct = Math.round(progress * 100);
  const allDone = done.length === EXERCISES.length;

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
      <div className="glass-card p-4">
        <div className="relative rounded-xl overflow-hidden glass-inset">
          <video ref={videoRef} playsInline muted className="w-full aspect-video object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {exercise.paced && active && breath && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div
                className="rounded-full border border-white/50"
                style={{
                  width: `${28 + breath.progress * 34}%`,
                  aspectRatio: "1",
                  transition: "width 120ms linear",
                  boxShadow: "0 0 60px -10px rgba(244,244,245,0.55)",
                }}
              />
              <p className="absolute text-white font-display text-2xl">{breath.label}</p>
            </div>
          )}

          {!ready && !error && (
            <div className="absolute inset-0 grid place-items-center bg-black/40 text-xs text-ink-300">
              Starting camera…
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-ink-50 mt-3">
            {error} You can still follow the cues without tracking.
          </p>
        )}
        {status && <p className="text-xs text-ink-300 mt-3">{status}</p>}
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5">
          <p className="eyebrow">
            Step {idx + 1} of {EXERCISES.length}
          </p>
          <h3 className="font-display text-2xl text-white mt-1.5">{exercise.name}</h3>
          <p className="text-sm text-ink-200 mt-2 leading-relaxed">{exercise.cue}</p>
          <p className="text-xs text-ink-400 mt-2">{exercise.why}</p>

          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-ink-300">{exercise.paced ? "Breath" : "Movement"}</span>
              <span className="text-ink-50 font-semibold tabular-nums">{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/[0.09] overflow-hidden">
              <div
                className="h-full rounded-full bg-ink-50 transition-[width] duration-100"
                style={{ width: `${pct}%`, boxShadow: "0 0 14px -2px rgba(244,244,245,0.55)" }}
              />
            </div>
          </div>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-5xl font-semibold tabular-nums text-white leading-none">{reps}</span>
            <span className="text-sm text-ink-400">
              / {exercise.target} {exercise.paced ? "breaths" : "reps"}
            </span>
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={() => setActive((a) => !a)} className="drop-btn drop-btn-solid flex-1">
              {active ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => {
                counterRef.current?.reset();
                setReps(0);
                startedRef.current = performance.now();
              }}
              className="drop-btn drop-btn-quiet"
              aria-label="Reset reps"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <ol className="glass-card p-4 space-y-1.5">
          {EXERCISES.map((e, i) => (
            <li key={e.id}>
              <button
                onClick={() => setIdx(i)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-left transition ${
                  i === idx ? "bg-white/[0.08] text-white" : "text-ink-300 hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full grid place-items-center shrink-0 ${
                    done.includes(e.id) ? "bg-ink-50 text-ink-950" : "border border-white/25"
                  }`}
                >
                  {done.includes(e.id) && <Check size={11} strokeWidth={3} />}
                </span>
                {e.name}
              </button>
            </li>
          ))}
        </ol>

        {allDone && (
          <div className="glass-card p-5">
            <p className="font-display text-xl text-white">That's the full set.</p>
            <p className="text-sm text-ink-300 mt-1.5">
              Notice how your shoulders and jaw feel now compared to when you started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
