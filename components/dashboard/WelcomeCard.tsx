"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { dismissWelcome } from "@/app/(app)/dashboard/actions";

interface Props {
  title: string;
  sub: string;
  cta: string;
  submitting: string;
}

export function WelcomeCard({ title, sub, cta, submitting }: Props) {
  const [hidden, setHidden] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (pending) return;
    setHidden(true);
    startTransition(async () => {
      const result = await dismissWelcome();
      if (!result.ok) {
        // Roll back the optimistic dismissal so the user can retry.
        setHidden(false);
      }
    });
  }

  if (hidden) return null;

  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      aria-live="polite"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="font-heading text-xl font-semibold text-text-primary">
          {title}
        </h2>
        <p className="text-sm text-text-secondary">{sub}</p>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={cn(
          "self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:self-auto",
          pending && "cursor-not-allowed opacity-60",
        )}
      >
        {pending ? submitting : cta}
      </button>
    </section>
  );
}
