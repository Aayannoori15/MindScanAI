import { useEffect, useRef, useState } from "react";

/**
 * The hero's motif, rebuilt in WebGL: a brushed grey torus hovering in
 * near-black, lit by a single soft key light from above so one edge catches a
 * bright specular and the rest falls to black.
 *
 * Interaction is deliberately restrained — the ring leans a few degrees toward
 * the pointer and drifts on its own. Anything more would fight the content.
 *
 * Degrades to nothing (renders an empty box) when WebGL is unavailable or the
 * viewer prefers reduced motion, so it can never break a page.
 */
export default function RingScene({ className = "", interactive = true }) {
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let THREE;
      try {
        THREE = await import("three");
      } catch {
        setFailed(true);
        return;
      }
      if (disposed) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      } catch {
        setFailed(true);
        return;
      }

      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      // Cap DPR: the ring is soft-focus, so extra pixels cost battery for nothing.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.35, 6.2);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.05, 0.14, 64, 320),
        new THREE.MeshStandardMaterial({
          color: 0x3a3a3a,
          metalness: 0.96,
          roughness: 0.26,
          envMapIntensity: 1,
        })
      );
      // Tilt so the ring reads as an ellipse in perspective, like the hero.
      ring.rotation.set(1.06, 0.16, 0.22);
      scene.add(ring);

      // Key light directly above: the source of the bright top edge.
      const key = new THREE.DirectionalLight(0xffffff, 4.2);
      key.position.set(0.4, 5, 2.2);
      scene.add(key);

      // Weak fill so the unlit side is near-black but not a silhouette.
      const fill = new THREE.DirectionalLight(0xffffff, 0.5);
      fill.position.set(-3, -1.5, 1.5);
      scene.add(fill);

      scene.add(new THREE.AmbientLight(0xffffff, 0.12));

      // Rim light grazing from behind picks out the far edge of the torus.
      const rim = new THREE.PointLight(0xffffff, 14, 22, 2);
      rim.position.set(-1.6, 2.4, -3.4);
      scene.add(rim);

      const pointer = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };

      const onPointerMove = (e) => {
        const r = host.getBoundingClientRect();
        target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      };
      if (interactive && !prefersReduced) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
      }

      const ro = new ResizeObserver(() => {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(host);

      // Pause when off-screen or the tab is hidden — no reason to burn GPU.
      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(host);

      const baseX = ring.rotation.x;
      const baseY = ring.rotation.y;
      let raf = 0;
      const start = performance.now();

      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) return;

        const t = (now - start) / 1000;
        pointer.x += (target.x - pointer.x) * 0.045;
        pointer.y += (target.y - pointer.y) * 0.045;

        if (prefersReduced) {
          ring.rotation.z = 0;
        } else {
          ring.rotation.z = t * 0.06;
        }
        ring.rotation.x = baseX + pointer.y * 0.16;
        ring.rotation.y = baseY + pointer.x * 0.22;

        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointerMove);
        ro.disconnect();
        io.disconnect();
        ring.geometry.dispose();
        ring.material.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [interactive]);

  if (failed) return null;
  return <div ref={hostRef} aria-hidden="true" className={className} />;
}
