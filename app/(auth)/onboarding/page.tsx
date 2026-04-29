import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/queries";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

type SearchParams = {
  source?: string | string[];
  completed_demo?: string | string[];
  lang?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Metadata {
  const lang = resolveLangFromRequest(searchParams.lang);
  const copy = getAuthCopy(lang);
  return {
    title: copy.meta.titleOnboarding,
    description: copy.meta.description,
    robots: { index: false, follow: false },
  };
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    redirect("/auth");
  }

  const profile = await getUserProfile(supabase, user.id);
  if (profile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  const initialLang = resolveLangFromRequest(searchParams.lang);
  const profileLang: Lang | null =
    profile && isLang(profile.language) ? profile.language : null;
  const startingLang: Lang = profileLang ?? initialLang;

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";

  const initialName = (profile?.full_name ?? metadataName ?? "").trim();
  const source = firstParam(searchParams.source) ?? null;
  const completedDemo = firstParam(searchParams.completed_demo) === "true";

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:py-12">
      <OnboardingShell
        initialName={initialName}
        initialLang={startingLang}
        signupSource={source}
        completedDemo={completedDemo}
      />
    </main>
  );
}
