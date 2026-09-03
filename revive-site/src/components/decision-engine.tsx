"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const PANEL_TINTS = [
  "radial-gradient(60% 60% at 30% 40%, rgba(32,178,170,0.08), transparent 70%)",   // cool teal
  "radial-gradient(60% 60% at 50% 45%, rgba(32,178,170,0.05), transparent 65%), radial-gradient(60% 60% at 70% 40%, rgba(205,127,50,0.07), transparent 70%)", // mix
  "radial-gradient(60% 60% at 65% 40%, rgba(205,127,50,0.10), transparent 70%)",   // copper dominant
];

const QUESTIONS = [
  "Bank unavailable?",
  "Cash-flow crunch?",
  "Daily limit hit?",
  "Authentication drop?",
  "Network timeout?",
];

const STAGES = [
  {
    tag: "01 · UNDERSTAND",
    title: "PAYMENT_DECLINED",
    body: "The raw failure lands through an HMAC-verified webhook. Amount, rail, error code, timestamp — captured with PII already masked.",
  },
  {
    tag: "02 · DIAGNOSE",
    title: "Analyze the context",
    body: "Bounded reasoning weighs bank health, method, history and timing against the failure signature. Every hypothesis is labeled as inferred until evidence confirms it.",
  },
  {
    tag: "03 · DECIDE",
    title: "Root cause identified.",
    body: "UPI_DAILY_LIMIT — the customer has funds; the channel is capped today. Diagnosis locked with a confidence score and written to the audit ledger.",
  },
];

/** Section 7 (pinned horizontal) — warmth increases across the three panels. */
export default function DecisionEngine() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to(track.current, {
        xPercent: -66,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "+=220%", scrub: true, pin: true, anticipatePin: 1 },
      });
      gsap.fromTo(
        ".q-chip",
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, stagger: 0.08, scrollTrigger: { trigger: el, start: "top top", end: "+=120%", scrub: true } }
      );
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="relative overflow-hidden">
      <div ref={track} className="flex w-[300vw]">
        {STAGES.map((s, idx) => (
          <div key={s.tag} className="relative flex h-screen w-screen items-center px-6 md:px-20">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: PANEL_TINTS[idx] }}
              aria-hidden
            />
            <div className="mx-auto w-full max-w-5xl">
              <p className={`mono text-xs uppercase tracking-[0.3em] ${idx === 2 ? "text-copper" : "text-teal"}`}>{s.tag}</p>
              <h3 className="font-display mt-4 text-4xl font-bold tracking-tight md:text-6xl">{s.title}</h3>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-body/65">{s.body}</p>

              {idx === 1 && (
                <div className="mt-10 flex flex-wrap gap-3">
                  {QUESTIONS.map((q) => (
                    <span key={q} className="q-chip mono rounded-full border border-white/15 px-4 py-2 text-xs text-body/70">
                      {q} <span className="text-teal/70">· inferred</span>
                    </span>
                  ))}
                </div>
              )}

              {idx === 2 && (
                <p className="mono mt-10 inline-block rounded-xl border border-copper/50 bg-copper/10 px-5 py-3 text-sm text-copper">
                  ROOT CAUSE IDENTIFIED → UPI_LIMIT_EXCEEDED · confidence 0.94
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
