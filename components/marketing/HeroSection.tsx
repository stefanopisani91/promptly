"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import type { Lang } from "@/types";
import type { LandingCopy } from "@/lib/i18n/landing";
import { track } from "@/lib/analytics/posthog";
import { IphoneCarousel } from "./IphoneCarousel";

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
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          {/* TEXT */}
          <div>
            <p
              className="hero-item inline-flex items-center gap-2 font-mono text-xs font-medium tracking-[0.02em] text-text-muted"
              style={{ animationDelay: "0ms" }}
            >
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
              />
              {copy.eyebrow}
            </p>

            <h1
              id="hero-headline"
              className="hero-item mt-4 font-heading text-4xl font-bold leading-[1.04] tracking-[-0.035em] text-text-primary text-balance sm:text-5xl lg:text-[68px] lg:leading-[1.02]"
              style={{ animationDelay: "80ms" }}
            >
              {copy.headline}
              {copy.headlineHighlight ? (
                <>
                  {" "}
                  <em
                    className="not-italic"
                    style={{
                      backgroundImage:
                        "linear-gradient(transparent 60%, rgba(232,112,63,0.18) 60%)",
                    }}
                  >
                    {copy.headlineHighlight}
                  </em>
                </>
              ) : null}
            </h1>

            <p
              className="hero-item mt-5 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg lg:text-xl"
              style={{ animationDelay: "200ms" }}
            >
              {copy.sub}
            </p>

            <div
              className="hero-item mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "320ms" }}
            >
              <Link
                href={`/auth?source=hero_primary&lang=${lang}`}
                onClick={onPrimary}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-150 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
              >
                {copy.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#prompt-evaluator"
                onClick={onSecondary}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 text-base font-medium text-text-primary transition-all duration-150 hover:border-text-muted hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
              >
                {copy.ctaSecondary}
              </a>
            </div>

            <p
              className="hero-item mt-5 font-mono text-sm text-text-muted"
              style={{ animationDelay: "440ms" }}
            >
              {copy.reminder}
            </p>
          </div>

          {/* iPhone con carosello — sostituisce il vecchio HeroMockup */}
          <div className="hero-mockup-wrap">
            <IphoneCarousel
              slides={copy.carousel.slides}
              ariaLabel={copy.carousel.ariaLabel}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
