const API = "";

export async function runAssessment({
  modalities,
  numerical,
  emotionTimeline,
  languageHint,
  faceBlob,
  speechBlob,
  speechFilename,
  facialLabelHint,
  token,
}) {
  const fd = new FormData();
  fd.append(
    "payload",
    JSON.stringify({
      modalities,
      numerical: modalities.includes("numerical") ? numerical : null,
      emotion_timeline: emotionTimeline,
      language_hint: languageHint,
      speech_filename: speechFilename || undefined,
      facial_label_hint: facialLabelHint || undefined,
    })
  );
  if (faceBlob && modalities.includes("facial")) fd.append("face", faceBlob, facialLabelHint || "face.png");
  if (speechBlob && modalities.includes("speech")) fd.append("speech", speechBlob, speechFilename || "speech.pcm");

  const res = await fetch(`${API}/api/assessment/run`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API}/api/health`);
  return res.json();
}

/** Real FER emotion probabilities for one webcam frame, from the trained model. */
export async function analyzeFace(blob) {
  const fd = new FormData();
  fd.append("frame", blob, "frame.jpg");
  const res = await fetch(`${API}/api/realtime/analyze-face`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("face analysis failed");
  return res.json();
}
