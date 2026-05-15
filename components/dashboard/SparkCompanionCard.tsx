"use client";

// Dashboard companion card.
//
// May 2026 visual refresh:
//   - Spark mascot: idle bob animation (animate-spark-bob)
//   - Greeting: typing effect — text appears character by character on mount
//   - Hero variant: subtle dot-grid pattern background for visual distinction
//   - Gradient on hover upgraded to always-on at lower opacity (same as ContinueCard)
//
// Voice rules from PROMPTLY.md: dry, warm, first person, no emoticons.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SparkSphere } from "@/components/promptly/SparkSphere";
import { useReferralModal } from "@/components/promptly/ReferralModalProvider";
import type { AuthCopy } from "@/lib/i18n/auth";

type Variant = "continue" | "invite" | "start";
type Layout = "default" | "hero";

interface Props {
  copy: AuthCopy["dashboard"]["sparkCompanion"];
  name: string;
  /** href of the user's active lesson, if any. */
  continueHref: string | null;
  /** Whether the user has an active lesson to resume. */
  hasContinue: boolean;
  /** Visual layout. Defaults to "default". */
  variant?: Layout;
}

function pickGreet(
  name: string,
  greet: AuthCopy["dashboard"]["sparkCompanion"]["bubble"],
): string {
  const h = new Date().getHours();
  const template =
    h < 12
      ? greet.greetMorning
      : h >= 18
        ? greet.greetEvening
        : greet.greetGeneric;
  return template.replace("{name}", name.split(" ")[0]);
}

/** Types out `text` character by character. Returns [displayed, isDone]. */
function useTypingEffect(text: string, charDelayMs = 26): [string, boolean] {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;

    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timerRef.current!);
        setDone(true);
      }
    }, charDelayMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, charDelayMs]);

  return [displayed, done];
}

export function SparkCompanionCard({
  copy,
  name,
  continueHref,
  hasContinue,
  variant: layout = "default",
}: Props) {
  const isHero = layout === "hero";
  const { open: openReferral } = useReferralModal();

  const [variant, setVariant] = useState<Variant>("continue");
  useEffect(() => {
    if (!hasContinue) {
      setVariant("start");
      return;
    }
    setVariant(Math.random() < 0.5 ? "continue" : "invite");
  }, [hasContinue]);

  const greeting = useMemo(() => pickGreet(name, copy.bubble), [name, copy.bubble]);
  const [displayedGreeting, typingDone] = useTypingEffect(greeting, 24);

  const nudge =
    variant === "invite"
      ? copy.bubble.nudgeReferral
      : variant === "continue"
        ? copy.bubble.nudgeContinue
        : copy.bubble.nudgeStart;

  const cta =
    variant === "invite"
      ? { label: copy.ctaInvite, kind: "modal" as const }
      : variant === "continue"
        ? { label: copy.ctaContinue, kind: "link" as const, href: continueHref }
        : { label: copy.ctaStart, kind: "link" as const, href: continueHref };

  const ctaInner = isHero ? (
    <span className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]">
      {cta.label}
      <ArrowRight aria-hidden className="h-4 w-4 shrink-0" />
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
      {cta.label}
      <ArrowRight
        aria-hidden
        className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      />
    </span>
  );

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md ${
        isHero ? "p-6 sm:p-8" : "p-5"
      }`}
    >
      {/* Warm gradient — always faintly visible, stronger on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-light via-transparent to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-80"
      />

      {/* Hero variant: dot-grid pattern for visual distinction */}
      {isHero && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--primary) 1.5px, transparent 1.5px)",
            backgroundSize: "20px 20px",
          }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {copy.eyebrow}
          </p>
          {/* Bob animation wrapper */}
          <span className="animate-spark-bob">
            <SparkSphere
              size={isHero ? 96 : 64}
              ariaLabel={copy.sparkLabel}
            />
          </span>
        </div>

        {/* Typing greeting + blinking cursor while typing */}
        <p
          className={`mt-3 font-heading font-bold leading-snug text-text-primary ${
            isHero ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
          }`}
        >
          {displayedGreeting}
          {!typingDone && (
            <span
              aria-hidden
              className="animate-typing-blink ml-0.5 inline-block h-[1em] w-[2px] translate-y-[1px] rounded-sm bg-primary align-middle"
            />
          )}
        </p>

        {nudge && typingDone && (
          <p
            className={`mt-1.5 italic leading-snug text-text-secondary ${
              isHero ? "text-base" : "text-sm"
            }`}
          >
            {nudge}
          </p>
        )}

        <div className="flex-1" />

        {typingDone && (
          <div className={isHero ? "mt-6" : "mt-4"}>
            {cta.kind === "modal" ? (
              <button
                type="button"
                onClick={openReferral}
                className={
                  isHero
                    ? "inline-flex items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
                    : "inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
                }
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
        )}
      </div>
    </div>
  );
}
