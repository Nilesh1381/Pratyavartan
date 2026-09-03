"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * LETTERBOX BARS: 8% black cinema bars slide in while a pinned scene
 * (failure / blind-retry / guardrails) is on screen; grain intensifies.
 * Exits reverse the slide. Mobile uses thinner bars via CSS.
 */
export default function CinemaBars() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    const scenes = ["#how-it-works", "#blind-retry", "#guardrails"];
    const triggers: ScrollTrigger[] = [];

    scenes.forEach((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => setOn(true),
        onEnterBack: () => setOn(true),
        onLeave: () => setOn(false),
        onLeaveBack: () => setOn(false),
      });
      triggers.push(st);
    });

    function setOn(on: boolean) {
      document.body.classList.toggle("cinema-on", on);
      gsap.to(".bar-top", { yPercent: on ? 0 : -101, duration: 0.55, ease: "power3.out", overwrite: "auto" });
      gsap.to(".bar-bottom", { yPercent: on ? 0 : 101, duration: 0.55, ease: "power3.out", overwrite: "auto" });
    }

    // start off-screen
    gsap.set(".bar-top", { yPercent: -101 });
    gsap.set(".bar-bottom", { yPercent: 101 });

    return () => triggers.forEach((t) => t.kill());
  }, [reduced]);

  return (
    <>
      <div className="bar-top" aria-hidden />
      <div className="bar-bottom" aria-hidden />
    </>
  );
}
