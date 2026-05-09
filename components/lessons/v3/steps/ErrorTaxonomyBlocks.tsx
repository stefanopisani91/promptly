"use client";

// ERROR_TAXONOMY step — Lesson 5 step 8 (Lezione5_Blueprint.md §step 8).
//
// Renders 4 cause→cure pairs. Each pair has:
//   - LEFT card: error type (icon + title + description) on neutral surface
//   - RIGHT card: cure (cure_title + cure_reference) on a kind-coloured
//     surface (orange for context-cured, amber for constraints-cured)
//   - between them: an arrow that "draws" itself once both cards are in
//
// The 4 pairs reveal sequentially with fade-in + slide-up at 0ms / 800ms
// / 1600ms / 2400ms. The closing caption fades in at 3500ms — see the
// blueprint for the exact timing. `prefers-reduced-motion: reduce` skips
// the staggered reveal and shows everything at t=0 with no transition,
// matching the codebase convention.

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { ErrorTaxonomyStep as ErrorTaxonomyStepType } from "@/types";
import { StepCard } from "../StepCard";

interface Props {
  step: ErrorTaxonomyStepType;
}

const REVEAL_DELAYS_MS = [0, 800, 1600, 2400];
const CAPTION_DELAY_MS = 3500;

export function ErrorTaxonomyBlocks({ step }: Props) {
  const reduced = usePrefersReducedMotion();
  // Total reveal count: 4 pairs + the closing caption. We keep a single
  // counter that advances on each timer tick — this avoids creating one
  // useState per pair and makes the "all visible immediately" path for
  // reduced-motion users a single check.
  const total = step.pairs.length + 1;
  const [revealedUntil, setRevealedUntil] = useState(reduced ? total : 0);

  useEffect(() => {
    if (reduced) {
      setRevealedUntil(total);
      return;
    }
    const timers: number[] = [];
    step.pairs.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          setRevealedUntil((n) => Math.max(n, i + 1));
        }, REVEAL_DELAYS_MS[i] ?? i * 800),
      );
    });
    timers.push(
      window.setTimeout(() => {
        setRevealedUntil((n) => Math.max(n, total));
      }, CAPTION_DELAY_MS),
    );
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [reduced, step.pairs, total]);

  return (
    <StepCard wide>
      <div className="flex flex-col gap-6">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {step.pairs.map((pair, i) => {
            const visible = revealedUntil > i;
            return (
              <div
                key={pair.key}
                className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(8px)",
                  transition: reduced
                    ? undefined
                    : "opacity 0.55s ease-out, transform 0.55s ease-out",
                }}
                aria-hidden={!visible}
              >
                {/* LEFT — error card */}
                <div className="flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none" aria-hidden="true">
                      {pair.icon}
                    </span>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-primary">
                      {pair.title}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {pair.description}
                  </p>
                </div>

                {/* ARROW — vertical on phone, horizontal on tablet+ */}
                <div className="flex items-center justify-center text-text-muted">
                  <ArrowRight
                    size={22}
                    className="hidden sm:block"
                    aria-hidden="true"
                    style={{
                      opacity: visible ? 0.7 : 0,
                      transition: reduced ? undefined : "opacity 0.4s ease-out 0.2s",
                    }}
                  />
                  <ArrowRight
                    size={20}
                    className="block rotate-90 sm:hidden"
                    aria-hidden="true"
                    style={{
                      opacity: visible ? 0.7 : 0,
                      transition: reduced ? undefined : "opacity 0.4s ease-out 0.2s",
                    }}
                  />
                </div>

                {/* RIGHT — cure card. Colour family swaps on `mapping`. */}
                <div
                  className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 ${
                    pair.mapping === "context"
                      ? "border-orange-200 bg-orange-50"
                      : "border-amber-300 bg-amber-50"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      pair.mapping === "context"
                        ? "text-orange-900"
                        : "text-amber-900"
                    }`}
                  >
                    {pair.cure_title}
                  </p>
                  <p
                    className={`font-mono text-[11px] uppercase tracking-wider ${
                      pair.mapping === "context"
                        ? "text-orange-700/80"
                        : "text-amber-700/80"
                    }`}
                  >
                    {pair.cure_reference}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing caption — Spark's voice. Italic to match other text
            cards, fades in last. */}
        <p
          className="text-base italic leading-relaxed text-text-primary sm:text-lg"
          style={{
            opacity: revealedUntil >= total ? 1 : 0,
            transform:
              revealedUntil >= total ? "translateY(0)" : "translateY(6px)",
            transition: reduced
              ? undefined
              : "opacity 0.55s ease-out, transform 0.55s ease-out",
          }}
        >
          {step.closing_caption}
        </p>
      </div>
    </StepCard>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
