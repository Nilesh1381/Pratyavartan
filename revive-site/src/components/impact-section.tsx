"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { CONSOLE_URL } from "@/lib/constants";

type Metric = { label: string; from: number; to: number; format?: (v: number) => string };

const METRICS: Metric[] = [
  { label: "Recovery rate", from: 58, to: 75, format: (v) => `${Math.round(v)}%` },
  { label: "Unnecessary retries", from: 0, to: -42, format: (v) => `${Math.round(v)}%` },
  { label: "Recovery time", from: 240, to: 38, format: (v) => (v >= 60 ? `${Math.round(v / 60)}h` : `${Math.round(v)}m`) },
  { label: "High-value recovery", from: 0, to: 31, format: (v) => `+${Math.round(v)}%` },
];

function CountUp({ m }: { m: Metric }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(m.from, m.to, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = m.format ? m.format(v) : String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, m]);

  return <span ref={ref}>{m.format ? m.format(m.from) : m.from}</span>;
}

/** Warm arc — recovery metrics in sunset amber on charcoal. */
export default function ImpactSection() {
  return (
    <section id="impact" className="relative border-y border-white/8 px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <p className="mono text-xs uppercase tracking-[0.3em] text-body/40">Impact · warm arc</p>
        <h2 className="font-display mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Recovery, <span className="grad-text">measured.</span>
        </h2>

        <dl className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-canvas p-10">
              <dd className="font-display text-5xl font-bold tracking-tight text-amber">
                <CountUp m={m} />
              </dd>
              <dt className="mt-4 text-sm uppercase tracking-wider text-body/50">{m.label}</dt>
            </div>
          ))}
        </dl>

        <p className="mono mt-6 text-[11px] italic text-copper">
          Illustrative benchmark — replace with validated production metrics.
        </p>
        <p className="mt-8 max-w-xl text-body/70">
          Every number streams live in the Pratyavartan Console — hash-chained and tamper-proof.
        </p>

        <a
          href={CONSOLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-10 inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 font-semibold text-[#06201e] transition-all hover:bg-copper hover:text-white"
        >
          Open Console
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </a>
      </div>
    </section>
  );
}
