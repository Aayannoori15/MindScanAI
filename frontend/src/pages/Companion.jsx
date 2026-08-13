import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Phone, Send } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import PageTransition, { Reveal } from "../components/layout/PageTransition";

const OPENERS = [
  "Today was a lot.",
  "I can't switch my brain off.",
  "I'm tired but I can't sleep.",
  "I don't really know what's wrong.",
];

const GREETING =
  "I'm here. Tell me about your day — the whole thing, or just the part that's sitting heaviest. No need to make it tidy.";

export default function Companion() {
  const result = useSelector((s) => s.assessment.result);
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/companion/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The greeting is ours, not part of the conversation the model needs.
          messages: next.slice(1),
          session_id: result?.session_id ?? null,
        }),
      });
      const data = await res.json();
      if (!data.available) {
        setError(data.reason || "The companion is unavailable right now.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        if (data.resources?.length) setResources(data.resources);
      }
    } catch {
      setError("Couldn't reach the companion. Check the backend is running.");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <PageTransition className="max-w-3xl mx-auto space-y-6">
      <Reveal>
        <PageHeader
          eyebrow="Companion"
          title="Say it out loud"
          lede="Somewhere to put the day down. It listens, asks, and keeps it brief — it won't diagnose you."
        />
      </Reveal>

      <Reveal>
        <div className="glass-card flex flex-col" style={{ height: "min(62vh, 520px)" }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                    m.role === "user"
                      ? "bg-ink-50 text-ink-950 rounded-br-sm"
                      : "bg-white/[0.06] border border-white/10 text-ink-100 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/10 px-4 py-3">
                  <span className="flex gap-1.5" aria-label="Thinking">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-ink-300"
                        style={{ animation: `blink 1.3s ${i * 0.18}s infinite` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {OPENERS.map((o) => (
                <button
                  key={o}
                  onClick={() => send(o)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/12 bg-white/[0.04] text-ink-200 hover:bg-white/[0.09] transition"
                >
                  {o}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 p-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type whatever's there…"
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-ink-50 placeholder:text-ink-400 focus:outline-none max-h-32"
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="drop-btn drop-btn-solid !px-4"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        <style>{`@keyframes blink{0%,100%{opacity:.25}50%{opacity:1}}`}</style>
      </Reveal>

      {error && (
        <Reveal>
          <p className="text-sm text-ink-50 glass-card p-4">{error}</p>
        </Reveal>
      )}

      {/*
        Surfaced by a deterministic check on the user's own words, so this
        appears whether or not the model handled the disclosure well.
      */}
      {resources.length > 0 && (
        <Reveal>
          <div className="glass-card p-5" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.18) inset" }}>
            <p className="font-display text-xl text-white">You don't have to sit with this alone</p>
            <p className="text-sm text-ink-300 mt-1.5">
              These lines are staffed by people trained to listen, right now.
            </p>
            <ul className="mt-4 space-y-3">
              {resources.map((r) => (
                <li key={r.phone} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-ink-100 font-medium">{r.name}</span>
                  <a
                    href={`tel:${r.phone.replace(/[^0-9]/g, "")}`}
                    className="text-ink-50 text-lg font-semibold tracking-wide inline-flex items-center gap-1.5 hover:underline"
                  >
                    <Phone size={14} />
                    {r.phone}
                  </a>
                  <span className="text-xs text-ink-400 basis-full">
                    {r.hours} · {r.note}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-ink-400 mt-4">
              If you are in immediate danger, contact local emergency services.
            </p>
          </div>
        </Reveal>
      )}

      <Reveal>
        <p className="text-[11px] text-ink-400">
          A supportive conversation, not therapy or medical advice. Messages are sent to Groq to
          generate a reply and are not stored by MindScan.
        </p>
      </Reveal>
    </PageTransition>
  );
}
