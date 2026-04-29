import { NextResponse, type NextRequest } from "next/server";
import { isLang, type Lang } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingGate } from "@/lib/supabase/queries";

function pickLang(value: string | null): Lang {
  return isLang(value) ? value : "it";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const lang = pickLang(searchParams.get("lang"));
  const source = searchParams.get("source");
  const completedDemo = searchParams.get("completed_demo") === "true";

  // Supabase reports magic-link issues as ?error=access_denied&error_code=otp_expired.
  if (errorParam || errorCode) {
    const expiredUrl = new URL("/auth/expired", origin);
    expiredUrl.searchParams.set("lang", lang);
    if (source) expiredUrl.searchParams.set("source", source);
    if (completedDemo) expiredUrl.searchParams.set("completed_demo", "true");
    return NextResponse.redirect(expiredUrl);
  }

  if (!code) {
    const expiredUrl = new URL("/auth/expired", origin);
    expiredUrl.searchParams.set("lang", lang);
    return NextResponse.redirect(expiredUrl);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    const expiredUrl = new URL("/auth/expired", origin);
    expiredUrl.searchParams.set("lang", lang);
    if (source) expiredUrl.searchParams.set("source", source);
    if (completedDemo) expiredUrl.searchParams.set("completed_demo", "true");
    return NextResponse.redirect(expiredUrl);
  }

  const userId = data.session.user.id;
  const gate = await getOnboardingGate(supabase, userId);

  // Three branches:
  //   1. profile missing                     → /onboarding
  //   2. profile exists, onboarding pending  → /onboarding
  //   3. profile + onboarding done           → /dashboard
  if (!gate.exists || !gate.completedAt) {
    const target = new URL("/onboarding", origin);
    target.searchParams.set("lang", lang);
    if (source) target.searchParams.set("source", source);
    if (completedDemo) target.searchParams.set("completed_demo", "true");
    return NextResponse.redirect(target);
  }

  const target = new URL("/dashboard", origin);
  return NextResponse.redirect(target);
}
