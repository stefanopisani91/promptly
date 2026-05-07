import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { getAuthCopy } from "@/lib/i18n/auth";
import { getProfilingCopy } from "@/lib/i18n/profiling";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/queries";
import { toolDisplayName } from "@/lib/onboarding/tools";
import { ProfilePromisesPanel } from "@/components/settings/ProfilePromisesPanel";
import { restartOnboarding } from "@/app/(auth)/onboarding/actions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  // Lang resolved at runtime from the user profile inside the page; metadata
  // can't await Supabase here so we fall back to the request lang.
  const lang = resolveLangFromRequest();
  const copy = getAuthCopy(lang).settings;
  return {
    title: copy.meta.title,
    description: copy.meta.description,
    robots: { index: false, follow: false },
  };
}

export default async function SettingsProfilePage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) redirect("/auth");

  const profile = await getUserProfile(supabase, user.id);
  if (!profile || !profile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();
  const auth = getAuthCopy(lang);
  const profiling = getProfilingCopy(lang);
  const settings = auth.settings;

  const experienceLabel = profile.experience_level
    ? profiling.step3.options.find((o) => o.key === profile.experience_level)
        ?.label ?? settings.fields.empty
    : settings.fields.empty;

  const clarityLabel = profile.project_clarity
    ? profiling.step4.options.find((o) => o.key === profile.project_clarity)
        ?.label ?? settings.fields.empty
    : settings.fields.empty;

  const dailyGoalLabel =
    profiling.step8.options.find((o) => o.key === profile.daily_goal)?.label ??
    settings.fields.empty;

  const toolsLabel =
    profile.tools_used.length === 0
      ? settings.fields.empty
      : profile.tools_used.map((slug) => toolDisplayName(slug, lang)).join(", ");

  const preferredToolLabel = profile.preferred_tool
    ? toolDisplayName(profile.preferred_tool, lang)
    : settings.fields.empty;

  return (
    <main className="flex flex-1 flex-col px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-text-muted hover:text-text-primary"
          >
            {settings.actions.back}
          </Link>
          <h1 className="font-heading text-3xl font-bold text-text-primary sm:text-4xl">
            {settings.pageTitle}
          </h1>
          <p className="text-base text-text-secondary">{settings.pageSub}</p>
        </div>

        <Section title={settings.sections.identity}>
          <Field label={settings.fields.name} value={profile.full_name ?? settings.fields.empty} />
          <Field label={settings.fields.email} value={profile.email} />
          <Field
            label={settings.fields.language}
            value={profile.language === "it" ? "Italiano" : "English"}
          />
          <Field label={settings.fields.dailyGoal} value={dailyGoalLabel} />
        </Section>

        <Section title={settings.sections.profile}>
          <Field label={settings.fields.experience} value={experienceLabel} />
          <Field label={settings.fields.clarity} value={clarityLabel} />
          <Field
            label={settings.fields.project}
            value={profile.project_description ?? settings.fields.empty}
            multiline
          />
          <Field label={settings.fields.tools} value={toolsLabel} />
          <Field label={settings.fields.preferredTool} value={preferredToolLabel} />
          <Field
            label={settings.fields.motivation}
            value={profile.deep_motivation ?? settings.fields.empty}
            multiline
          />
        </Section>

        <ProfilePromisesPanel
          id="promises"
          copy={{
            heading: settings.sections.promises,
            lead: settings.promisesLead,
            fallbackBadge: settings.fallbackBadge,
            regenerate: settings.actions.regenerate,
            regenerating: settings.actions.regenerating,
            regenerated: settings.actions.regenerated,
            regenerateError: settings.actions.regenerateError,
            cooldownMessage: settings.actions.regenerateCooldown,
            dailyCapMessage: settings.actions.regenerateDailyCap,
            // Pre-compute labels here — functions can't cross the
            // server→client component boundary in Next.js App Router.
            promiseLabels: [
              profiling.step11.promiseLabel(1),
              profiling.step11.promiseLabel(2),
              profiling.step11.promiseLabel(3),
            ],
          }}
          initialPromises={profile.promises}
        />

        <Section title={settings.sections.account}>
          {/* Form action — clears onboarding_completed_at server-side and
              redirects to /onboarding, so the page guard lets the user
              back into the flow. The promise-generation rate limit still
              applies when they reach STEP 11 of the new run. */}
          <form action={restartOnboarding}>
            <button
              type="submit"
              className="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              ↻ {settings.actions.restartOnboarding}
            </button>
          </form>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface px-6 py-6 shadow-sm">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[180px_1fr] sm:gap-4">
      <span className="text-sm font-medium text-text-muted">{label}</span>
      <span
        className={
          multiline
            ? "whitespace-pre-line text-sm leading-relaxed text-text-primary"
            : "text-sm text-text-primary"
        }
      >
        {value}
      </span>
    </div>
  );
}
