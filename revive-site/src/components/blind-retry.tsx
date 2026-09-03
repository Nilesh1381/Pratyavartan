"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Section 5 (pinned) — failed loops flash amber/red; the teal REVIVE path dominates. */
export default function BlindRetry() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [loopState, setLoopState] = useState("FAILED");

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=60%",
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => setLoopState(Math.floor(self.progress * 8) % 2 === 0 ? "FAILED" : "RETRY…"),
      });

      gsap.fromTo(
        ".retry-paths",
        { autoAlpha: 0, y: 80 },
        { autoAlpha: 1, y: 0, scrollTrigger: { trigger: el, start: "top top", end: "+=85%", scrub: true } }
      );
      gsap.fromTo(
        ".revive-path",
        { boxShadow: "0 0 0 rgba(32,178,170,0)" },
        { boxShadow: "0 0 90px rgba(32,178,170,0.20)", scrollTrigger: { trigger: el, start: "+=55%", end: "+=95%", scrub: true } }
      );
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} id="blind-retry" className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <p className="mono text-xs uppercase tracking-[0.3em] text-body/40">The default recovery</p>
        <h2 className="font-display mt-4 max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
          Why repeat the <span className="copper-underline">same mistake?</span>
        </h2>

        <div
          className="mono mt-12 inline-flex items-center gap-4 rounded-xl border border-white/10 bg-canvas px-8 py-5 text-lg"
          aria-live="polite"
          aria-label={`Blind retry loop state: ${loopState}`}
        >
          <span className="text-red-400">FAILED</span>
          <span className="text-white/30">→</span>
          <span className={loopState === "RETRY…" ? "animate-pulse text-amber" : "text-body/50"}>{loopState}</span>
          <span className="text-white/30">→</span>
          <span className="text-amber/70">FAILURE</span>
        </div>

        <div className="retry-paths mt-16 grid gap-6 md:grid-cols-2">
          <article className="fine-card rounded-2xl p-8 opacity-60">
            <p className="mono text-xs tracking-widest text-body/40">STATIC RULE</p>
            <p className="mono mt-6 text-sm leading-loose text-body/70">
              FAILURE <span className="text-white/30">→</span> RETRY <span className="text-white/30">→</span>{" "}
              FAILURE <span className="text-white/30">→</span> RETRY…
            </p>
            <p className="mt-6 text-sm text-body/50">Same channel, same minute, same odds. The customer feels chased.</p>
          </article>

          <article className="revive-path fine-card rounded-2xl border-teal/50 p-8 transition-shadow duration-700">
            <p className="mono text-xs tracking-widest text-teal">PRATYAVARTAN</p>
            <p className="mono mt-6 text-sm leading-loose text-white">
              FAILURE <span className="text-teal">→</span> UNDERSTAND <span className="text-teal">→</span> DIAGNOSE{" "}
              <span className="text-teal">→</span> DECIDE <span className="text-teal">→</span> ACT
            </p>
            <p className="mt-6 text-sm text-body/60">
              One diagnosis changes everything: right instrument, right moment, right message.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
