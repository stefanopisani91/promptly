"use server";

import { cookies } from "next/headers";
import { isLang, type Lang } from "@/types";
import { createClient } from "@/lib/supabase/server";

const LOCALE_COOKIE = "NEXT_LOCALE";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Persist the user's language choice. Always writes the NEXT_LOCALE cookie
 * so guests and (auth) routes pick it up; for authenticated users it also
 * updates `users.language` so (app) layouts/pages — which prefer the
 * profile column — render in the new language after a refresh.
 *
 * Best-effort: profile-update failures are swallowed because the cookie
 * alone is sufficient for layouts that read `resolveLangFromRequest`.
 */
export async function setLanguage(lang: Lang): Promise<void> {
  if (!isLang(lang)) return;

  const cookieStore = cookies();
  cookieStore.set({
    name: LOCALE_COOKIE,
    value: lang,
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;
    await supabase.from("users").update({ language: lang }).eq("id", user.id);
  } catch (error) {
    console.error("[setLanguage] profile update failed", error);
  }
}
