"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { upsertLessonCompletion } from "@/lib/supabase/queries";
import type { PathSlug } from "@/types";

export type CompleteLessonResult =
  | { ok: true; xpDelta: number }
  | { ok: false; error: "unauthorized" | "db_error" };

export async function completeLessonAction(input: {
  lessonId: string;
  pathSlug: PathSlug;
  attempts: number;
  xpEarned: number;
}): Promise<CompleteLessonResult> {
  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return { ok: false, error: "unauthorized" };

  try {
    const { xpDelta } = await upsertLessonCompletion(supabase, {
      userId: user.id,
      lessonId: input.lessonId,
      pathSlug: input.pathSlug,
      attempts: input.attempts,
      xpEarned: input.xpEarned,
    });
    revalidatePath("/dashboard");
    revalidatePath(`/path/${input.pathSlug}`);
    revalidatePath(`/lesson/${input.lessonId}`);
    return { ok: true, xpDelta };
  } catch {
    return { ok: false, error: "db_error" };
  }
}
