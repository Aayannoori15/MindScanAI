import { useState } from "react";
import { AudioWaveform, PersonStanding } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import PageTransition, { Reveal } from "../components/layout/PageTransition";
import SoundRoom from "../components/relax/SoundRoom";
import PoseCoach from "../components/relax/PoseCoach";

const TABS = [
  {
    id: "sound",
    label: "Sound room",
    icon: AudioWaveform,
    blurb: "Six soundscapes, synthesised live in your browser. Nothing streams, nothing repeats.",
  },
  {
    id: "move",
    label: "Movement coach",
    icon: PersonStanding,
    blurb:
      "Your camera tracks your posture and counts reps through a short sequence for the places stress physically collects.",
  },
];

export default function RelaxHub() {
  const [tab, setTab] = useState("sound");
  const activeTab = TABS.find((t) => t.id === tab);

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6">
      <Reveal>
        <PageHeader
          eyebrow="Relax hub"
          title="Somewhere to put it down"
          lede="Screening tells you where you are. This is for actually doing something about it — listen, or move."
        />
      </Reveal>

      <Reveal>
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={tab === id ? "drop-btn drop-btn-solid" : "drop-btn drop-btn-quiet"}
              aria-pressed={tab === id}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-300 mt-3 max-w-2xl leading-relaxed">{activeTab.blurb}</p>
      </Reveal>

      <Reveal>{tab === "sound" ? <SoundRoom /> : <PoseCoach />}</Reveal>

      <Reveal>
        <p className="text-[11px] text-ink-400">
          Everything here runs on your device. The camera feed used for movement tracking is never
          uploaded or recorded.
        </p>
      </Reveal>
    </PageTransition>
  );
}
