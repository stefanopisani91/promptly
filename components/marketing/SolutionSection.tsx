"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["solution"];
}

function useReveal(threshold = 0.18) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

export function SolutionSection({ copy }: Props) {
  const [titleRef, titleVisible] = useReveal(0.3);
  const [listRef, listVisible] = useReveal(0.1);

  return (
    <section
      id="solution"
      aria-labelledby="solution-title"
      className="overflow-hidden bg-surface-muted py-16 sm:py-20 lg:py-24"
    >
      <div
        ref={titleRef as React.RefObject<HTMLDivElement>}
        className={`scroll-reveal mx-auto max-w-3xl px-4 text-center sm:px-6 ${titleVisible ? "in-view" : ""}`}
      >
        <h2
          id="solution-title"
          className="font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl"
        >
          {copy.title}
        </h2>
      </div>

      <ol
        ref={listRef as React.RefObject<HTMLOListElement>}
        className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-3 md:gap-8"
      >
        {copy.steps.map((step, idx) => (
          <li
            key={step.number}
            className={`scroll-reveal relative flex flex-col rounded-2xl border border-border bg-surface p-6 transition-shadow duration-200 hover:-translate-y-1 hover:shadow-lg ${listVisible ? "in-view" : ""}`}
            style={{ transitionDelay: listVisible ? `${idx * 110}ms` : "0ms" }}
          >
            <span
              className="absolute -top-3 left-6 rounded-full bg-text-primary px-2.5 py-0.5 text-xs font-bold text-white"
              aria-hidden
            >
              {step.number}
            </span>
            <Image
              src={`/brand/icon-path-${step.iconSlug}.svg`}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12"
              aria-hidden
            />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">
              {step.eyebrow}
            </p>
            <h3 className="mt-2 font-heading text-xl font-semibold text-text-primary">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {step.sub}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
