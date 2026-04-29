import type { Lang } from "@/types";
import type { LandingCopy } from "@/lib/i18n/landing";
import { ExerciseFillBlank } from "@/components/promptly/ExerciseFillBlank";

interface Props {
  copy: LandingCopy["exercise"];
  lang: Lang;
}

export function InteractiveExerciseDemo({ copy, lang }: Props) {
  return (
    <section
      id="exercise-demo"
      aria-labelledby="exercise-title"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary-light/25 to-background"
      />

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          id="exercise-title"
          className="font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl"
        >
          {copy.title}
        </h2>
        <p className="mt-3 text-base text-text-secondary sm:text-lg">
          {copy.sub}
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl px-4 sm:px-6">
        <ExerciseFillBlank
          copy={copy}
          standalone
          ctaHref={`/auth?source=hero_secondary&completed_demo=true&lang=${lang}`}
        />
      </div>
    </section>
  );
}
