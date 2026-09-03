"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const SIGNALS = [
  "BANK STATUS",
  "PAYMENT METHOD",
  "CUSTOMER HISTORY",
  "TRANSACTION VALUE",
  "TIME",
  "BEHAVIOUR",
  "FAILURE CODE",
  "MANDATE STATUS",
  "RISK",
  "RECOVERY HISTORY",
];

/** Persona split: copper (limit) vs teal (balance) — same family, different human. */
const PERSONAS = [
  {
    code: "UPI_DAILY_LIMIT",
    read: "\u201CHas funds — the channel is capped today.\u201D",
    action: "Offer Card / EMI instrument switch",
    accent: "text-copper",
    ring: "border-copper/50",
  },
  {
    code: "INSUFFICIENT_BALANCE",
    read: "\u201CBalance is low but top-up-able — a friend\u2019s UPI transfer away.\u201D",
    action: "RE-ENABLE UPI + 1-click intent link",
    accent: "text-teal",
    ring: "border-teal/50",
  },
];

/** Section 4 (pinned) — signals draw in copper; labels glow teal. */
export default function ContextSection() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".sig-line",
        { strokeDashoffset: 320 },
        {
          strokeDashoffset: 0,
          ease: "none",
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: "top top", end: "+=45%", scrub: true, pin: true, anticipatePin: 1 },
        }
      );
      gsap.fromTo(
        ".sig-label",
        { autoAlpha: 0.15 },
        { autoAlpha: 1, stagger: 0.04, scrollTrigger: { trigger: el, start: "top top", end: "+=45%", scrub: true } }
      );
      gsap.fromTo(
        ".persona",
        { autoAlpha: 0, y: 60 },
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.15,
          scrollTrigger: { trigger: el, start: "top top", end: "+=90%", scrub: true },
        }
      );
      gsap.fromTo(
        ".persona-line",
        { autoAlpha: 0 },
        { autoAlpha: 1, scrollTrigger: { trigger: el, start: "+=70%", end: "+=95%", scrub: true } }
      );
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="relative mx-auto min-h-screen max-w-7xl px-6 py-24">
      <h2 className="font-display text-center text-4xl font-bold tracking-tight md:text-6xl">
        Every payment has a <span className="serif-it grad-text">story.</span>
      </h2>
      <p className="mt-3 text-center text-sm uppercase tracking-[0.25em] text-body/40">Payments are contextual</p>

      <div className="relative mx-auto mt-16 aspect-[16/8] w-full max-w-5xl" aria-label="Signals connected to the failed transaction">
        <svg viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full" aria-hidden>
          {SIGNALS.map((s, i) => {
            const a = (i / SIGNALS.length) * Math.PI * 2 - Math.PI / 2;
            const x1 = 500 + Math.cos(a) * 420;
            const y1 = 250 + Math.sin(a) * 200;
            return (
              <line
                key={s}
                className="sig-line"
                x1={x1}
                y1={y1}
                x2={500}
                y2={250}
                stroke="rgba(205,127,50,0.4)"
                strokeWidth="1"
                strokeDasharray="320"
              />
            );
          })}
          <circle cx="500" cy="250" r="46" fill="#1a1a1a" stroke="rgba(205,127,50,0.7)" />
          <text x="500" y="245" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="700">₹50,000</text>
          <text x="500" y="266" textAnchor="middle" fill="rgba(224,224,224,0.55)" fontSize="11">FAILED · UPI</text>
        </svg>

        {SIGNALS.map((s, i) => {
          const a = (i / SIGNALS.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <span
              key={s}
              className="sig-label mono absolute rounded-full border border-teal/30 bg-canvas/80 px-3 py-1 text-[10px] tracking-wider text-teal"
              style={{
                left: `${50 + Math.cos(a) * 42}%`,
                top: `${50 + Math.sin(a) * 40}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {s}
            </span>
          );
        })}
      </div>

      <div className="mx-auto mt-24 max-w-5xl">
        <div className="grid gap-6 md:grid-cols-2">
          {PERSONAS.map((p) => (
            <article key={p.code} className={`persona fine-card rounded-2xl border ${p.ring} p-8`}>
              <p className={`mono text-xs tracking-widest ${p.accent}`}>{p.code}</p>
              <p className="serif-it mt-4 text-2xl leading-snug text-white/90">{p.read}</p>
              <p className="mt-6 text-sm text-body/60">
                → <span className="font-semibold text-white">{p.action}</span>
              </p>
            </article>
          ))}
        </div>
        <p className="persona-line mt-10 text-center text-xl text-white/80 md:text-2xl">
          Same error family. <span className="serif-it grad-text-teal">Different human.</span> Different decision.
        </p>
      </div>
    </section>
  );
}
