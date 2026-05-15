import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/queries";
import { LangSwitcher } from "@/components/i18n/LangSwitcher";
import { ProfileMenu } from "@/components/dashboard/ProfileMenu";
import { PromptlyWordmark } from "@/components/promptly/PromptlyWordmark";

export default async function AppLayout({ children }: { children: ReactNode }) {
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

  const fallbackLang = resolveLangFromRequest();
  const lang: Lang = isLang(profile.language) ? profile.language : fallbackLang;
  const copy = getAuthCopy(lang);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-12 items-center justify-between border-b border-border px-4 md:h-16 sm:px-6">
        <Link
          href="/dashboard"
          aria-label="Promptly"
          className="inline-flex items-center"
        >
          <PromptlyWordmark size="xl" />
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <LangSwitcher fallback={lang} ariaLabel={copy.shell.langToggleLabel} />
          <ProfileMenu
            fullName={profile.full_name}
            email={profile.email}
            copy={{
              openLabel: copy.dashboard.profileMenu.openLabel,
              profile: copy.dashboard.profileMenu.profile,
              promises: copy.dashboard.profileMenu.promises,
              logout: copy.dashboard.profileMenu.logout,
            }}
          />
        </div>
      </header>
      {children}
    </div>
  );
}
