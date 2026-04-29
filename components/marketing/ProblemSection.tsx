import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["problem"];
}

export function ProblemSection({ copy }: Props) {
  return (
    <section
      id="problem"
      aria-labelledby="problem-title"
      className="py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          id="problem-title"
          className="font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl"
        >
          {copy.title}
        </h2>
        <p className="mt-3 text-base text-text-secondary sm:text-lg">
          {copy.subtitle}
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:px-6 sm:gap-5">
        {copy.cards.map((card, i) => (
          <article
            key={i}
            className="flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-sm"
          >
            <span className="text-3xl" aria-hidden>
              {card.emoji}
            </span>
            <p className="mt-4 text-base leading-relaxed text-text-primary">
              &ldquo;{card.quote}&rdquo;
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
