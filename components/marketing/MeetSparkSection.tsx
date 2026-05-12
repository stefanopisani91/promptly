"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/posthog";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["meetSpark"];
}

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
 * Renderizza un paragrafo della voce di Spark.
 * Pattern supportati:
 *   - `**testo**` → <strong> in colore text-primary (enfasi neutra)
 *   - `«testo»` → <em> con sfondo highlighter arancione tenue
 * Tutto il resto è plain text in text-secondary.
 */
function renderSparkParagraph(text: string): React.ReactNode {
  // Matcho prima i bold, poi dentro ogni segmento "non bold" matcho le quote.
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.flatMap((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`b-${i}`} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Cerco quote in italiano «...»
    const quoteParts = part.split(/(«[^»]+»)/g);
    return quoteParts.map((qp, j) => {
      if (qp.startsWith("«") && qp.endsWith("»")) {
        return (
          <em
            key={`q-${i}-${j}`}
            className="not-italic px-0.5"
            style={{
              backgroundImage:
                "linear-gradient(transparent 70%, rgba(232,112,63,0.15) 70%)",
              color: "var(--text-primary)",
              fontStyle: "italic",
            }}
          >
            {qp}
          </em>
        );
      }
      return <span key={`s-${i}-${j}`}>{qp}</span>;
    });
  });
}

export function MeetSparkSection({ copy }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewedRef = useRef(false);
  const [contentRef, contentVisible] = useReveal(0.15);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || viewedRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            track({ name: "landing_meet_spark_viewed" });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="meet-spark"
      aria-labelledby="meet-spark-name"
      className="overflow-hidden border-y border-border py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          ref={contentRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(260px,360px)_1fr] lg:gap-16"
        >
          {/* Portrait — placeholder mascotte. La caption "illustrazione da
              commissionare" (copy.portraitCaption) NON viene renderizzata:
              è una nota interna, non testo per gli utenti. Tornerà se serve
              quando arriva l'illustrazione vera. */}
          <div
            className={`scroll-reveal meet-spark-portrait ${contentVisible ? "in-view" : ""}`}
            aria-hidden="true"
          >
            <div className="meet-spark-body">
              <div className="meet-spark-highlight" />
            </div>
          </div>

          {/* Body */}
          <div
            className={`scroll-reveal max-w-xl ${contentVisible ? "in-view" : ""}`}
            style={{ transitionDelay: contentVisible ? "150ms" : "0ms" }}
          >
            <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-text-muted">
              {copy.kicker}
            </p>
            <h2
              id="meet-spark-name"
              className="mt-4 font-heading text-3xl font-bold leading-[1.05] tracking-[-0.025em] text-text-primary sm:text-4xl lg:text-5xl"
            >
              {copy.name}
            </h2>

            {copy.paragraphs.map((para, i) => (
              <p
                key={i}
                className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg"
              >
                {renderSparkParagraph(para)}
              </p>
            ))}

            <div className="mt-6 flex flex-wrap gap-2">
              {copy.rules.map((rule, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-text-secondary"
                >
                  <span
                    aria-hidden="true"
                    className="mr-1.5"
                    style={{
                      color: rule.kind === "yes" ? "#2E7D32" : "#C8521F",
                    }}
                  >
                    {rule.kind === "yes" ? "✓" : "✕"}
                  </span>
                  {rule.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
