"use client";

import { useState } from "react";
import { Copy, Check, ArrowRight } from "lucide-react";
import { API_DOCS_URL } from "@/lib/constants";

const LANGS = ["PYTHON", "NODE JS", "CURL", "GO", "JAVA"];

const SNIPPETS: Record<string, string> = {
  PYTHON: `import hashlib, hmac

def verify(raw_body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

# 400 on mismatch · 200 + RECOVERED on payment_link.paid`,
  "NODE JS": `import { createHmac, timingSafeEqual } from "crypto";

export function verify(raw, header, secret) {
  const expected = createHmac("sha256", secret)
    .update(raw).digest("hex");
  return timingSafeEqual(
    Buffer.from(expected), Buffer.from(header)
  );
}`,
  CURL: `curl -X POST https://api.pratyavartan.dev/webhooks \\
  -H "X-Signature: $HMAC_SHA256" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"payment.failed","amount":500000}'`,
  GO: `func Verify(body []byte, sig, secret string) bool {
  mac := hmac.New(sha256.New, []byte(secret))
  mac.Write(body)
  expected := hex.EncodeToString(mac.Sum(nil))
  return hmac.Equal([]byte(expected), []byte(sig))
}`,
  JAVA: `Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
String expected = HexFormat.of()
    .formatHex(mac.doFinal(rawBody));
return MessageDigest.isEqual(
    expected.getBytes(), sig.getBytes());`,
};

const PLATFORM = [
  { name: "Webhooks", desc: "HMAC-SHA256 verified. Constant-time comparison. Invalid signatures rejected with 400 and a CRITICAL audit event." },
  { name: "REST API", desc: "Simulate failures, trigger sweeps, close recoveries — integer paise everywhere, idempotent by design." },
  { name: "Audit Ledger", desc: "Append-only, hash-chained (SHA-256). Every decision, action and callback is tamper-evident." },
];

/** Developer section — terminal aesthetic with real HMAC verify snippets. */
export default function DeveloperSection() {
  const [lang, setLang] = useState("PYTHON");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPETS[lang]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="relative px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center gap-3" aria-label="Supported languages">
          {LANGS.map((l) => (
            <span
              key={l}
              className={`mono cursor-default rounded-full border px-4 py-1.5 text-xs tracking-wider transition-colors ${
                l === lang ? "border-copper text-copper" : "border-teal/40 text-teal hover:border-copper hover:text-copper"
              }`}
              onClick={() => setLang(l)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLang(l)}
            >
              {l}
            </span>
          ))}
        </div>

        <h2 className="font-display mt-8 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Built for builders. <span className="grad-text">Proven by audit.</span>
        </h2>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* Terminal */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60" role="figure" aria-label="Signed webhook code example">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
              <p className="mono text-xs text-body/50">verify_webhook.{lang === "NODE JS" ? "js" : lang.toLowerCase()}</p>
              <button
                onClick={copy}
                className="mono inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-body/70 transition-colors hover:border-copper hover:text-copper"
                aria-label="Copy code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-amber" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <pre className="mono overflow-x-auto p-6 text-[12px] leading-relaxed">
              {SNIPPETS[lang].split("\n").map((line, i) => (
                <div key={i} className="whitespace-pre">
                  {i === 0 && <span className="mr-2 select-none text-copper">$</span>}
                  <span className={line.trimStart().startsWith("#") || line.trimStart().startsWith("//") ? "text-body/40" : "text-teal"}>
                    {line}
                  </span>
                </div>
              ))}
              <div className="mt-3 text-amber">✓ signature verified · event accepted</div>
            </pre>
          </div>

          {/* Platform cards */}
          <div className="grid content-start gap-5">
            {PLATFORM.map((c) => (
              <article key={c.name} className="fine-card rounded-2xl p-7">
                <h3 className="font-display text-lg font-bold text-white">{c.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-body/60">{c.desc}</p>
                <a
                  href={API_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal transition-colors hover:text-copper"
                >
                  Interactive API Docs
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
