"use client";

/**
 * The persistent ₹50,000 transaction object — one continuous entity across
 * the story. FAILED = cold copper-glow; RECOVERED = sunset amber celebration
 * (the only place amber glows).
 */
export function TxObject({
  status = "FAILED",
  reason,
  compact = false,
}: {
  status?: "FAILED" | "RECOVERED" | "EVALUATING" | "APPROVED";
  reason?: string;
  compact?: boolean;
}) {
  const recovered = status === "RECOVERED";

  return (
    <div
      className={`fine-card relative rounded-2xl px-6 py-5 ${compact ? "w-full max-w-sm" : "w-full max-w-md"} ${
        recovered ? "amber-pulse border-amber/40" : "shadow-[0_0_80px_rgba(205,127,50,0.10)]"
      }`}
      aria-label={`Transaction object: 50,000 rupees, status ${status}${reason ? `, reason ${reason}` : ""}`}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">₹50,000</span>
        <span className={`mono text-xs uppercase tracking-widest ${recovered ? "text-amber" : "text-copper"}`}>
          {status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
        <span className="mono text-[11px] text-body/50">pay_QmXk…9fA2 · UPI · INR</span>
        {reason && (
          <span className="mono rounded border border-copper/40 bg-copper/10 px-2 py-0.5 text-[11px] text-copper">
            {reason}
          </span>
        )}
        {!reason && <span className="mono text-[11px] text-teal">hash-chained ✓</span>}
      </div>
    </div>
  );
}
