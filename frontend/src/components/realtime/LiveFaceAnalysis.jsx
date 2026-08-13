import { useEffect, useRef } from "react";
import { useWebcam } from "../../hooks/useWebcam";
import EmotionMeter from "./EmotionMeter";

export default function LiveFaceAnalysis({ onEmotions }) {
  const { videoRef, start, ready } = useWebcam();
  const timer = useRef(null);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (!ready) return;
    timer.current = setInterval(() => {
      const keys = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"];
      const raw = keys.map(() => Math.random());
      const sum = raw.reduce((a, b) => a + b, 0);
      const emotions = Object.fromEntries(keys.map((k, i) => [k, raw[i] / sum]));
      onEmotions?.(emotions);
    }, 400);
    return () => clearInterval(timer.current);
  }, [ready, onEmotions]);

  return (
    <div className="space-y-3">
      <video ref={videoRef} playsInline muted className="w-full rounded-2xl bg-navy aspect-video object-cover" />
      <p className="text-xs text-slate-500">
        Client-side affect proxy for the demo. Drop MediaPipe / face-api.js in this component for on-device landmarks.
      </p>
    </div>
  );
}

export { EmotionMeter };
