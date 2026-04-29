import { NextResponse, type NextRequest } from "next/server";
import { isLang, type Lang } from "@/types";
import { createClient } from "@/lib/supabase/server";

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

  const { data: profile } = await supabase
    .from("users")
    .select("id, onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  // Round 1: /onboarding and /dashboard don't exist yet. The brief asks for a
  // temporary redirect to /<lang>?temp_logged_in=1 with new_user=1 when the
  // profile is missing or onboarding isn't complete. Replace these with the
  // real targets in the next round.
  const target = new URL(`/${lang}`, origin);
  target.searchParams.set("temp_logged_in", "1");

  const isNewUser = !profile || !profile.onboarding_completed_at;
  if (isNewUser) target.searchParams.set("new_user", "1");
  if (source) target.searchParams.set("source", source);
  if (completedDemo) target.searchParams.set("completed_demo", "true");

  return NextResponse.redirect(target);
}
