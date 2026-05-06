"use client";

// Visual wrapper around a step. Centres the content, slides it in on mount
// (direction-aware: forward slides from the right, back slides from the left),
// and provides the consistent card/typography baseline used by every step type.
// The NavDirection is provided by LessonV3View via LessonDirectionContext so
// individual step renderers don't need to thread the prop manually.

import type { ReactNode } from "react";
import { useLessonDirection } from "./LessonDirectionContext";

interface Props {
  children: ReactNode;
  variant?: "default" | "principle" | "reward";
}

export function StepCard({ children, variant = "default" }: Props) {
  const direction = useLessonDirection();

  const tone =
    variant === "principle"
      ? "border-primary/30 bg-primary-light/40"
      : variant === "reward"
      ? "border-success/30 bg-success-light"
      : "border-border bg-surface";

  const slideClass =
    direction === "back" ? "step-slide-back" : "step-slide-fwd";

  return (
    <div
      className={`${slideClass} mx-auto w-full max-w-2xl rounded-3xl border ${tone} p-6 sm:p-10`}
    >
      {children}
    </div>
  );
}
