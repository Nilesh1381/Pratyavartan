"use client";

import { ArrowRight } from "lucide-react";
import Scramble from "@/components/cinema/scramble";
import WeightWord from "@/components/cinema/weight-word";
import Magnetic from "@/components/cinema/magnetic";
import { CONSOLE_URL } from "@/lib/constants";

export default function FinalCta() {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center px-6 py-32">
      <div className="text-center">
        <p className="mono text-xs uppercase tracking-[0.3em] text-body/40">प्रत्यावर्तन</p>
        <h2 className="font-display mt-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
          <Scramble text="Don’t retry blindly." />
        </h2>
        <p className="serif-it mt-2 text-4xl text-copper md:text-6xl">
          <WeightWord text="Decide intelligently." />
        </p>
        <p className="mt-8 text-lg text-body/60">Understand every failure. Recover what matters.</p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Magnetic>
            <a
              href={CONSOLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-teal px-7 py-3.5 font-semibold text-[#06201e] transition-all hover:bg-copper hover:text-white"
            >
              Enter Live War Room
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </a>
          </Magnetic>
          <a
            href="#how-it-works"
            className="rounded-full border border-copper/50 px-7 py-3.5 font-medium text-copper transition-colors hover:border-copper hover:text-white"
          >
            View Architecture
          </a>
        </div>
      </div>
    </section>
  );
}
