import { useEffect, useRef } from "react";

/**
 * Loops a clip at `rate`. Pair with a file that already contains
 * forward + reverse frames so the loop reads as ping-pong, not a restart.
 */
export default function PingPongVideo({ src, className = "", rate = 1 }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.playbackRate = rate;
    const play = () => video.play().catch(() => {});
    if (video.readyState >= 2) play();
    else video.addEventListener("canplay", play, { once: true });
    return () => video.pause();
  }, [src, rate]);

  return (
    <video
      ref={ref}
      className={className}
      src={`${src}?v=3`}
      muted
      playsInline
      loop
      preload="auto"
      aria-hidden="true"
    />
  );
}
