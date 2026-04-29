"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import type { Lang } from "@/types";
import type { LandingCopy } from "@/lib/i18n/landing";
import { track } from "@/lib/analytics/posthog";
import { HeroMockup } from "./HeroMockup";

interface Props {
  copy: LandingCopy["hero"];
  lang: Lang;
}

export function HeroSection({ copy, lang }: Props) {
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
            track({ name: "landing_hero_viewed" });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const onPrimary = () =>
    track({ name: "landing_hero_cta_clicked", props: { cta: "primary" } });
  const onSecondary = () =>
    track({ name: "landing_hero_cta_clicked", props: { cta: "secondary" } });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-headline"
      className="relative overflow-hidden"
    >
      {/* Soft brand-tinted backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary-light/60 via-background to-background"
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-12">
          {/* Text — 60% (3/5) */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">
              {copy.eyebrow}
            </p>
            <h1
              id="hero-headline"
              className="mt-4 whitespace-pre-line font-heading text-4xl font-bold leading-[1.05] text-text-primary text-balance sm:text-5xl lg:text-6xl"
            >
              {copy.headline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              {copy.sub}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={`/auth?source=hero_primary&lang=${lang}`}
                onClick={onPrimary}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
              >
                {copy.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#exercise-demo"
                onClick={onSecondary}
                className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-6 py-3 text-base font-medium text-text-primary transition-colors hover:border-primary hover:text-primary-deep"
              >
                {copy.ctaSecondary}
              </a>
            </div>

            <p className="mt-5 text-sm text-text-muted">{copy.reminder}</p>
          </div>

          {/* Mockup — 40% (2/5) */}
          <div className="lg:col-span-2">
            <HeroMockup copy={copy.mockup} />
          </div>
        </div>
      </div>
    </section>
  );
}
