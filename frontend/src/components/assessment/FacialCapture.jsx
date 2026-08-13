import { useDispatch, useSelector } from "react-redux";
import { addEmotionPoint, setFaceBlob, setFacialLabelHint } from "../../store/assessmentSlice";
import { useWebcam } from "../../hooks/useWebcam";
import { analyzeFace } from "../../api/assessmentApi";
import { useEffect, useRef, useState } from "react";

export default function FacialCapture() {
  const { videoRef, ready, error, start, captureBlob } = useWebcam();
  const dispatch = useDispatch();
  const saved = useSelector((s) => s.assessment.faceBlob);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [live, setLive] = useState(null);
  const inFlight = useRef(false);

  useEffect(() => {
    start();
  }, [start]);

  // Sample the webcam and run each frame through the real trained FER
  // classifier server-side, building the session's emotion timeline from
  // actual predictions.
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
        if (cancelled || !res.available) return;
        setLive(res);
        dispatch(addEmotionPoint({ t: Date.now() / 1000, emotions: res.emotions }));
      } catch {
        /* transient frame failure - keep sampling */
      } finally {
        inFlight.current = false;
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ready, dispatch, captureBlob]);

  // Revoke the previous preview URL whenever it changes/unmounts, so captures don't leak object URLs.
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const setPreview = (blob) => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
  };

  const snap = async () => {
    const blob = await captureBlob();
    if (!blob) return;
    dispatch(setFaceBlob(blob));
    setPreview(blob);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch(setFaceBlob(file));
    dispatch(setFacialLabelHint(file.name));
    setPreview(file);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <video ref={videoRef} playsInline muted className="w-full rounded-2xl glass-inset aspect-square object-cover" />
        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/30 text-xs text-white/60">
            Starting camera…
          </div>
        )}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Captured still"
            className="absolute bottom-2 right-2 h-14 w-14 rounded-lg border-2 border-teal object-cover shadow-lg"
          />
        )}
        {live && (
          <div className="absolute top-2 left-2 rounded-lg bg-black/60 backdrop-blur px-2.5 py-1.5 text-xs">
            <span className="text-teal capitalize font-medium">{live.dominant}</span>
            <span className="text-white/60"> · {Math.round(live.confidence * 100)}%</span>
          </div>
        )}
      </div>
      {error && (
        <div className="text-sm text-rose space-y-2">
          <p>{error}</p>
          <p className="text-neutral-400">You can continue without a face frame, or</p>
          <button onClick={start} className="btn-drop btn-drop-light py-1.5 px-4 text-xs">
            Try again
          </button>
        </div>
      )}
      <button onClick={snap} disabled={!ready} className="w-full btn-drop btn-drop-solid disabled:opacity-40">
        {saved ? "Retake still" : "Capture 48×48 grayscale still"}
      </button>
      <label className="block text-xs text-neutral-400">
        Upload FER image (include the class in the filename: angry, fear, happy…)
        <input type="file" accept="image/*" onChange={onFile} className="mt-1 block w-full text-neutral-600" />
      </label>
    </div>
  );
}
