"use client";

import { useEffect, useRef } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics/posthog";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["socialProof"];
}

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
        <p className="mt-3 text-base text-text-secondary sm:text-lg">
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

      <div className="mx-auto mt-10 max-w-2xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/60 p-8 text-center sm:p-10">
          <MessageCircle
            className="h-8 w-8 text-text-muted"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-sm text-text-muted sm:text-base">
            {copy.placeholder}
          </p>
        </div>
      </div>
    </section>
  );
}
