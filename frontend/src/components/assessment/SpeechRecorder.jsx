import { useDispatch } from "react-redux";
import { setSpeechBlob, setSpeechFilename } from "../../store/assessmentSlice";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { useEffect } from "react";
import SpeechWaveform from "../realtime/SpeechWaveform";

export default function SpeechRecorder() {
  const { recording, blob, error, start, stop } = useAudioRecorder();
  const dispatch = useDispatch();

  useEffect(() => {
    if (blob) dispatch(setSpeechBlob(blob));
  }, [blob, dispatch]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch(setSpeechBlob(file));
    dispatch(setSpeechFilename(file.name));
  };

  return (
    <div className="space-y-4">
      <SpeechWaveform active={recording} />
      <p className="text-sm text-neutral-500">
        Record speech, or upload a RAVDESS clip named like <code className="text-neutral-700">03-01-06-01-02-01-12.wav</code> so
        emotion/intensity/actor metadata is parsed.
      </p>
      {error && <p className="text-sm text-rose">{error}</p>}
      <button
        onClick={recording ? stop : start}
        className={`btn-drop w-full ${recording ? "bg-neutral-700 text-white" : "btn-drop-solid"}`}
      >
        {recording ? "Stop recording" : blob ? "Record again" : "Start recording"}
      </button>
      <label className="block text-xs text-neutral-400">
        Upload RAVDESS .wav
        <input type="file" accept="audio/*" onChange={onFile} className="mt-1 block w-full text-neutral-600" />
      </label>
    </div>
  );
}
