"use client";

// Visual wrapper around a step. Centres the content, fades it in on mount,
// and provides the consistent card/typography baseline used by every step
// type. Each step renderer composes its own children inside this card.

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  variant?: "default" | "principle" | "reward";
}

export function StepCard({ children, variant = "default" }: Props) {
  const tone =
    variant === "principle"
      ? "border-primary/30 bg-primary-light/40"
      : variant === "reward"
      ? "border-success/30 bg-success-light"
      : "border-border bg-surface";

  return (
    <div
      className={`step-card mx-auto w-full max-w-2xl rounded-3xl border ${tone} p-6 sm:p-10`}
      style={{ animation: "step-fade-in 280ms ease-out" }}
    >
      {children}
      <style jsx>{`
        @keyframes step-fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .step-card {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
