"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || viewedRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            track({ name: "landing_closing_cta_viewed" });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.5 },
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
          className="font-heading text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl"
        >
          {copy.title}
        </h2>
        <p className="mt-4 text-base text-white/85 sm:text-lg">{copy.sub}</p>

        <Link
          href={`/auth?source=closing&lang=${lang}`}
          onClick={onClick}
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-7 py-3.5 text-base font-semibold text-primary-deep shadow-lg shadow-primary-deep/20 transition-transform duration-150 hover:scale-[1.02] hover:bg-white/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-lg"
        >
          {copy.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="mt-5 text-sm text-white/75">{copy.reminder}</p>
      </div>
    </section>
  );
}
