"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * CUSTOM CURSOR — copper dot rides the native cursor position (zero-lag via
 * CSS `cursor` replacement); a teal trailing ring lerps behind it. Ring
 * expansion on hoverables is pure CSS (:has). Rendered only for fine
 * pointers; touch devices never see it.
 */
export default function CinemaCursor() {
  const ring = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine || reduced) return;

    document.documentElement.classList.add("cinema-cursor");

    let rx = -100, ry = -100, tx = -100, ty = -100, raf = 0;
    const move = (e: MouseEvent) => {
      tx = e.clientX; ty = e.clientY;
      if (ring.current) ring.current.style.setProperty("--mx", `${tx}px`);
      if (ring.current) ring.current.style.setProperty("--my", `${ty}px`);
    };
    // dot: instant; ring: lerp trail
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.appendChild(dot);

    const onMove = (e: MouseEvent) => {
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      move(e);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      }
      if (Math.abs(tx - rx) > 0.1 || Math.abs(ty - ry) > 0.1) raf = requestAnimationFrame(loop);
      else raf = 0;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      dot.remove();
      document.documentElement.classList.remove("cinema-cursor");
    };
  }, [reduced]);

  if (reduced) return null;
  return <div ref={ring} className="cursor-ring" aria-hidden />;
}
