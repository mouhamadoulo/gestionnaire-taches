"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed-position aurora that tracks the cursor with two stacked
 * radial gradients (warm orange + cool cyan). Throttled via rAF.
 */
export function CursorAurora() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 3;
    let cx = tx;
    let cy = ty;

    const tick = () => {
      // Easing toward target — gives the light a buttery trail
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      if (ref.current) {
        ref.current.style.setProperty("--mx", cx + "px");
        ref.current.style.setProperty("--my", cy + "px");
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="aurora" aria-hidden />;
}
