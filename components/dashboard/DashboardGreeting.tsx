import type { AuthCopy } from "@/lib/i18n/auth";

interface Props {
  copy: AuthCopy["dashboard"];
  name: string;
  totalXp: number;
  currentStreak: number;
  lessonsCompleted: number;
}

export function DashboardGreeting({
  copy,
  name,
  totalXp,
  currentStreak,
  lessonsCompleted,
}: Props) {
  const stats: Array<{ label: string; value: string }> = [
    { label: copy.stats.xp, value: totalXp.toLocaleString() },
    { label: copy.stats.streak, value: currentStreak.toLocaleString() },
    { label: copy.stats.lessons, value: lessonsCompleted.toLocaleString() },
  ];

  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
        {copy.greeting(name)}
      </h1>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {stat.label}
            </dt>
            <dd className="mt-2 font-heading text-3xl font-bold text-text-primary">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
