import Image from "next/image";
import { cn } from "@/lib/utils";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["curriculum"];
}

const LEVEL_BAR: Record<"beginner" | "intermediate" | "advanced", string> = {
  beginner: "bg-success",
  intermediate: "bg-warning",
  // Advanced was `bg-error` (red) — same hue as `--error` and `--streak-fire`.
  // Switched to `bg-primary-deep` so the difficulty scale stays inside the
  // brand temperature without colliding with feedback-error semantics.
  advanced: "bg-primary-deep",
};

const TIER_BADGE: Record<"free" | "pro", string> = {
  free: "bg-success-light text-success",
  pro: "bg-pro-light text-pro-accent",
};

export function CurriculumPreview({ copy }: Props) {
  return (
    <section
      id="curriculum"
      aria-labelledby="curriculum-title"
      className="overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          id="curriculum-title"
          className="font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl"
        >
          {copy.title}
        </h2>
        <p className="mt-3 text-base text-text-secondary sm:text-lg">
          {copy.sub}
        </p>
      </div>

      {/* Mobile: horizontal scroll-snap. Desktop ≥lg: 5-column grid. */}
      <div className="mx-auto mt-10 max-w-6xl">
        <ul
          className={cn(
            "flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6",
            "lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-6 lg:pb-0",
          )}
        >
          {copy.cards.map((card) => (
            <li
              key={card.number}
              className={cn(
                "group flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                "lg:w-auto",
              )}
            >
              <div
                className={cn("h-1.5 w-full", LEVEL_BAR[card.level])}
                aria-hidden
              />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <Image
                    src={`/brand/icon-path-${card.iconSlug}.svg`}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10"
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      TIER_BADGE[card.tier],
                    )}
                  >
                    {card.tierLabel}
                  </span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {card.number}
                </p>
                <h3 className="mt-1 font-heading text-base font-semibold leading-snug text-text-primary">
                  {card.title}
                </h3>
                <p className="mt-2 text-xs text-text-secondary">{card.meta}</p>
                {card.startHere && (
                  <p className="mt-3 inline-flex w-fit rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-deep">
                    {card.startHere}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
