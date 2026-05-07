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
  // Opt-in width override. The default `max-w-2xl` (672px) is right for
  // text-heavy steps; the INTERACTIVE step (Lucia prompt loop) needs the
  // wider container to match the landing demo's `max-w-5xl` so its
  // homepage + console panels keep their natural proportions in a
  // side-by-side grid instead of getting compressed.
  wide?: boolean;
}

export function StepCard({ children, variant = "default", wide = false }: Props) {
  const direction = useLessonDirection();

  const tone =
    variant === "principle"
      // White surface + neutral border + small shadow, matching the
      // landing's principle-style card (HeroMockup). The PRINCIPLE step's
      // identity comes from its typography (big heading, primary-deep
      // emphasis line) and pop-in animation, not from the card chrome.
      ? "border-border bg-surface shadow-sm"
      : variant === "reward"
      ? "border-success/30 bg-success-light"
      : "border-border bg-surface";

  const slideClass =
    direction === "back" ? "step-slide-back" : "step-slide-fwd";

  const widthClass = wide ? "max-w-5xl" : "max-w-2xl";

  return (
    <div
      className={`${slideClass} mx-auto w-full ${widthClass} rounded-3xl border ${tone} p-6 sm:p-10`}
    >
      {children}
    </div>
  );
}
