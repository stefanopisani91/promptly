"use client";

// Dashboard companion card. Replaces the previous Community card (which
// was hard-coded in Italian and linked to a non-existent /community route).
//
// The card is Spark's home outside the lesson view: she greets the user
// based on the time of day, and rotates between two contextual nudges
// (resume the lesson / invite a friend). The CTA on the card mirrors the
// dominant nudge so the card is always actionable, never decorative.
//
// Voice rules from PROMPTLY.md: dry, warm, first person, no emoticons.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Spark } from "@/components/lessons/v3/Spark";
import { useReferralModal } from "@/components/promptly/ReferralModalProvider";
import type { AuthCopy } from "@/lib/i18n/auth";

type Variant = "continue" | "invite" | "start";

interface Props {
  copy: AuthCopy["dashboard"]["sparkCompanion"];
  name: string;
  /** href of the user's active lesson, if any. */
  continueHref: string | null;
  /** Whether the user has an active lesson to resume. */
  hasContinue: boolean;
}

function pickGreet(
  name: string,
  greet: AuthCopy["dashboard"]["sparkCompanion"]["bubble"],
): string {
  const h = new Date().getHours();
  if (h < 12) return greet.greetMorning(name);
  if (h >= 18) return greet.greetEvening(name);
  return greet.greetGeneric(name);
}

export function SparkCompanionCard({
  copy,
  name,
  continueHref,
  hasContinue,
}: Props) {
  const { open: openReferral } = useReferralModal();
  // Pick the variant once on mount so it doesn't flip during a session.
  // Even split between "continue" and "invite" when both are possible.
  const [variant, setVariant] = useState<Variant>("continue");

  useEffect(() => {
    if (!hasContinue) {
      setVariant("start");
      return;
    }
    // Random nudge — either resume or referral. Stable across renders
    // because the effect only runs once on mount.
    setVariant(Math.random() < 0.5 ? "continue" : "invite");
  }, [hasContinue]);

  const greeting = useMemo(() => pickGreet(name, copy.bubble), [name, copy.bubble]);

  const nudge =
    variant === "invite"
      ? copy.bubble.nudgeReferral
      : variant === "continue"
        ? copy.bubble.nudgeContinue
        : null;

  const cta =
    variant === "invite"
      ? { label: copy.ctaInvite, kind: "modal" as const }
      : variant === "continue"
        ? { label: copy.ctaContinue, kind: "link" as const, href: continueHref }
        : { label: copy.ctaStart, kind: "link" as const, href: continueHref };

  const ctaInner = (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
      {cta.label}
      <ArrowRight
        aria-hidden
        className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      />
    </span>
  );

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      {/* Subtle warm gradient on hover, same language as ContinueCard */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-light via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {copy.eyebrow}
          </p>
          <Spark state="idle" size={32} ariaLabel={copy.sparkLabel} />
        </div>

        <p className="mt-3 font-heading text-base font-bold leading-snug text-text-primary sm:text-lg">
          {greeting}
        </p>

        {nudge && (
          <p className="mt-1.5 text-sm italic leading-snug text-text-secondary">
            {nudge}
          </p>
        )}

        <div className="flex-1" />

        <div className="mt-4">
          {cta.kind === "modal" ? (
            <button
              type="button"
              onClick={openReferral}
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
            >
              {ctaInner}
            </button>
          ) : cta.href ? (
            <Link href={cta.href} className="inline-flex items-center">
              {ctaInner}
            </Link>
          ) : (
            <span className="text-sm text-text-muted">{cta.label}</span>
          )}
        </div>
      </div>
    </div>
  );
}
