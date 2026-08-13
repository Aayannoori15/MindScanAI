import { useCallback, useEffect, useRef, useState } from "react";

function describeError(e) {
  if (e.name === "NotReadableError" || e.name === "TrackStartError") {
    return "Camera is in use by another app or browser tab. Close it, then try again.";
  }
  if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
    return "Camera permission was denied.";
  }
  if (e.name === "NotFoundError") {
    return "No camera was found.";
  }
  return e.message || "Could not access the camera.";
}

export function useWebcam() {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const startingRef = useRef(false);

  const start = useCallback(async () => {
    // Guards against StrictMode's double-invoked effect (and any other duplicate
    // call) re-acquiring the camera while the first play() is still pending --
    // that race aborts the first play() with a benign but scary-looking error.
    if (startingRef.current || streamRef.current) return;
    startingRef.current = true;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          if (playErr.name !== "AbortError") throw playErr;
        }
      }
      setReady(true);
    } catch (e) {
      streamRef.current = null;
      setError(describeError(e));
    } finally {
      startingRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  /**
   * Captures the frame at its native resolution, preserving aspect ratio.
   *
   * Deliberately does NOT downscale to the model's 48x48 input here: the
   * server runs face detection and crops to the face first, and it needs real
   * pixels to do that. Squashing the whole frame to 48x48 client-side (the
   * previous behaviour) destroyed the aspect ratio and shrank the face to a
   * few pixels, which was enough to make a smiling face read as "fear".
   */
  const captureBlob = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return null;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (!w || !h) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92));
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, ready, error, start, stop, captureBlob };
}
