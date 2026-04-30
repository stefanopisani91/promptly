import {
  ArrowDown,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { LandingCopy } from "@/lib/i18n/landing";
import { InfinityBugAnimation } from "@/components/marketing/InfinityBugAnimation";

interface Props {
  copy: LandingCopy["problem"];
}

const ICON_MAP = {
  idea: Lightbulb,
  wrench: Wrench,
  loop: RefreshCw,
} as const;

const ICON_COLOR = {
  idea: "text-warning",
  wrench: "text-text-secondary",
  loop: "text-primary",
} as const;

export function ProblemSection({ copy }: Props) {
  return (
    <section
      id="bug-loop"
      aria-labelledby="bug-loop-title"
      className="py-16 sm:py-20 lg:py-24"
    >
      {/* Wrapper relativo: l'animazione è absolute, il testo è sopra */}
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <InfinityBugAnimation />
        {/* z-[1] + relative assicurano che il testo stia sopra all'SVG assoluto */}
        <div className="relative z-[1]">
          <div className="mb-4 inline-block rounded-full bg-error/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-error">
            {copy.eyebrow}
          </div>
          <h2
            id="bug-loop-title"
            className="whitespace-pre-line font-heading text-3xl font-bold leading-[1.1] text-text-primary text-balance sm:text-4xl lg:text-5xl"
          >
            {copy.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            {copy.sub}
          </p>
        </div>
      </div>

      <ol className="mx-auto mt-12 max-w-2xl space-y-12 px-4 sm:mt-14 sm:space-y-14 sm:px-6">
        {copy.steps.map((step, idx) => {
          const Icon = ICON_MAP[step.iconSlug];
          const isLoop = step.iconSlug === "loop";
          const number = `0${idx + 1}`;

          if (isLoop) {
            return (
              <li key={step.iconSlug}>
                <div className="mb-2 flex justify-center">
                  <ArrowDown
                    className="h-8 w-8 text-text-muted/40"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </div>
                <article className="rounded-2xl bg-text-primary p-8 text-white ring-1 ring-primary/20 sm:p-10">
                  {step.kickerEyebrow && (
                    <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary">
                      {step.kickerEyebrow}
                    </p>
                  )}
                  <div className="mt-3 flex items-start gap-4">
                    <Icon
                      className="mt-1 h-7 w-7 flex-shrink-0 text-primary motion-safe:animate-spin-slow"
                      strokeWidth={2.2}
                      aria-hidden
                    />
                    <div className="flex-1">
                      <span className="font-mono text-xs font-medium text-primary/70">
                        {number}
                      </span>
                      <h3 className="mt-1 font-heading text-2xl font-semibold leading-snug sm:text-3xl">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-white/85 sm:text-lg">
                        {step.description}
                      </p>
                      {step.kickerEnd && (
                        <p className="mt-3 text-lg font-bold text-primary sm:text-xl">
                          {step.kickerEnd}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          }

          return (
            <li
              key={step.iconSlug}
              className="grid grid-cols-[auto_1fr] gap-5 sm:gap-7"
            >
              <div className="flex flex-col items-start">
                <span className="font-mono text-5xl font-bold leading-none text-text-muted/40 sm:text-6xl">
                  {number}
                </span>
                <Icon
                  className={`mt-3 h-7 w-7 ${ICON_COLOR[step.iconSlug]}`}
                  strokeWidth={1.8}
                  aria-hidden
                />
              </div>
              <div className="pt-1">
                <h3 className="font-heading text-xl font-semibold leading-snug text-text-primary sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-text-secondary sm:text-lg">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mx-auto mt-12 max-w-prose px-4 text-center sm:mt-14 sm:px-6">
        <p className="text-lg leading-relaxed text-text-primary">
          {copy.conclusion.line1}
        </p>
        <p className="my-4 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">
          {copy.conclusion.microExpertise}
        </p>
        <p className="text-lg font-semibold text-primary-deep">
          {copy.conclusion.bridge}
        </p>
        <Sparkles
          className="mx-auto mt-5 h-6 w-6 text-primary"
          strokeWidth={2}
          aria-hidden
        />
        <div aria-hidden className="mx-auto mt-3 h-px w-12 bg-primary" />
      </div>
    </section>
  );
}
