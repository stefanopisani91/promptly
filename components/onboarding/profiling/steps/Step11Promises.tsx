"use client";

import { useEffect, useState } from "react";
import type { ProfilePromises } from "@/types";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { SparkSphere } from "@/components/promptly/SparkSphere";
import { cn } from "@/lib/utils";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine } from "../SparkLine";

interface Props {
  copy: ProfilingCopy["step11"];
  loading: boolean;
  promises: ProfilePromises | null;
  pending: boolean;
  onAdvance: () => void;
}

export function Step11Promises({
  copy,
  loading,
  promises,
  pending,
  onAdvance,
}: Props) {
  // Reveal each promise with a small stagger so the moment feels alive.
  // 0 = nothing yet, then 1 → 2 → 3 every ~1.4s after the data arrives.
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!promises) {
      setRevealed(0);
      return;
    }
    setRevealed(1);
    const t2 = setTimeout(() => setRevealed(2), 1200);
    const t3 = setTimeout(() => setRevealed(3), 2400);
    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [promises]);

  if (loading || !promises) {
    return (
      <div className="flex flex-1 flex-col items-start gap-6">
        <SparkLine emphasis="lead">{copy.loading}</SparkLine>
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
        </div>
      </div>
    );
  }

  const cards = [
    promises.promise_1,
    promises.promise_2,
    promises.promise_3,
  ];

  return (
    <div className="flex flex-col gap-6">
      <SparkLine emphasis="lead">{copy.sparkIntro}</SparkLine>

      <ol className="flex flex-col gap-4">
        {cards.map((text, idx) => {
          const visible = revealed > idx;
          return (
            <li
              key={idx}
              className={cn(
                "flex items-start gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm transition-all duration-500",
                visible
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0",
              )}
              aria-hidden={!visible}
            >
              <span className="shrink-0 pt-0.5">
                <SparkSphere state="happy" size={36} />
              </span>
              <span className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                  {copy.promiseLabel(idx + 1)}
                </span>
                <span className="text-base leading-relaxed text-text-primary sm:text-lg">
                  {text}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div>
        <PrimaryCta
          onClick={onAdvance}
          pending={pending}
          disabled={revealed < 3}
        >
          {copy.cta}
        </PrimaryCta>
      </div>
    </div>
  );
}
