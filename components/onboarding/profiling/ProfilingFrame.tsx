"use client";

// Layout shell shared by every step of the new onboarding flow. Slots
// inside the (auth) layout's chrome — the brand logo + lang switcher
// already live in app/(auth)/layout.tsx, so the frame here only provides
// the thin step counter + back arrow strip and the Spark/content split.
//
// Desktop: Spark sits in the left rail (~30% width, ~200px). Mobile:
// Spark shrinks to ~84px and stacks above the content. Step transitions
// use a single CSS keyframe driven by the `direction` prop so the slide
// re-fires on every remount.

import type { CSSProperties, ReactNode } from "react";
import { SparkSphere } from "@/components/promptly/SparkSphere";
import type { SparkState } from "@/types";
import type { StepDirection } from "./types";

interface Props {
  step: number;
  totalSteps: number;
  sparkState: SparkState;
  direction: StepDirection;
  onBack?: () => void;
  backLabel: string;
  progressLabel: string;
  // Stable key per step — used to remount content on transitions so the
  // CSS animation re-fires.
  contentKey: string;
  children: ReactNode;
}

export function ProfilingFrame({
  sparkState,
  direction,
  onBack,
  backLabel,
  progressLabel,
  contentKey,
  children,
}: Props) {
  return (
    <main className="flex flex-1 flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between pb-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="-ml-2 inline-flex h-9 items-center gap-2 rounded-full px-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        ) : (
          <span className="h-9 w-9" aria-hidden="true" />
        )}
        <p
          aria-live="polite"
          className="text-xs font-semibold tracking-[0.18em] text-text-muted sm:text-sm"
        >
          {progressLabel.toUpperCase()}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 lg:flex-row lg:gap-10">
        <aside className="flex shrink-0 flex-col items-center justify-start lg:w-72 lg:items-start lg:pt-6">
          <div
            className="relative flex items-center justify-center"
            style={
              {
                width: "var(--spark-size, 96px)",
                height: "var(--spark-size, 96px)",
              } as CSSProperties
            }
          >
            <span
              aria-hidden="true"
              className="absolute inset-[-22%] rounded-full bg-primary-light/40 blur-2xl"
            />
            <SparkResponsive state={sparkState} />
          </div>
          <p className="mt-4 hidden text-center text-xs uppercase tracking-[0.2em] text-text-muted lg:block">
            Spark
          </p>
        </aside>

        <section
          key={contentKey}
          data-direction={direction}
          className="profiling-step flex flex-1 flex-col"
        >
          {children}
        </section>
      </div>

      <style jsx>{`
        .profiling-step {
          animation: profiling-in-forward 320ms cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }
        .profiling-step[data-direction="backward"] {
          animation-name: profiling-in-backward;
        }
        @keyframes profiling-in-forward {
          0% {
            opacity: 0;
            transform: translate3d(24px, 0, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes profiling-in-backward {
          0% {
            opacity: 0;
            transform: translate3d(-24px, 0, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .profiling-step {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

// Spark renders at a different pixel size on mobile vs desktop. Wrapping it
// here so each step doesn't have to repeat the breakpoint logic.
function SparkResponsive({ state }: { state: SparkState }) {
  return (
    <>
      <span className="lg:hidden">
        <SparkSphere state={state} size={84} ariaLabel="Spark" />
      </span>
      <span className="hidden lg:inline-flex">
        <SparkSphere state={state} size={200} ariaLabel="Spark" />
      </span>
    </>
  );
}
