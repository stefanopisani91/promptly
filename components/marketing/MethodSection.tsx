"use client";

import { useEffect, useRef, useState } from "react";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["method"];
}

/** One-shot reveal hook: ref + boolean once-visible flag */
function useReveal(threshold = 0.18) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

/**
 * Renderizza una stringa con pattern `**testo**` come <em>testo</em>
 * con stile accent. Tutto il resto resta plain text.
 * Esempio: "Solo **il modo giusto** per parlare" → "Solo <em>il modo giusto</em> per parlare"
 */
function renderBoldAccent(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <em
          key={i}
          className="font-normal not-italic text-primary"
        >
          {part.slice(2, -2)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Renderizza una stringa con `**testo**` come strong, niente accent. */
function renderBoldStrong(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function MethodSection({ copy }: Props) {
  const [leadRef, leadVisible] = useReveal(0.25);
  const [paragraphsRef, paragraphsVisible] = useReveal(0.1);

  return (
    <section
      id="method"
      aria-labelledby="method-kicker"
      className="overflow-hidden border-t border-border py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          ref={leadRef as React.RefObject<HTMLDivElement>}
          className={`scroll-reveal ${leadVisible ? "in-view" : ""}`}
        >
          <p
            id="method-kicker"
            className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-text-muted"
          >
            {copy.kicker}
          </p>
          <h2 className="mt-3 max-w-3xl font-heading text-2xl font-semibold leading-tight tracking-[-0.02em] text-text-primary text-balance sm:text-3xl lg:text-4xl">
            {renderBoldAccent(copy.lead)}
          </h2>
        </div>

        <div
          ref={paragraphsRef as React.RefObject<HTMLDivElement>}
          className="mt-12 grid max-w-4xl grid-cols-1 gap-8 sm:mt-14 md:grid-cols-2"
        >
          {copy.paragraphs.map((p, i) => (
            <p
              key={i}
              className={`scroll-reveal text-base leading-relaxed text-text-secondary sm:text-lg ${paragraphsVisible ? "in-view" : ""}`}
              style={{ transitionDelay: paragraphsVisible ? `${i * 120}ms` : "0ms" }}
            >
              <strong className="font-semibold text-text-primary">
                {p.bold}
              </strong>{" "}
              {renderBoldStrong(p.body)}
              {p.quiet ? (
                <>
                  {" "}
                  <span className="text-text-muted">{p.quiet}</span>
                </>
              ) : null}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
