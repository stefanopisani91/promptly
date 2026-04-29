"use server";

import { isDailyGoal, isLang, type DailyGoal, type Lang } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/notifications/email";

const NAME_REGEX = /^[\p{L}\p{N}\s\-']+$/u;
const NAME_MAX = 40;

export type CompleteOnboardingResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid_input" | "db_error" };

export interface CompleteOnboardingInput {
  fullName: string;
  language: Lang;
  dailyGoal: DailyGoal;
  signupSource?: string | null;
}

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  if (trimmed.length > NAME_MAX) return null;
  if (!NAME_REGEX.test(trimmed)) return null;
  return trimmed;
}

function sanitizeSource(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Tight upper bound — UTM-style values, not free text.
  if (trimmed.length > 64) return null;
  if (!/^[a-zA-Z0-9_\-:.]+$/.test(trimmed)) return null;
  return trimmed;
}

export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResult> {
  const fullName = sanitizeName(input.fullName);
  if (!fullName) return { ok: false, error: "invalid_input" };
  if (!isLang(input.language)) return { ok: false, error: "invalid_input" };
  if (!isDailyGoal(input.dailyGoal)) return { ok: false, error: "invalid_input" };

  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user || !user.email) {
    return { ok: false, error: "unauthorized" };
  }

  const signupSource = sanitizeSource(input.signupSource);
  const completedAt = new Date().toISOString();

  // Fetch the existing row (if any) so we can preserve created signup_source
  // for returning users who never finished onboarding.
  const { data: existing, error: fetchErr } = await supabase
    .from("users")
    .select("id, signup_source")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: "db_error" };
  }

  const resolvedSource = existing?.signup_source ?? signupSource ?? null;

  const { error: upsertErr } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name: fullName,
        language: input.language,
        daily_goal: input.dailyGoal,
        onboarding_completed_at: completedAt,
        signup_source: resolvedSource,
      },
      { onConflict: "id" },
    );

  if (upsertErr) {
    return { ok: false, error: "db_error" };
  }

  // Fire welcome email — never block onboarding on email delivery.
  try {
    const result = await sendWelcomeEmail({
      to: user.email,
      name: fullName,
      lang: input.language,
    });
    if (!result.ok) {
      console.error("[welcome-email] send failed", {
        reason: result.reason,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[welcome-email] threw", error);
  }

  return { ok: true };
}
