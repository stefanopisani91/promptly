"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DismissWelcomeResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "db_error" };

export async function dismissWelcome(): Promise<DismissWelcomeResult> {
  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({ welcome_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: "db_error" };

  revalidatePath("/dashboard");
  return { ok: true };
}
