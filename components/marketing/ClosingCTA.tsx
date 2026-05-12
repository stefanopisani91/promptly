"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/posthog";
import type { Lang } from "@/types";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["closingCta"];
  lang: Lang;
}

/**
 * Closing CTA in stile editoriale.
 *
 * Cambio rispetto alla versione precedente: niente più sezione full-bleed
 * arancione. Ora è una chiusura a una riga grande, link sottolineato in
 * accent, micro-reminder in monospace sotto. Pattern "fine articolo"
 * (Notion / Stripe / Linear) invece del classico "saas final banner".
 */
export function ClosingCTA({ copy, lang }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewedRef = useRef(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || viewedRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            setContentVisible(true);
            track({ name: "landing_closing_cta_viewed" });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const onClick = () => {
    track({ name: "landing_closing_cta_clicked" });
  };

  return (
    <section
      ref={sectionRef}
      id="closing-cta"
      aria-labelledby="closing-cta-title"
      className="border-t border-border py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          id="closing-cta-title"
          className={`scroll-reveal mx-auto whitespace-pre-line font-heading text-3xl font-bold leading-[1.15] tracking-[-0.025em] text-text-primary text-balance sm:text-4xl lg:text-5xl ${contentVisible ? "in-view" : ""}`}
        >
          {copy.title}
        </h2>

        <div
          className={`scroll-reveal mt-6 ${contentVisible ? "in-view" : ""}`}
          style={{ transitionDelay: contentVisible ? "150ms" : "0ms" }}
        >
          <Link
            href={`/auth?source=closing&lang=${lang}`}
            onClick={onClick}
            className="inline-block border-b-2 border-primary pb-0.5 font-heading text-lg font-semibold text-primary transition-opacity hover:opacity-70 sm:text-xl"
          >
            {copy.cta}
          </Link>
        </div>

        <p
          className={`scroll-reveal mt-6 font-mono text-xs text-text-muted ${contentVisible ? "in-view" : ""}`}
          style={{ transitionDelay: contentVisible ? "250ms" : "0ms" }}
        >
          {copy.reminder}
        </p>
      </div>
    </section>
  );
}
