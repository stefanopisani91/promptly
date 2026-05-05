import Image from "next/image";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["solution"];
}

export function SolutionSection({ copy }: Props) {
  return (
    <section
      id="solution"
      aria-labelledby="solution-title"
      className="overflow-hidden bg-surface-muted py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          id="solution-title"
          className="font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl"
        >
          {copy.title}
        </h2>
      </div>

      <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-3 md:gap-8">
        {copy.steps.map((step) => (
          <li
            key={step.number}
            className="relative flex flex-col rounded-2xl border border-border bg-surface p-6"
          >
            <span
              className="absolute -top-3 left-6 rounded-full bg-text-primary px-2.5 py-0.5 text-xs font-bold text-white"
              aria-hidden
            >
              {step.number}
            </span>
            <Image
              src={`/brand/icon-path-${step.iconSlug}.svg`}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12"
              aria-hidden
            />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">
              {step.eyebrow}
            </p>
            <h3 className="mt-2 font-heading text-xl font-semibold text-text-primary">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {step.sub}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
