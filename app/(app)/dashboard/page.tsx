import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/queries";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";

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

// `?welcome=true` and `?completed_demo=true` are propagated by the onboarding
// submit. The source of truth for the welcome card is `welcome_seen_at IS NULL`
// — the query params are informational (Round 3 will use `completed_demo`).

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
  const copy = getAuthCopy(lang).dashboard;

  const showWelcome = profile.welcome_seen_at === null;
  const displayName = (profile.full_name ?? "").trim() || user.email!.split("@")[0];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      {showWelcome && (
        <WelcomeCard
          title={copy.welcomeCard.title(displayName)}
          sub={copy.welcomeCard.sub}
          cta={copy.welcomeCard.cta}
          submitting={copy.welcomeCard.submitting}
        />
      )}
      <DashboardGreeting copy={copy} name={displayName} />
    </main>
  );
}
