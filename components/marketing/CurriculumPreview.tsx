"use client";

import { useEffect, useRef, useState } from "react";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["curriculum"];
}

function useReveal(threshold = 0.1) {
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
 * Curriculum in stile editoriale (rev. May 2026):
 * lista verticale di 5 capitoli (PERCORSO 01 piccolo / titolo grande
 * / descrizione 1 riga / meta), separati da hairline border.
 *
 * Nessuna barra colorata di difficoltà, nessun badge Pro esposto —
 * il piano tier viene scoperto dopo signup (per design coerente con
 * il LANDING.md brief: "Pricing nascosto in landing"). I dati `tier`
 * e `level` restano nei tipi/i18n perché sono usati da altre surface
 * (admin, dashboard, ecc) — qui semplicemente non li renderizziamo.
 */
export function CurriculumPreview({ copy }: Props) {
  const [headerRef, headerVisible] = useReveal(0.25);
  const [listRef, listVisible] = useReveal(0.08);

  return (
    <section
      id="curriculum"
      aria-labelledby="curriculum-title"
      className="overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div
          ref={headerRef as React.RefObject<HTMLDivElement>}
          className={`scroll-reveal max-w-2xl ${headerVisible ? "in-view" : ""}`}
        >
          <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-text-muted">
            {copy.kicker}
          </p>
          <h2
            id="curriculum-title"
            className="mt-3 font-heading text-3xl font-bold leading-tight tracking-[-0.025em] text-text-primary text-balance sm:text-4xl lg:text-5xl"
          >
            {copy.title}
          </h2>
          {copy.sub ? (
            <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
              {copy.sub}
            </p>
          ) : null}
        </div>

        <div
          ref={listRef as React.RefObject<HTMLDivElement>}
          className="mt-10 lg:mt-14"
        >
          {copy.cards.map((card, i) => (
            <article
              key={card.number}
              className={`scroll-reveal grid grid-cols-[80px_1fr] items-start gap-x-4 gap-y-2 border-t border-border py-6 last:border-b md:grid-cols-[110px_1fr_1.4fr_auto] md:items-center md:gap-x-10 md:gap-y-0 md:py-10 ${listVisible ? "in-view" : ""}`}
              style={{ transitionDelay: listVisible ? `${i * 90}ms` : "0ms" }}
            >
              <p className="col-start-1 row-start-1 font-mono text-xs uppercase tracking-[0.04em] text-text-muted md:text-[13px]">
                {card.number}
              </p>
              <h3 className="col-start-2 row-start-1 font-heading text-xl font-semibold leading-snug tracking-[-0.02em] text-text-primary md:text-2xl lg:text-[28px]">
                {card.title}
              </h3>
              <p className="col-span-2 col-start-1 row-start-2 mt-1 text-[15px] leading-relaxed text-text-secondary md:col-span-1 md:col-start-3 md:row-start-1 md:mt-0">
                {card.desc}
              </p>
              <p className="col-span-2 col-start-1 row-start-3 mt-1 whitespace-nowrap font-mono text-xs text-text-muted md:col-span-1 md:col-start-4 md:row-start-1 md:mt-0">
                {card.meta}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
