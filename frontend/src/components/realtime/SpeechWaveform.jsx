import { useEffect, useRef } from "react";

export default function SpeechWaveform({ active }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const draw = (t) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#00BFA6";
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const amp = active ? Math.sin(x / 12 + t / 200) * 18 + Math.sin(x / 7) * 8 : 4;
        const y = height / 2 + amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={ref} width={640} height={80} className="w-full rounded-xl glass-inset" />;
}
