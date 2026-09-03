"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * VARIABLE WEIGHT: each word animates font-variation-settings wght 400→800
 * as it scrolls through the viewport band (Space Grotesk variable axis).
 */
export default function WeightWord({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const words = Array.from(el.querySelectorAll<HTMLElement>(".ww"));
    const tweens = words.map((w) =>
      gsap.fromTo(
        w,
        { fontVariationSettings: "'wght' 400" },
        {
          fontVariationSettings: "'wght' 800",
          ease: "none",
          scrollTrigger: { trigger: w, start: "top 85%", end: "top 45%", scrub: true },
        }
      )
    );
    return () => tweens.forEach((t) => t.scrollTrigger?.kill());
  }, [reduced]);

  return (
    <span ref={ref} className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="ww" style={{ display: "inline-block", willChange: "font-variation-settings" }}>
          {w}
          {i < text.split(" ").length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}
