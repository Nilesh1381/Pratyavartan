"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import { CONSOLE_URL } from "@/lib/constants";
const LINKS = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Recovery", href: "#recovery" },
  { label: "Impact", href: "#impact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        aria-label="Primary"
        className={`glass flex h-14 w-full max-w-6xl items-center justify-between rounded-full px-5 transition-all duration-500 ${
          scrolled ? "shadow-[0_8px_40px_rgba(0,0,0,0.45)]" : ""
        }`}
      >
        <a href="#top" className="flex items-baseline gap-2">
          <span className="grad-text font-display text-xl font-bold">प्रत्यावर्तन</span>
          <span className="font-display text-sm font-medium tracking-[0.22em] text-white">PRAVART</span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-body/60 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </div>

        <a
          href={CONSOLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-teal/50 px-4 py-2 text-sm font-medium text-teal transition-colors hover:border-copper hover:text-copper"
        >
          Launch Console
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </a>
      </nav>
    </header>
  );
}
