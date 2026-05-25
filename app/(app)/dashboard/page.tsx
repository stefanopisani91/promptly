import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { getMapCopy } from "@/lib/i18n/map";
import { getReferralCopy } from "@/lib/i18n/referral";
import { createClient } from "@/lib/supabase/server";
import {
  getAllUserProgress,
  getOrCreateReferralCode,
  getReferralStats,
  getUserProfile,
} from "@/lib/supabase/queries";
import { getReferralUrl } from "@/lib/referral";
import { buildMapData } from "@/lib/map/data";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardStatsGrid } from "@/components/dashboard/DashboardStatsGrid";
import { ContinueCard } from "@/components/dashboard/ContinueCard";
import { DailyGoalCard } from "@/components/dashboard/DailyGoalCard";
import type { RecentLessonItem } from "@/components/dashboard/RecentLessonsList";
import { SparkCompanionCard } from "@/components/dashboard/SparkCompanionCard";
import { LockedRedirectToast } from "@/components/dashboard/LockedRedirectToast";
import { LevelUpModal } from "@/components/promptly/LevelUpModal";
import { ReferralModalProvider } from "@/components/promptly/ReferralModalProvider";
import { LearningMap } from "@/components/promptly/map/LearningMap";
import { MapTopBar } from "@/components/promptly/map/MapTopBar";
import { MapTopBarInviteButton } from "@/components/promptly/map/MapTopBarInviteButton";
import { getLevelFromXP } from "@/lib/levels";
import { dailyGoalToMinutes } from "@/lib/daily-goal";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const lang = resolveLangFromRequest();
  const copy = getAuthCopy(lang);
  return {
    title: copy.meta.titleDashboard,
    description: copy.meta.description,
    robots: { index: false, follow: false },
  };
}

interface DashboardPageProps {
  searchParams?: { locked?: string };
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    redirect("/auth");
  }
  // Picked up by the toast component below — server-side, the lesson
  // route appends `?locked=path2` when a user deep-links to a locked
  // Path 2 lesson.
  const showLockedToast = searchParams?.locked === "path2";

  const profile = await getUserProfile(supabase, user.id);
  if (!profile || !profile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();
  const authCopy = getAuthCopy(lang).dashboard;
  const mapCopy = getMapCopy(lang);

  // Load referral data alongside the rest of the dashboard payload so the
  // shared <ReferralModalProvider> below has everything it needs to mount
  // a fully populated modal — no second round-trip when the user clicks
  // the trigger. Note: the *copy* itself isn't passed across the boundary
  // (it contains a function — `share.nativeText` — which Next.js refuses
  // to serialize). The provider re-loads it on the client from `lang`.
  const referralCopy = getReferralCopy(lang);
  const [progress, mapData, referralCode, referralStats] = await Promise.all([
    getAllUserProgress(supabase, user.id),
    buildMapData(
      supabase,
      user.id,
      lang,
      {
        mindset: mapCopy.paths.mindset.title,
        prompt: mapCopy.paths.prompt.title,
        build: mapCopy.paths.build.title,
        debug: mapCopy.paths.debug.title,
        ship: mapCopy.paths.ship.title,
      },
      {
        mindset: mapCopy.paths.mindset.tagline,
        prompt: mapCopy.paths.prompt.tagline,
        build: mapCopy.paths.build.tagline,
        debug: mapCopy.paths.debug.tagline,
        ship: mapCopy.paths.ship.tagline,
      },
    ),
    getOrCreateReferralCode(supabase, user.id, profile.full_name),
    getReferralStats(supabase, user.id),
  ]);
  const referralUrl = getReferralUrl(referralCode, lang);

  const displayName =
    (profile.full_name ?? "").trim() || user.email!.split("@")[0];

  const lessonsCompleted = progress.filter((p) => p.completed).length;

  // Activity heatmap — UTC dates (YYYY-MM-DD) where ≥1 lesson was completed.
  const activeDates = Array.from(
    new Set(
      progress
        .filter((p) => p.completed && p.completed_at)
        .map((p) => p.completed_at!.slice(0, 10)),
    ),
  );

  // Lookup: lessonId → minutes (drives DailyGoal sum + ContinueCard duration)
  // and lessonId → title (drives RecentLessonsList).
  const titleByLessonId = new Map<string, string>();
  const minutesByLessonId = new Map<string, number>();
  for (const path of mapData.paths) {
    for (const node of path.nodes) {
      if (node.lessonId) {
        if (node.title) titleByLessonId.set(node.lessonId, node.title);
        if (node.estimatedMinutes !== undefined) {
          minutesByLessonId.set(node.lessonId, node.estimatedMinutes);
        }
      }
    }
  }
  const pathTitles = {
    mindset: mapCopy.paths.mindset.title,
    prompt: mapCopy.paths.prompt.title,
    build: mapCopy.paths.build.title,
    debug: mapCopy.paths.debug.title,
    ship: mapCopy.paths.ship.title,
  };
  const recentLessons: RecentLessonItem[] = progress
    .filter((p) => p.completed && p.completed_at)
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
    .slice(0, 3)
    .map((p) => ({
      lessonId: p.lesson_id,
      title: titleByLessonId.get(p.lesson_id) ?? p.lesson_id,
      pathTitle: pathTitles[p.path_slug],
      href: `/lesson/${p.lesson_id}`,
    }));

  // Today's minutes — sum of estimated_minutes for lessons completed today.
  // Uses UTC date keys so it lines up with the heatmap.
  const todayKey = new Date().toISOString().slice(0, 10);
  const minutesToday = progress
    .filter((p) => p.completed && p.completed_at?.startsWith(todayKey))
    .reduce((sum, p) => sum + (minutesByLessonId.get(p.lesson_id) ?? 0), 0);

  // Streak derived from activeDates (column exists but isn't written yet).
  const activeSet = new Set(activeDates);
  let derivedStreak = 0;
  const cursor = new Date();
  if (!activeSet.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (activeSet.has(cursor.toISOString().slice(0, 10))) {
    derivedStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const currentLevel = getLevelFromXP(profile.total_xp);
  const showLevelUp = currentLevel > profile.last_level_up_notified;

  // Active lesson lookup for the ContinueCard. When the user hasn't
  // started anything (or is fully done with all available content), the
  // card stays hidden.
  const activeSection =
    mapData.current.pathSlug !== null
      ? mapData.paths.find((p) => p.slug === mapData.current.pathSlug)
      : null;
  const activeNode =
    activeSection && mapData.current.lessonIndex !== null
      ? activeSection.nodes[mapData.current.lessonIndex]
      : null;
  const activeLessonHref =
    activeNode?.href ??
    (activeNode?.lessonId ? `/lesson/${activeNode.lessonId}` : null);
  // Hide the Continue card when the robot is parked on a completed
  // lesson (stuck-pawn state — buildMapData pins the pawn to the last
  // finished lesson so the user still sees their progress on the map,
  // but there's nothing to continue). The Spark hero variant takes
  // over instead.
  const showContinue =
    !!activeSection &&
    !!activeNode &&
    !!activeLessonHref &&
    !!activeNode.title &&
    activeNode.state !== "completed";

  return (
    <ReferralModalProvider
      data={{
        referralUrl,
        count: referralStats.count,
        activatedAt: referralStats.activatedAt,
        fullName: profile.full_name,
        lang,
      }}
    >
      <main className="flex flex-1 flex-col gap-6 py-8 sm:py-12">
        {showLevelUp && (
          <LevelUpModal
            fromLevel={profile.last_level_up_notified}
            toLevel={currentLevel}
            language={lang}
          />
        )}

        {showLockedToast && (
          <LockedRedirectToast
            message={mapCopy.comingSoonToast}
            dismissLabel={mapCopy.modal.closeAria}
          />
        )}

        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <DashboardGreeting copy={authCopy} name={displayName} />
        </div>

        {/* Hierarchy on mobile (and first fold on desktop):
              greeting → primary action (Continue / Spark hero) → Spark
              companion → compact stats → map. The primary CTA always lives
              above the stats grid so the thumb zone reaches it first. */}
        {showContinue && activeSection && activeNode && activeLessonHref ? (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
              <ContinueCard
                copy={authCopy.continueCard}
                pathTitle={activeSection.title}
                lessonNumber={activeNode.index + 1}
                lessonTitle={activeNode.title!}
                href={activeLessonHref}
                pathProgress={
                  activeSection.totalLessons > 0
                    ? activeSection.completedLessons / activeSection.totalLessons
                    : 0
                }
                estimatedMinutes={activeNode.estimatedMinutes}
                freshLesson={mapData.current.isFreshNewLesson}
              />
              <DailyGoalCard
                copy={authCopy.dailyGoal}
                minutesToday={minutesToday}
                goalMinutes={dailyGoalToMinutes(profile.daily_goal)}
              />
            </div>
          </div>
        ) : (
          // No active lesson yet — first-time user or path completed.
          // Promote the Spark companion as the hero block in the slot the
          // ContinueCard would have occupied so the dashboard never feels
          // cold on first open. Using `variant="hero"` to give Spark room
          // to breathe and a larger mascot size (see C3 + C5 spec).
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <SparkCompanionCard
              copy={authCopy.sparkCompanion}
              name={displayName}
              continueHref={activeLessonHref}
              hasContinue={showContinue}
              variant="hero"
            />
          </div>
        )}

        {/* Spark companion as a standalone block, only when the
            ContinueCard is showing above. When the hero variant is
            already on screen we don't repeat it. */}
        {showContinue && (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <SparkCompanionCard
              copy={authCopy.sparkCompanion}
              name={displayName}
              continueHref={activeLessonHref}
              hasContinue={showContinue}
            />
          </div>
        )}

        {/* First-time users (zero lessons completed) don't need a streak/XP
            grid full of zeros — it reads as cold and over-promises gamified
            mechanics before the user has earned anything. The grid only
            shows once the first lesson is done. */}
        {lessonsCompleted > 0 && (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <DashboardStatsGrid
              streakLabel={authCopy.stats.streak}
              xpLabel={authCopy.stats.xp}
              totalXp={profile.total_xp}
              currentStreak={derivedStreak}
              lessonsCompleted={lessonsCompleted}
              activeDates={activeDates}
              recentLessons={recentLessons}
            />
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:max-w-5xl">
          <MapTopBar
            level={currentLevel}
            totalXp={profile.total_xp}
            language={lang}
            rightSlot={
              <MapTopBarInviteButton
                label={referralCopy.trigger.label}
                ariaLabel={referralCopy.trigger.ariaLabel}
              />
            }
          />
          <LearningMap
            data={mapData}
            copy={mapCopy}
            lang={lang}
            level={currentLevel}
          />
        </div>
      </main>
    </ReferralModalProvider>
  );
}
