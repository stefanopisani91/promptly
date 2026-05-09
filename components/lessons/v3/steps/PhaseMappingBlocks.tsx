"use client";

// PHASE_MAPPING step — Lesson 6 step 8 (Lezione6_Blueprint §step 8).
//
// Hierarchical phase → lessons map. Renders:
//   - optional banner ("IL WORKFLOW")
//   - 4 phase rows revealed in sequence (one every 600ms)
//   - the closing Spark line that fades in after the last phase
//
// Each phase has a coloured number badge (matching its purpose:
// blue = setup, orange = context, amber = execution, emerald =
// verification) and a list of lesson references. Lesson refs marked
// `emphasised` get an inline orange highlight — used to underline
// the counter-intuitive "constraints BEFORE task" insight on the
// EXECUTION row.
//
// Pure presentation, no user input. `prefers-reduced-motion: reduce`
// skips the staggered reveal entirely.

import { useEffect, useState } from "react";
import type { PhaseMappingStep as PhaseMappingStepType } from "@/types";
import { StepCard } from "../StepCard";

interface Props {
  step: PhaseMappingStepType;
}

const PHASE_REVEAL_DELAYS_MS = [0, 600, 1200, 1800];
const CLOSING_DELAY_MS = 2400;

const PHASE_PALETTE = {
  setup: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    badgeBg: "bg-sky-500",
    badgeText: "text-white",
    title: "text-sky-900",
  },
  context: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    badgeBg: "bg-orange-500",
    badgeText: "text-white",
    title: "text-orange-900",
  },
  execution: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    title: "text-amber-900",
  },
  verification: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    title: "text-emerald-900",
  },
} as const;

export function PhaseMappingBlocks({ step }: Props) {
  const reduced = usePrefersReducedMotion();
  const total = step.phases.length + 1;
  const [revealedUntil, setRevealedUntil] = useState(reduced ? total : 0);

  useEffect(() => {
    if (reduced) {
      setRevealedUntil(total);
      return;
    }
    const timers: number[] = [];
    step.phases.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          setRevealedUntil((n) => Math.max(n, i + 1));
        }, PHASE_REVEAL_DELAYS_MS[i] ?? i * 600),
      );
    });
    timers.push(
      window.setTimeout(() => {
        setRevealedUntil((n) => Math.max(n, total));
      }, CLOSING_DELAY_MS),
    );
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [reduced, step.phases, total]);

  return (
    <StepCard wide>
      <div className="flex flex-col gap-6">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}

        {step.banner && (
          <div className="flex items-center justify-center">
            <span className="rounded-full bg-text-primary px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              {step.banner}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {step.phases.map((phase, i) => {
            const visible = revealedUntil > i;
            const palette = PHASE_PALETTE[phase.key];
            return (
              <div
                key={phase.key}
                className={`flex flex-col gap-2 rounded-2xl border-2 px-4 py-3 sm:px-5 sm:py-4 ${palette.bg} ${palette.border}`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(8px)",
                  transition: reduced
                    ? undefined
                    : "opacity 0.55s ease-out, transform 0.55s ease-out",
                }}
                aria-hidden={!visible}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${palette.badgeBg} ${palette.badgeText}`}
                    aria-hidden="true"
                  >
                    {phase.number}
                  </span>
                  <span className="text-base leading-none" aria-hidden="true">
                    {phase.icon}
                  </span>
                  <span
                    className={`font-mono text-sm font-bold uppercase tracking-wider sm:text-base ${palette.title}`}
                  >
                    {phase.title}
                  </span>
                </div>
                <ul className="ml-10 flex flex-col gap-1">
                  {phase.lessons.map((lesson, j) => (
                    <li
                      key={j}
                      className={`text-sm leading-relaxed sm:text-[15px] ${
                        lesson.emphasised
                          ? "rounded-md bg-orange-100/80 px-2 py-1 font-semibold text-orange-900"
                          : "text-text-secondary"
                      }`}
                    >
                      <span
                        className="mr-1.5 text-text-muted"
                        aria-hidden="true"
                      >
                        ▸
                      </span>
                      {lesson.label}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

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
