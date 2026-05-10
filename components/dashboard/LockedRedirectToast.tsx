"use client";

// Toast shown on /dashboard when the server redirected the user from a
// locked path's lesson route (`?locked=path2`). Auto-dismisses after 5s
// and strips the search-param from the URL on first paint so a refresh
// doesn't re-trigger it.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, X } from "lucide-react";

interface Props {
  message: string;
  dismissLabel: string;
  durationMs?: number;
}

export function LockedRedirectToast({
  message,
  dismissLabel,
  durationMs = 5500,
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const enter = window.setTimeout(() => setMounted(true), 30);
    const leave = window.setTimeout(() => setHidden(true), durationMs);
    // Strip the ?locked= param after a couple of seconds so a refresh
    // doesn't show the toast again. We use replaceState directly to
    // avoid Next.js re-rendering and re-mounting this component.
    const cleanUrl = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("locked");
      window.history.replaceState({}, "", url.toString());
    }, 2000);
    return () => {
      window.clearTimeout(enter);
      window.clearTimeout(leave);
      window.clearTimeout(cleanUrl);
    };
  }, [durationMs, router]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 motion-safe:transition-all motion-safe:duration-300 ${
        mounted && !hidden
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 motion-reduce:translate-y-0"
      }`}
    >
      <div className="pointer-events-auto flex max-w-[90vw] items-center gap-3 rounded-full border border-primary/30 bg-surface px-4 py-2.5 shadow-lg shadow-primary/10">
        <Clock className="h-4 w-4 shrink-0 text-primary-deep" aria-hidden />
        <span className="text-sm font-medium text-text-primary">
          {message}
        </span>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label={dismissLabel}
          className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </div>
  );
}
