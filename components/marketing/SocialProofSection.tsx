"use client";

// "Inside Promptly" — replaces the previous social-proof placeholder. The
// brief was clear: never invent quotes. Until real testimonials land, the
// product itself is the proof — three cards, each a real moment from the
// app (lesson card-step, learning map, live Lucia demo).
//
// The screenshots live under /public/brand/preview-*.png. Until those PNGs
// are taken from the running app, this component renders a styled fallback
// (gradient + icon) per card so the layout is shippable today and the file
// drop-in is a one-line replacement when the screenshots are ready.

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Map as MapIcon, Sparkles, Wand2 } from "lucide-react";
import { track } from "@/lib/analytics/posthog";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["socialProof"];
}

// Image src + fallback icon per preview card. Order matches the copy array.
const PREVIEW_ASSETS = [
  {
    src: "/brand/preview-lesson.png",
    Icon: Sparkles,
    tone: "from-primary-light to-warning-light",
  },
  {
    src: "/brand/preview-map.png",
    Icon: MapIcon,
    tone: "from-success-light to-primary-light",
  },
  {
    src: "/brand/preview-demo.png",
    Icon: Wand2,
    tone: "from-pro-light to-primary-light",
  },
] as const;

export function SocialProofSection({ copy }: Props) {
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
            track({ name: "landing_socialproof_viewed" });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="social-proof"
      aria-labelledby="social-proof-title"
      className="bg-surface-muted py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">
          {copy.eyebrow}
        </p>
        <h2
          id="social-proof-title"
          className="mt-3 font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl"
        >
          {copy.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-text-secondary sm:text-lg">
          {copy.sub}
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 shadow-sm">
          <Sparkles
            className="h-4 w-4 text-primary"
            strokeWidth={2.5}
            aria-hidden
          />
          <span className="text-sm font-medium text-text-primary">
            {copy.counter}
          </span>
        </div>
      </div>

      {/* Mobile: horizontal scroll-snap. Desktop ≥md: 3-column grid. */}
      <div className="mx-auto mt-10 max-w-5xl">
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-6 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
          {copy.previews.map((preview, i) => {
            const asset = PREVIEW_ASSETS[i];
            return (
              <li
                key={preview.title}
                className="flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg md:w-auto"
              >
                {/* Screenshot frame — keeps a consistent 4:3 aspect even
                    when the PNG is missing (fallback gradient renders). */}
                <div
                  className={`relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br ${asset.tone}`}
                >
                  <Image
                    src={asset.src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 80vw"
                    className="object-cover"
                    onError={(e) => {
                      // If the PNG isn't on disk yet, hide the <img> and
                      // let the gradient + decorative icon stand alone.
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  {/* Decorative icon under the image — visible only when
                      the image fails to load (z-0 below the img). */}
                  <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                    <asset.Icon
                      className="h-12 w-12 text-primary/50"
                      strokeWidth={1.4}
                      aria-hidden
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-deep">
                    {preview.kicker}
                  </p>
                  <h3 className="mt-2 font-heading text-base font-bold leading-snug text-text-primary sm:text-lg">
                    {preview.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {preview.caption}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
