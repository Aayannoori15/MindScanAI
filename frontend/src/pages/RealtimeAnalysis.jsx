import { useCallback, useState } from "react";
import LiveFaceAnalysis from "../components/realtime/LiveFaceAnalysis";
import EmotionMeter from "../components/realtime/EmotionMeter";
import SpeechWaveform from "../components/realtime/SpeechWaveform";
import { useWebSocket } from "../hooks/useWebSocket";
import PageHeader from "../components/layout/PageHeader";
import PageTransition, { Reveal } from "../components/layout/PageTransition";

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
    <PageTransition className="max-w-4xl mx-auto space-y-6">
      <Reveal>
        <PageHeader
          eyebrow="Real-time"
          title="Live analysis"
          lede="Frames are scored by the trained FER classifier as you move."
        />
      </Reveal>
      <div className="grid md:grid-cols-2 gap-6">
        <Reveal className="space-y-4">
          <LiveFaceAnalysis onEmotions={onEmotions} />
          <SpeechWaveform active />
        </Reveal>
        <Reveal>
          <div className="glass-card p-5 h-full">
            <p className="text-sm font-medium text-white">Emotion probabilities</p>
            {last?.dominant && (
              <p className="eyebrow mt-1 mb-4">dominant · {last.dominant}</p>
            )}
            {Object.keys(shown).length ? (
              <div className={last?.dominant ? "" : "mt-4"}>
                <EmotionMeter emotions={shown} />
              </div>
            ) : (
              <p className="text-sm text-white/35 mt-4">
                Waiting for the first analysed frame…
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </PageTransition>
  );
}
