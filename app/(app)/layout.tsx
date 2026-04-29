import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/queries";
import { LangToggle } from "@/components/auth/LangToggle";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

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
      <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
        <Link
          href="/dashboard"
          aria-label="Promptly"
          className="flex items-center"
        >
          <Image
            src="/brand/logo-horizontal.svg"
            alt="Promptly"
            width={140}
            height={32}
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>
        <div className="flex items-center gap-3">
          <LangToggle current={lang} ariaLabel={copy.shell.langToggleLabel} />
          <LogoutButton label={copy.dashboard.logoutCta} />
        </div>
      </header>
      {children}
    </div>
  );
}
