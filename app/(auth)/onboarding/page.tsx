import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getProfilingCopy } from "@/lib/i18n/profiling";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/queries";
import { ProfilingShell } from "@/components/onboarding/profiling/ProfilingShell";

type SearchParams = {
  source?: string | string[];
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
  const copy = getProfilingCopy(lang);
  return {
    title: copy.meta.title,
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

  return (
    <ProfilingShell
      initialName={initialName}
      initialLang={startingLang}
      signupSource={source}
    />
  );
}
