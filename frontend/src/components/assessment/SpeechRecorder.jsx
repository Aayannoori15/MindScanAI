import { useDispatch } from "react-redux";
import { setSpeechBlob, setSpeechFilename } from "../../store/assessmentSlice";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { useEffect } from "react";
import SpeechWaveform from "../realtime/SpeechWaveform";

export default function SpeechRecorder() {
  const { recording, blob, start, stop } = useAudioRecorder();
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
      <p className="text-sm text-slate-600">
        Record speech, or upload a RAVDESS clip named like <code>03-01-06-01-02-01-12.wav</code> so emotion/intensity/actor
        metadata is parsed.
      </p>
      <button
        onClick={recording ? stop : start}
        className={`w-full py-2.5 rounded-xl font-medium ${recording ? "bg-rose text-white" : "bg-navy text-white"}`}
      >
        {recording ? "Stop recording" : blob ? "Record again" : "Start recording"}
      </button>
      <label className="block text-xs text-slate-500">
        Upload RAVDESS .wav
        <input type="file" accept="audio/*" onChange={onFile} className="mt-1 block w-full" />
      </label>
    </div>
  );
}
