import { useCallback, useRef, useState } from "react";

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const recRef = useRef(null);
  const chunks = useRef([]);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    recRef.current = rec;
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = () => {
      setBlob(new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }));
      stream.getTracks().forEach((t) => t.stop());
    };
    rec.start();
    setRecording(true);
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setRecording(false);
  }, []);

  return { recording, blob, start, stop, setBlob };
}
