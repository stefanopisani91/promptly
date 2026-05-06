"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics/posthog";
import type { Lang } from "@/types";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["closingCta"];
  lang: Lang;
}

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
      className="relative overflow-hidden bg-primary text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-primary-hover/40 via-transparent to-primary-deep/30"
      />

      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:py-28">
        <h2
          id="closing-cta-title"
          className={`scroll-reveal font-heading text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl ${contentVisible ? "in-view" : ""}`}
        >
          {copy.title}
        </h2>
        <p
          className={`scroll-reveal mt-4 text-base text-white/85 sm:text-lg ${contentVisible ? "in-view" : ""}`}
          style={{ transitionDelay: contentVisible ? "100ms" : "0ms" }}
        >
          {copy.sub}
        </p>

        <div
          className={`scroll-reveal mt-8 ${contentVisible ? "in-view" : ""}`}
          style={{ transitionDelay: contentVisible ? "200ms" : "0ms" }}
        >
          <Link
            href={`/auth?source=closing&lang=${lang}`}
            onClick={onClick}
            className="animate-cta-ring inline-flex items-center gap-2 rounded-md bg-white px-7 py-3.5 text-base font-semibold text-primary-deep shadow-lg shadow-primary-deep/20 transition-all duration-150 hover:scale-[1.03] hover:bg-white/95 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-lg"
          >
            {copy.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p
          className={`scroll-reveal mt-5 text-sm text-white/75 ${contentVisible ? "in-view" : ""}`}
          style={{ transitionDelay: contentVisible ? "300ms" : "0ms" }}
        >
          {copy.reminder}
        </p>
      </div>
    </section>
  );
}
