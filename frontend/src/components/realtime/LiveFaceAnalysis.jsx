import { useEffect, useRef, useState } from "react";
import { useWebcam } from "../../hooks/useWebcam";
import { analyzeFace } from "../../api/assessmentApi";
import EmotionMeter from "./EmotionMeter";

export default function LiveFaceAnalysis({ onEmotions }) {
  const { videoRef, start, ready, error, captureBlob } = useWebcam();
  const [status, setStatus] = useState(null);
  const inFlight = useRef(false);

  useEffect(() => {
    start();
  }, [start]);

  // Each sampled frame is scored by the real trained FER classifier on the
  // server; nothing here is synthesised locally.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const id = setInterval(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const blob = await captureBlob();
        if (!blob || cancelled) return;
        const res = await analyzeFace(blob);
        if (cancelled) return;
        if (res.available) {
          setStatus(null);
          onEmotions?.(res.emotions);
        } else {
          setStatus(res.reason || "Live analysis unavailable.");
        }
      } catch {
        /* transient frame failure - keep sampling */
      } finally {
        inFlight.current = false;
      }
    }, 1200);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ready, onEmotions, captureBlob]);

  return (
    <div className="space-y-3">
      <video ref={videoRef} playsInline muted className="w-full rounded-2xl glass-inset aspect-video object-cover" />
      {error && <p className="text-sm text-rose">{error}</p>}
      {status && <p className="text-xs text-amber">{status}</p>}
      <p className="text-xs text-white/40">
        Frames are scored by the fine-tuned ResNet18 FER classifier (70.3% validation accuracy) on the server.
      </p>
    </div>
  );
}

export { EmotionMeter };
