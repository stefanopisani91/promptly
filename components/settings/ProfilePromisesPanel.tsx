"use client";

// Settings panel that shows the user's three promises and lets them ask
// Spark for a fresh AI pass. The "regenerate" action calls the existing
// onboarding server action — no new HTTP route. We only ever call it on
// explicit click (per Profilazione.md §"Modificabilità del profilo": "Le
// promesse si rigenerano solo se l'utente clicca esplicitamente").

import { useState, useTransition } from "react";
import type { ProfilePromises } from "@/types";
import { Spark } from "@/components/lessons/v3/Spark";
import { regeneratePromisesFromProfile } from "@/app/(auth)/onboarding/actions";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  copy: {
    heading: string;
    lead: string;
    fallbackBadge: string;
    regenerate: string;
    regenerating: string;
    regenerated: string;
    regenerateError: string;
    // Anti-abuse messages — surfaced when the server action rejects the
    // call before reaching Anthropic. Static strings so they cross the
    // server→client boundary cleanly.
    cooldownMessage: string;
    dailyCapMessage: string;
    // Pre-computed labels for the 3 promises. Server components can't ship
    // functions across the boundary, so the parent calls
    // profiling.step11.promiseLabel(1..3) and passes the resulting strings.
    promiseLabels: readonly [string, string, string];
  };
  initialPromises: ProfilePromises | null;
}

export function ProfilePromisesPanel({ id, copy, initialPromises }: Props) {
  const [promises, setPromises] = useState<ProfilePromises | null>(initialPromises);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | { kind: "success"; message: string }
    | { kind: "warning"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  function regenerate() {
    if (pending) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await regeneratePromisesFromProfile();
      if (res.ok) {
        setPromises(res.promises);
        setFeedback({ kind: "success", message: copy.regenerated });
        return;
      }
      // Map the discriminated error union to a user-facing message. The
      // cooldown / daily_cap branches are styled as warnings (not full
      // errors) since they're expected behavior, not failures.
      if (res.error === "cooldown") {
        setFeedback({ kind: "warning", message: copy.cooldownMessage });
        return;
      }
      if (res.error === "daily_cap") {
        setFeedback({ kind: "warning", message: copy.dailyCapMessage });
        return;
      }
      setFeedback({ kind: "error", message: copy.regenerateError });
    });
  }

  return (
    <section
      id={id}
      className="rounded-2xl border border-border bg-surface px-6 py-6 shadow-sm"
    >
      <header className="mb-4 flex flex-col gap-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
          {copy.heading}
        </h2>
        <p className="text-sm text-text-secondary">{copy.lead}</p>
      </header>

      {promises ? (
        <ol className="flex flex-col gap-3">
          {[promises.promise_1, promises.promise_2, promises.promise_3].map(
            (text, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <span className="shrink-0 pt-0.5">
                  <Spark state="happy" size={28} />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                    {copy.promiseLabels[idx]}
                  </span>
                  <span className="text-sm leading-relaxed text-text-primary">
                    {text}
                  </span>
                </span>
              </li>
            ),
          )}
        </ol>
      ) : null}

      {promises?.source === "fallback" ? (
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-warning">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
          {copy.fallbackBadge}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={regenerate}
          disabled={pending}
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white",
            pending && "cursor-not-allowed opacity-60",
          )}
        >
          {pending ? copy.regenerating : copy.regenerate}
        </button>
        {feedback ? (
          <p
            role="status"
            className={cn(
              "text-sm",
              feedback.kind === "success" && "text-success",
              feedback.kind === "warning" && "text-warning",
              feedback.kind === "error" && "text-error",
            )}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
