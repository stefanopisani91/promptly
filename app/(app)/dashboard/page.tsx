import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { getMapCopy } from "@/lib/i18n/map";
import { createClient } from "@/lib/supabase/server";
import {
  getAllUserProgress,
  getUserProfile,
} from "@/lib/supabase/queries";
import { buildMapData } from "@/lib/map/data";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { LevelUpModal } from "@/components/promptly/LevelUpModal";
import { ReferralCard } from "@/components/promptly/ReferralCard";
import { LearningMap } from "@/components/promptly/map/LearningMap";
import { MapTopBar } from "@/components/promptly/map/MapTopBar";
import { getLevelFromXP } from "@/lib/levels";

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
  const mapCopy = getMapCopy(lang);

  // Build the map data (single batched fetch via lib/map/data.ts) plus the
  // raw progress rows for the stats counter — both share a Supabase round
  // trip with allProgress, so it's already cached internally.
  const [progress, mapData] = await Promise.all([
    getAllUserProgress(supabase, user.id),
    buildMapData(
      supabase,
      user.id,
      lang,
      // Path titles & descriptions: short labels reused inside the map UI.
      // We pass them in so MapData stays UI-string-free at the lib layer.
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
  ]);

  const showWelcome = profile.welcome_seen_at === null;
  const displayName = (profile.full_name ?? "").trim() || user.email!.split("@")[0];

  const lessonsCompleted = progress.filter((p) => p.completed).length;

  // Levels are derived from total_xp on every read (see lib/levels.ts).
  // Show the celebratory modal once per crossed threshold, tracked via
  // last_level_up_notified on the user row.
  const currentLevel = getLevelFromXP(profile.total_xp);
  const showLevelUp = currentLevel > profile.last_level_up_notified;

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
      {showLevelUp && (
        <LevelUpModal
          fromLevel={profile.last_level_up_notified}
          toLevel={currentLevel}
          language={lang}
        />
      )}

      <DashboardGreeting
        copy={authCopy}
        name={displayName}
        totalXp={profile.total_xp}
        currentStreak={profile.current_streak}
        lessonsCompleted={lessonsCompleted}
      />

      <MapTopBar
        level={currentLevel}
        totalXp={profile.total_xp}
        language={lang}
      />

      <LearningMap
        data={mapData}
        copy={mapCopy}
        lang={lang}
        level={currentLevel}
      />

      <ReferralCard
        userId={user.id}
        fullName={profile.full_name}
        lang={lang}
      />
    </main>
  );
}
