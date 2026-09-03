"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TxObject } from "./tx-object";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const CHAIN = ["AI DECISION", "POLICY", "ACTION", "CUSTOMER", "PAYMENT"];

/** Section 10 — warm arc. The SAME ₹50,000 flips to RECOVERED with amber glow. */
export default function RecoveryScene() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.set(".chain-node", { opacity: 0.25, scale: 0.96 });
      gsap.to(".chain-node", {
        opacity: 1,
        scale: 1,
        stagger: 0.2,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "+=60%", scrub: true, pin: true, anticipatePin: 1 },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} id="recovery" className="relative flex min-h-screen flex-col items-center justify-center px-6 py-28">
      {/* amber celebration halo behind the transaction (gated by flip progress) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-1000"
        style={{ background: "radial-gradient(circle, rgba(255,149,0,0.14), transparent 65%)" }}
        data-burst
        aria-hidden
      />

      <p className="mono text-xs uppercase tracking-[0.3em] text-body/40">Autonomous execution · warm arc</p>
      <h2 className="font-display mt-4 text-center text-4xl font-bold tracking-tight md:text-6xl">
        Executed while you <span className="serif-it grad-text-teal">watch.</span>
      </h2>

      <ol className="mt-16 flex flex-wrap items-center justify-center gap-3" aria-label="Recovery pipeline">
        {CHAIN.map((c, i) => (
          <li key={c} className="flex items-center gap-3">
            <span className={`chain-node mono rounded-full border border-teal/30 bg-canvas/80 px-4 py-2 text-xs tracking-wider transition-colors duration-500 ${i === CHAIN.length - 1 ? "text-amber" : "text-body/80"}`}>
              {c}
            </span>
            {i < CHAIN.length - 1 && <span className="text-white/25" aria-hidden>→</span>}
          </li>
        ))}
      </ol>

      <div className="tx-flip mt-14 w-full max-w-md">
        <TxStatus />
      </div>

      <p className="mt-10 max-w-md text-center text-sm text-body/50">
        The customer taps the link once. The ledger writes every hop — decision, policy verdict, action, callback —
        hash-chained and tamper-proof.
      </p>
    </section>
  );
}

function TxStatus() {
  const failedWrap = useRef<HTMLDivElement>(null);
  const recWrap = useRef<HTMLDivElement>(null);
  const burst = useRef<Element | null>(null);
  const section = useRef<HTMLElement | null>(null);

  useEffect(() => {
    section.current = document.getElementById("recovery");
    burst.current = section.current?.querySelector("[data-burst]") ?? null;

    const st = ScrollTrigger.create({
      trigger: "#recovery",
      start: "+=55%",
      end: "+=90%",
      scrub: true,
      onUpdate: (self) => {
        const recovered = self.progress > 0.5;
        failedWrap.current?.classList.toggle("hidden", recovered);
        recWrap.current?.classList.toggle("hidden", !recovered);
        if (burst.current instanceof HTMLElement) {
          burst.current.style.opacity = recovered ? "1" : "0";
        }
      },
    });
    return () => st.kill();
  }, []);

  return (
    <>
      <div ref={failedWrap}><TxObject status="FAILED" reason="UPI_LIMIT_EXCEEDED" /></div>
      <div ref={recWrap} className="hidden"><TxObject status="RECOVERED" /></div>
    </>
  );
}
