"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TxObject } from "./tx-object";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const FACTS = [
  ["Customer tenure", "3 years"],
  ["Monthly spend", "₹50,000"],
  ["Historical success", "98%"],
  ["Previous failures", "1"],
  ["Revenue impact", "HIGH"],
];

/** Section 3 — the hero dissolves into ONE failed transaction object. Copper warmth begins. */
export default function TransactionScene() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".tx-reveal",
        { autoAlpha: 0, y: 40, filter: "blur(10px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 65%", end: "top 20%", scrub: true },
        }
      );
      gsap.fromTo(
        ".tx-card",
        { scale: 0.94 },
        {
          scale: 1,
          scrollTrigger: { trigger: el, start: "top bottom", end: "center center", scrub: true },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} id="how-it-works" className="relative mx-auto max-w-7xl px-6 py-32 md:py-40">
      <p className="tx-reveal mono mb-4 text-xs uppercase tracking-[0.3em] text-body/40">Failure overview</p>
      <h2 className="tx-reveal font-display max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
        Behind every failure is a <span className="serif-it grad-text">real customer.</span>
      </h2>

      <div className="tx-card mt-14 flex flex-col items-start gap-10 md:flex-row md:items-center md:justify-between">
        <TxObject status="FAILED" reason="UPI_LIMIT_EXCEEDED" />
        <dl className="grid w-full max-w-md grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-1">
          {FACTS.map(([k, v]) => (
            <div key={k} className="tx-reveal flex items-center justify-between bg-canvas px-5 py-3.5">
              <dt className="text-sm text-body/50">{k}</dt>
              <dd className={`mono text-sm ${v === "HIGH" ? "text-copper" : "text-white"}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
