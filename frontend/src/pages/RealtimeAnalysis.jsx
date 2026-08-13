import { useCallback, useState } from "react";
import LiveFaceAnalysis from "../components/realtime/LiveFaceAnalysis";
import EmotionMeter from "../components/realtime/EmotionMeter";
import SpeechWaveform from "../components/realtime/SpeechWaveform";
import { useWebSocket } from "../hooks/useWebSocket";

export default function RealtimeAnalysis() {
  const [emotions, setEmotions] = useState({});
  const { last, send } = useWebSocket();

  const onEmotions = useCallback(
    (e) => {
      setEmotions(e);
      send({ t: Date.now() / 1000, emotions: e });
    },
    [send]
  );

  const shown = last?.emotions || emotions;

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
      <div>
        <p className="eyebrow mb-1">Real-time</p>
        <h1 className="font-display text-3xl md:text-4xl text-white mb-4">Live analysis</h1>
        <LiveFaceAnalysis onEmotions={onEmotions} />
        <div className="mt-4">
          <SpeechWaveform active />
        </div>
      </div>
      <div className="glass-card p-5">
        <p className="text-sm font-medium mb-4 text-white">
          Emotion probabilities {last?.dominant ? `· ${last.dominant}` : ""}
        </p>
        <EmotionMeter emotions={shown} />
      </div>
    </div>
  );
}
