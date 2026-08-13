import { useCallback, useEffect, useRef, useState } from "react";

// Must match backend.core.preprocessors.speech_preprocessor's assumed sample
// rate -- the backend reads raw bytes as headerless 16-bit PCM, it doesn't
// parse a container/sample-rate from the file.
const SAMPLE_RATE = 16000;

function floatTo16BitPCM(floatSamples) {
  const buffer = new ArrayBuffer(floatSamples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < floatSamples.length; i++) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function describeError(e) {
  if (e.name === "NotReadableError" || e.name === "TrackStartError") {
    return "Microphone is in use by another app or browser tab. Close it, then try again.";
  }
  if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
    return "Microphone permission was denied.";
  }
  if (e.name === "NotFoundError") {
    return "No microphone was found.";
  }
  return e.message || "Could not access the microphone.";
}

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const [error, setError] = useState(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const silenceRef = useRef(null);
  const chunksRef = useRef([]);
  const startingRef = useRef(false);

  const start = useCallback(async () => {
    if (startingRef.current || streamRef.current) return;
    startingRef.current = true;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Requesting sampleRate here asks the browser to resample from the mic's
      // native rate (commonly 44100/48000) down to 16kHz, matching what the
      // model was trained on -- captured raw, not round-tripped through a lossy
      // codec like MediaRecorder's default WebM/Opus.
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: SAMPLE_RATE });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // ScriptProcessorNode is deprecated in favor of AudioWorklet, but remains
      // broadly supported and needs no separate worklet-module file -- the
      // pragmatic choice for a single-file recorder.
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      chunksRef.current = [];
      processor.onaudioprocess = (e) => {
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      // A ScriptProcessorNode only fires onaudioprocess while connected through
      // to the destination; route through a silent gain so recording doesn't
      // also play the mic back out loud.
      const silence = audioCtx.createGain();
      silence.gain.value = 0;
      silenceRef.current = silence;
      source.connect(processor);
      processor.connect(silence);
      silence.connect(audioCtx.destination);

      setRecording(true);
    } catch (e) {
      streamRef.current = null;
      setError(describeError(e));
    } finally {
      startingRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    if (!streamRef.current) return;
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    silenceRef.current?.disconnect();
    streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const totalLength = chunksRef.current.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunksRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    chunksRef.current = [];

    setBlob(new Blob([floatTo16BitPCM(merged)], { type: "audio/raw" }));
    audioCtxRef.current?.close();
    setRecording(false);
  }, []);

  // Release the mic/audio graph on unmount (e.g. navigating away mid-recording)
  // without touching state on an unmounting component.
  useEffect(
    () => () => {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      silenceRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    },
    []
  );

  return { recording, blob, error, start, stop, setBlob };
}
