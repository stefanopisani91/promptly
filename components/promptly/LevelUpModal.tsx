"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { fireLevelUpConfetti } from "@/lib/confetti";
import { getLevelInfo } from "@/lib/levels";
import { getLevelsCopy } from "@/lib/i18n/levels";
import { markLevelUpNotified } from "@/app/(app)/dashboard/actions";
import type { Lang } from "@/types";

import { RobotAvatar } from "./RobotAvatar";

interface Props {
  fromLevel: number;
  toLevel: number;
  language: Lang;
}

export function LevelUpModal({ fromLevel, toLevel, language }: Props) {
  const [open, setOpen] = useState(toLevel > fromLevel);
  const [, startTransition] = useTransition();
  const claimed = useRef(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const info = getLevelInfo(toLevel);
  const copy = getLevelsCopy(language);
  const title = language === "it" ? info.title_it : info.title_en;

  // Mark the level-up as seen on mount. We claim the event eagerly (instead
  // of waiting for the user to click close) so a refresh before dismissal
  // doesn't re-trigger the modal. `claimed` guards against React 18 strict
  // mode double-invoking the effect.
  useEffect(() => {
    if (!open || claimed.current) return;
    claimed.current = true;
    startTransition(() => {
      void markLevelUpNotified(toLevel);
    });
  }, [open, toLevel]);

  // Confetti + focus on mount.
  useEffect(() => {
    if (!open) return;
    fireLevelUpConfetti();
    closeBtnRef.current?.focus();
  }, [open]);

  // Escape closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center shadow-2xl">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label={copy.levelUp.closeAria}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </button>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          {copy.levelUp.eyebrow}
        </p>

        <div className="mt-5 flex justify-center">
          <RobotAvatar level={info.level} size="lg" ariaLabel={info.robot_name} />
        </div>

        <h2
          id="level-up-title"
          className="mt-5 font-heading text-2xl font-bold leading-tight text-text-primary"
        >
          {copy.levelUp.title(title)}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {copy.levelUp.sub(info.robot_name)}
        </p>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 font-heading text-sm font-bold text-surface transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-deep"
        >
          {copy.levelUp.cta}
        </button>
      </div>
    </div>
  );
}
