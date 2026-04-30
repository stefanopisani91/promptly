import { notFound, redirect } from "next/navigation";
import { isLang } from "@/types";
import { isValidReferralCode } from "@/lib/referral";
import { persistPendingReferral } from "@/app/(app)/dashboard/actions";

type Params = { lang: string };
type SearchParams = { ref?: string | string[] };

export function generateStaticParams(): Params[] {
  return [{ lang: "it" }, { lang: "en" }];
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  if (!isLang(params.lang)) notFound();

  // Capture `?ref=` into a cookie so it survives the magic-link / OAuth
  // round-trip. The conversion happens in completeOnboarding once the
  // referee's public.users row exists.
  const rawRef = firstParam(searchParams.ref)?.toUpperCase();
  if (rawRef && isValidReferralCode(rawRef)) {
    await persistPendingReferral(rawRef);
  }

  redirect(`/auth?source=legacy_signup&lang=${params.lang}`);
}
