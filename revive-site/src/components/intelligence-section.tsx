"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Section 11 — a node field that self-organizes as you scroll: scattered
 * outcome nodes drift toward an ordered ledger chain. Canvas keeps it 60fps.
 */
function IntelligenceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const progress = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type N = { ox: number; oy: number; tx: number; ty: number };
    let nodes: N[] = [];

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = [];
      for (let i = 0; i < 42; i++) {
        nodes.push({
          ox: Math.random() * w,
          oy: Math.random() * h,
          tx: w * 0.5 + Math.cos((i / 42) * Math.PI * 2) * (w * 0.3),
          ty: h * 0.5 + Math.sin((i / 42) * Math.PI * 2) * (h * 0.28),
        });
      }
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const p = reduced ? 1 : progress.current;

      // ordered chain links between target positions
      ctx.strokeStyle = `rgba(205,127,50,${0.25 * p})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i], b = nodes[i + 1];
        ctx.beginPath();
        ctx.moveTo(a.ox + (a.tx - a.ox) * p, a.oy + (a.ty - a.oy) * p);
        ctx.lineTo(b.ox + (b.tx - b.ox) * p, b.oy + (b.ty - b.oy) * p);
        ctx.stroke();
      }
      let ni = 0;
      for (const n of nodes) {
        const x = n.ox + (n.tx - n.ox) * p;
        const y = n.oy + (n.ty - n.oy) * p;
        ctx.fillStyle = ni % 2 === 0 ? "rgba(205,127,50,0.8)" : "rgba(32,178,170,0.8)";
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ni++;
      }
    };

    resize();
    draw();
    let raf = 0;
    let running = false;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      if (reduced) return;
      if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(loop); }
      else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    });
    io.observe(canvas);

    const st = ScrollTrigger.create({
      trigger: canvas,
      start: "top bottom",
      end: "center center",
      scrub: true,
      onUpdate: (self) => { progress.current = self.progress; },
    });

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);

    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); st.kill(); };
  }, [reduced]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

const LOOP = ["FAILURE", "DIAGNOSIS", "ACTION", "OUTCOME", "LEARNING"];

export default function IntelligenceSection() {
  return (
    <section id="intelligence" className="relative overflow-hidden px-6 py-32">
      <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center">
        <IntelligenceCanvas />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#05080f_88%)]" />
        <div className="relative z-10 mx-auto text-center">
          <p className="mono text-xs uppercase tracking-[0.3em] text-white/40">Compounding intelligence</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Every recovery makes the next decision <span className="serif-it grad-text">smarter.</span>
          </h2>
          <p className="mono mt-10 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-canvas/70 px-6 py-4 text-xs text-white/75">
            {LOOP.map((l, i) => (
              <span key={l} className="flex items-center gap-2">
                <span>{l}</span>
                {i < LOOP.length - 1 && <span className="text-accent" aria-hidden>→</span>}
              </span>
            ))}
            <span className="text-accent" aria-hidden>↻</span>
          </p>
          <p className="mt-6 text-sm text-white/50">
            Outcomes are written to the hash-chained ledger — the system self-organizes around what actually recovers revenue.
          </p>
        </div>
      </div>
    </section>
  );
}
