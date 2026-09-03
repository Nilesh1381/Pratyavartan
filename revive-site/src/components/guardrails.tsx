"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const RULES = [
  "Retry limit ≤ 2",
  "RBI outreach window 9:00–21:00 IST",
  "Confidence threshold ≥ 0.90",
  "HMAC signature verified",
  "PII masking enforced",
];

/** Section 9 (pinned) — glassmorphic policy check, teal ticks, copper APPROVED glow. */
export default function Guardrails() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.set(".rule", { opacity: 0.35 });
      gsap.to(".rule", {
        opacity: 1,
        stagger: 0.18,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "+=70%", scrub: true, pin: true, anticipatePin: 1 },
      });
      gsap.fromTo(
        ".approved",
        { autoAlpha: 0, scale: 0.92 },
        { autoAlpha: 1, scale: 1, ease: "power2.out", scrollTrigger: { trigger: el, start: "+=72%", end: "+=95%", scrub: true } }
      );
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} id="guardrails" className="relative flex min-h-screen flex-col items-center justify-center px-6 py-28">
      <p className="mono text-xs uppercase tracking-[0.3em] text-body/40">Policy check</p>
      <h2 className="font-display mt-4 text-center text-4xl font-bold tracking-tight md:text-6xl">
        Autonomous — <span className="serif-it grad-text">but bounded.</span>
      </h2>

      <ul className="glass mt-14 w-full max-w-xl space-y-3 rounded-2xl p-5" aria-label="Enforced policy rules">
        {RULES.map((r) => (
          <li key={r} className="rule flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-5 py-4">
            <span className="text-sm text-white/85">{r}</span>
            <ShieldCheck className="h-5 w-5 text-teal" aria-label="rule enforced" />
          </li>
        ))}
      </ul>

      <p className="approved mono amber-pulse mt-12 rounded-full border border-copper/60 bg-copper/10 px-8 py-3 text-sm tracking-widest text-copper">
        ACTION APPROVED
      </p>
    </section>
  );
}
