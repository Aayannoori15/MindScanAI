import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { PRESETS, createAmbientEngine } from "./ambientEngine";

/** Twelve bars whose heights follow a slow wave — a calm level meter, not a spectrum. */
function Visualiser({ active }) {
  return (
    <div className="flex items-end gap-1 h-8" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-ink-300"
          style={{
            height: active ? undefined : "20%",
            animation: active ? `sound-bar 2.8s ease-in-out ${i * 0.16}s infinite` : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function SoundRoom() {
  const engine = useMemo(() => createAmbientEngine(), []);
  const [playingId, setPlayingId] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(null);

  useEffect(() => () => engine.dispose(), [engine]);

  useEffect(() => {
    if (!playingId) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [playingId]);

  const toggle = async (preset) => {
    if (playingId === preset.id) {
      await engine.stop();
      setPlayingId(null);
      setElapsed(0);
      return;
    }
    await engine.play(preset, volume);
    startedAt.current = Date.now();
    setElapsed(0);
    setPlayingId(preset.id);
  };

  const onVolume = (v) => {
    setVolume(v);
    engine.setVolume(v);
  };

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const current = PRESETS.find((p) => p.id === playingId);

  return (
    <div className="space-y-5">
      <style>{`@keyframes sound-bar{0%,100%{height:18%}50%{height:100%}}`}</style>

      <div className="glass-card p-5 flex flex-wrap items-center gap-5">
        <button
          onClick={() => toggle(current || PRESETS[0])}
          className="drop-btn drop-btn-solid !px-5"
          aria-label={playingId ? "Pause" : "Play"}
        >
          {playingId ? <Pause size={18} /> : <Play size={18} />}
          {playingId ? "Pause" : "Play"}
        </button>

        <div className="min-w-0">
          <p className="text-white font-medium truncate">
            {current ? current.name : "Nothing playing"}
          </p>
          <p className="text-xs text-ink-400 tabular-nums">
            {playingId ? `${mmss} elapsed` : "Pick a soundscape below"}
          </p>
        </div>

        <Visualiser active={!!playingId} />

        <label className="flex items-center gap-2 ml-auto text-xs text-ink-300">
          <Volume2 size={15} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            className="w-28 accent-white"
            aria-label="Volume"
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRESETS.map((p) => {
          const on = playingId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => toggle(p)}
              className={`glass-card glass-hover p-5 text-left transition ${
                on ? "!border-white/35" : ""
              }`}
              style={on ? { boxShadow: "0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 40px -18px rgba(244,244,245,0.7)" } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-white">{p.name}</h3>
                {on && <span className="text-[10px] uppercase tracking-wider text-ink-50">Playing</span>}
              </div>
              <p className="text-sm text-ink-300 mt-2 leading-relaxed">{p.blurb}</p>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-ink-400">
        Every soundscape is synthesised live in your browser rather than streamed, so nothing loops
        audibly and no audio is downloaded or sent anywhere.
      </p>
    </div>
  );
}
