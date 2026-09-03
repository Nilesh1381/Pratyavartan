"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const GLYPHS = "!<>-_\\/[]{}=+*^?#·—";

/**
 * SCRAMBLE-DECODE: headline text resolves from glyph noise → final string
 * over ~0.8s when scrolled into view. Reduced motion renders instantly.
 */
export default function Scramble({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      setDisplay(text); // instant final text
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || played.current) return;
        played.current = true;
        io.disconnect();

        const start = performance.now();
        const DURATION = 800;
        let raf = 0;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / DURATION);
          const settled = Math.floor(p * text.length);
          setDisplay(
            text
              .split("")
              .map((ch, i) => {
                if (i < settled || ch === " ") return ch;
                return GLYPHS[(Math.random() * GLYPHS.length) | 0];
              })
              .join("")
          );
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text, reduced]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {display}
    </span>
  );
}
