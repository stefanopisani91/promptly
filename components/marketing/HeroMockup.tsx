"use client";

// Hero mockup — V3 lesson scene preview. The visitor sees what the
// authenticated product actually looks like: Spark in the header (her brand
// signature), a PRINCIPLE step card in the center, two thought-bubble chips
// floating around the card, and a self-pulsing XP toast in the corner.
//
// Mobile-first: on narrow screens the scene stacks tighter, chips collapse
// onto a single row, and the browser chrome shrinks. The whole mockup is
// purely decorative — no interactivity, no live data — so it stays light
// and renders in <2KB of additional client JS.

import { Spark } from "@/components/lessons/v3/Spark";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["hero"]["mockup"];
}

export function HeroMockup({ copy }: Props) {
  const cardTitleLines = copy.cardTitle.split("\n");

  return (
    <div
      role="img"
      aria-label={`${copy.lessonStep}: ${copy.lessonTitle}`}
      className="relative mx-auto w-full max-w-md overflow-visible rounded-xl border border-border bg-surface shadow-2xl shadow-primary/10"
    >
      {/* Mac-style top bar */}
      <div className="flex items-center gap-2 rounded-t-xl border-b border-border bg-surface-muted px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-macos-red" />
        <span className="h-2.5 w-2.5 rounded-full bg-macos-yellow" />
        <span className="h-2.5 w-2.5 rounded-full bg-macos-green" />
        <div className="ml-3 flex-1 truncate rounded-md bg-surface px-2 py-1 text-center text-[10px] text-text-muted">
          {copy.url}
        </div>
      </div>

      {/* Scene */}
      <div className="relative overflow-hidden rounded-b-xl">
        {/* Lesson header — Spark sits on the right, like in real V3 */}
        <div className="flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-5">
          <div className="flex flex-1 flex-col">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary-deep">
              {copy.lessonStep}
            </p>
            <h3 className="mt-0.5 truncate font-heading text-[13px] font-bold text-text-primary sm:text-sm">
              {copy.lessonTitle}
            </h3>
          </div>
          <Spark state="idle" size={72} ariaLabel={copy.sparkLabel} />
        </div>

        {/* Card body — PRINCIPLE step style */}
        <div className="relative px-4 py-6 sm:px-6 sm:py-7">
          {/* Chip 1 — top-left of card, accenno orbita */}
          <div
            aria-hidden
            className="absolute left-2 top-2 hidden max-w-[150px] rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] italic text-text-secondary shadow-sm sm:block"
          >
            {copy.chip1}
          </div>
          {/* Chip 2 — bottom-right */}
          <div
            aria-hidden
            className="absolute bottom-2 right-2 hidden max-w-[150px] rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] italic text-text-secondary shadow-sm sm:block"
          >
            {copy.chip2}
          </div>

          <div className="mx-auto max-w-sm rounded-xl border border-border bg-surface px-4 py-5 text-center shadow-sm sm:px-5 sm:py-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
              {copy.cardEyebrow}
            </p>
            <h4 className="mt-2 font-heading text-base font-bold leading-tight text-text-primary sm:text-lg">
              {cardTitleLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h4>
            <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
              {copy.cardBody}
            </p>
          </div>

          {/* Mobile-only: chips inline below card so they don't overlap on small screens */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:hidden">
            <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] italic text-text-secondary shadow-sm">
              {copy.chip1}
            </span>
            <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] italic text-text-secondary shadow-sm">
              {copy.chip2}
            </span>
          </div>
        </div>

        {/* XP toast — animated */}
        <div className="pointer-events-none absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
          <div className="animate-xp-toast inline-flex items-center gap-1.5 rounded-full bg-text-primary px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            <span className="text-xp-gold" aria-hidden>
              ⚡
            </span>
            {copy.xpToast}
          </div>
        </div>
      </div>
    </div>
  );
}
