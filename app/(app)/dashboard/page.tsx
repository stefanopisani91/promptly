import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { getLessonsCopy } from "@/lib/i18n/lessons";
import { createClient } from "@/lib/supabase/server";
import {
  getAllUserProgress,
  getUserProfile,
} from "@/lib/supabase/queries";
import { getPathProgress } from "@/lib/lessons/progress";
import { loadLessonById } from "@/lib/lessons/load";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { PathOverviewCard } from "@/components/dashboard/PathOverviewCard";
import { ContinueCard } from "@/components/dashboard/ContinueCard";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  // The header copy is derived from the user's language at render-time.
  // For metadata we use the request-level fallback, which is fine for an
  // authenticated, noindex page.
  const lang = resolveLangFromRequest();
  const copy = getAuthCopy(lang);
  return {
    title: copy.meta.titleDashboard,
    description: copy.meta.description,
    robots: { index: false, follow: false },
  };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    redirect("/auth");
  }

  const profile = await getUserProfile(supabase, user.id);
  if (!profile || !profile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();
  const authCopy = getAuthCopy(lang).dashboard;
  const lessonsCopy = getLessonsCopy(lang);

  const [progress, mindsetProgress, promptProgress] = await Promise.all([
    getAllUserProgress(supabase, user.id),
    getPathProgress(supabase, user.id, "mindset", lang),
    getPathProgress(supabase, user.id, "prompt", lang),
  ]);

  // Continue: prefer the next incomplete lesson in mindset; fall back to
  // prompt only when mindset is fully completed AND prompt is unlocked.
  const continueTargetId =
    mindsetProgress.next_lesson_id ??
    (promptProgress.is_unlocked ? promptProgress.next_lesson_id : null);
  const continueLesson = continueTargetId
    ? await loadLessonById(continueTargetId, lang)
    : null;
  const continueHref = continueTargetId ? `/lesson/${continueTargetId}` : "/lesson/mindset-01";
  const continueTitle = continueLesson?.title ?? lessonsCopy.continueCard.fallbackTitle;
  const isStarted = progress.length > 0;

  const showWelcome = profile.welcome_seen_at === null;
  const displayName = (profile.full_name ?? "").trim() || user.email!.split("@")[0];

  const lessonsCompleted = progress.filter((p) => p.completed).length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      {showWelcome && (
        <WelcomeCard
          title={authCopy.welcomeCard.title(displayName)}
          sub={authCopy.welcomeCard.sub}
          cta={authCopy.welcomeCard.cta}
          submitting={authCopy.welcomeCard.submitting}
        />
      )}
      <DashboardGreeting
        copy={authCopy}
        name={displayName}
        totalXp={profile.total_xp}
        currentStreak={profile.current_streak}
        lessonsCompleted={lessonsCompleted}
      />

      <ContinueCard
        copy={lessonsCopy.continueCard}
        lessonHref={continueHref}
        lessonTitle={continueTitle}
        isStarted={isStarted}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PathOverviewCard
          progress={mindsetProgress}
          copy={lessonsCopy}
          iconSrc="/brand/icon-path-mindset.svg"
          prereqTitle={null}
        />
        <PathOverviewCard
          progress={promptProgress}
          copy={lessonsCopy}
          iconSrc="/brand/icon-path-prompt.svg"
          prereqTitle={lessonsCopy.pathDisplay.mindset.title}
        />
      </section>
    </main>
  );
}
