import { useDispatch, useSelector } from "react-redux";
import { addEmotionPoint, setFaceBlob, setFacialLabelHint } from "../../store/assessmentSlice";
import { useWebcam } from "../../hooks/useWebcam";
import { useEffect } from "react";

export default function FacialCapture() {
  const { videoRef, ready, error, start, captureBlob } = useWebcam();
  const dispatch = useDispatch();
  const saved = useSelector((s) => s.assessment.faceBlob);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(async () => {
      dispatch(
        addEmotionPoint({
          t: Date.now() / 1000,
          emotions: mockEmotions(),
        })
      );
    }, 1200);
    return () => clearInterval(id);
  }, [ready, dispatch]);

  const snap = async () => {
    const blob = await captureBlob();
    dispatch(setFaceBlob(blob));
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch(setFaceBlob(file));
    dispatch(setFacialLabelHint(file.name));
  };

  return (
    <div className="space-y-3">
      <video ref={videoRef} playsInline muted className="w-full rounded-2xl bg-navy aspect-square object-cover" />
      {error && <p className="text-sm text-rose">{error}. You can continue without a face frame.</p>}
      <button onClick={snap} className="w-full py-2.5 rounded-xl bg-teal text-navy font-medium">
        {saved ? "Retake still" : "Capture 48×48 grayscale still"}
      </button>
      <label className="block text-xs text-slate-500">
        Upload FER image (include the class in the filename: angry, fear, happy…)
        <input type="file" accept="image/*" onChange={onFile} className="mt-1 block w-full" />
      </label>
    </div>
  );
}

function mockEmotions() {
  const keys = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"];
  const raw = keys.map(() => Math.random());
  const sum = raw.reduce((a, b) => a + b, 0);
  return Object.fromEntries(keys.map((k, i) => [k, raw[i] / sum]));
}
