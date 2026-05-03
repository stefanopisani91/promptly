"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

interface Props {
  label: string;
  dismissLabel: string;
  durationMs?: number;
  onDismiss?: () => void;
}

export function XpToast({ label, dismissLabel, durationMs = 4500, onDismiss }: Props) {
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const enter = window.setTimeout(() => setMounted(true), 30);
    const leave = window.setTimeout(() => setHidden(true), durationMs);
    const remove = window.setTimeout(() => onDismiss?.(), durationMs + 400);
    return () => {
      window.clearTimeout(enter);
      window.clearTimeout(leave);
      window.clearTimeout(remove);
    };
  }, [durationMs, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-6 right-4 z-50 motion-safe:transition-all motion-safe:duration-300 sm:right-6 ${
        mounted && !hidden
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 motion-reduce:translate-y-0"
      }`}
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-xp-gold/40 bg-surface px-4 py-2.5 shadow-lg shadow-xp-gold/10">
        <Sparkles className="h-4 w-4 text-xp-gold" aria-hidden />
        <span className="font-mono text-sm font-semibold text-text-primary">
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            window.setTimeout(() => onDismiss?.(), 300);
          }}
          aria-label={dismissLabel}
          className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </div>
  );
}
