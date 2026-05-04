"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  setUserArchetype,
  upsertLessonCompletion,
  upsertLessonProgressState,
} from "@/lib/supabase/queries";
import type { PathSlug } from "@/types";

export type CompleteLessonResult =
  | { ok: true; xpDelta: number }
  | { ok: false; error: "unauthorized" | "db_error" };

export async function completeLessonAction(input: {
  lessonId: string;
  pathSlug: PathSlug;
  attempts: number;
  xpEarned: number;
  archetypeKey?: string | null;
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
    if (input.archetypeKey) {
      await setUserArchetype(supabase, user.id, input.archetypeKey);
    }
    revalidatePath("/dashboard");
    revalidatePath(`/path/${input.pathSlug}`);
    revalidatePath(`/lesson/${input.lessonId}`);
    return { ok: true, xpDelta };
  } catch {
    return { ok: false, error: "db_error" };
  }
}

/**
 * Progressive autosave for V3 lessons. Fire-and-forget from the client at
 * each step transition: stores `current_step` and the free-form `step_state`
 * bag so a returning user lands back where they left off. Never marks
 * the lesson as completed — that path goes through completeLessonAction.
 */
export async function saveLessonProgressAction(input: {
  lessonId: string;
  pathSlug: PathSlug;
  currentStep: number;
  stepState: Record<string, unknown>;
}): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false };
  try {
    await upsertLessonProgressState(supabase, {
      userId: user.id,
      lessonId: input.lessonId,
      pathSlug: input.pathSlug,
      currentStep: input.currentStep,
      stepState: input.stepState,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
