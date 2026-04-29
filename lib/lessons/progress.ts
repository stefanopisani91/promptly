import type {
  Lang,
  LessonContent,
  PathProgress,
  PathSlug,
  UserProgress,
} from "@/types";
import {
  getAllUserProgress,
  getProgressForPath,
  type AppSupabaseClient,
} from "@/lib/supabase/queries";
import { PATH_META } from "./paths";
import { loadAvailableLessonsInPath } from "./load";

interface DashboardStats {
  totalXp: number;
  lessonsCompleted: number;
  currentStreak: number;
}

export function computeDashboardStats(
  totalXp: number,
  currentStreak: number,
  progress: UserProgress[],
): DashboardStats {
  const lessonsCompleted = progress.filter((p) => p.completed).length;
  return { totalXp, lessonsCompleted, currentStreak };
}

export async function getDashboardProgress(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<UserProgress[]> {
  return getAllUserProgress(supabase, userId);
}

/**
 * Returns the path-level progress for a given user. `is_unlocked` follows the
 * prerequisite-completion rule (e.g. prompt unlocks once mindset is fully
 * completed). `next_lesson_id` is the first lesson that exists on disk and is
 * not yet completed; falls back to the very first lesson in the path if the
 * user hasn't started.
 */
export async function getPathProgress(
  supabase: AppSupabaseClient,
  userId: string,
  pathSlug: PathSlug,
  lang: Lang,
): Promise<PathProgress> {
  const meta = PATH_META[pathSlug];
  const [available, progressRows] = await Promise.all([
    loadAvailableLessonsInPath(pathSlug, lang),
    getProgressForPath(supabase, userId, pathSlug),
  ]);

  const completedIds = new Set(
    progressRows.filter((p) => p.completed).map((p) => p.lesson_id),
  );

  const totalXpAvailable = available.reduce(
    (sum, l) => sum + l.base_xp + l.difficulty_bonus_xp,
    0,
  );
  const earnedXp = progressRows.reduce((sum, p) => sum + p.xp_earned, 0);

  // Next lesson = first available (by order) the user has NOT completed.
  // If everything available is completed, point at the first uncompleted
  // declared lesson id by convention (`<slug>-01`) — even if its JSON does
  // not exist yet (Round 3a only ships mindset-01).
  const nextAvailable = available.find((l) => !completedIds.has(l.id));
  let nextLessonId: string | null = null;
  if (nextAvailable) nextLessonId = nextAvailable.id;
  else if (available.length === 0) nextLessonId = `${pathSlug}-01`;

  let isUnlocked = true;
  if (meta.prerequisitePath) {
    const prereqProgress = await getProgressForPath(
      supabase,
      userId,
      meta.prerequisitePath,
    );
    const prereqCompletedCount = prereqProgress.filter((p) => p.completed).length;
    isUnlocked = prereqCompletedCount >= PATH_META[meta.prerequisitePath].totalLessons;
  }

  return {
    slug: pathSlug,
    total_lessons: meta.totalLessons,
    completed_lessons: progressRows.filter((p) => p.completed).length,
    total_xp_available: totalXpAvailable,
    earned_xp: earnedXp,
    next_lesson_id: nextLessonId,
    is_unlocked: isUnlocked,
  };
}

export async function isPathUnlocked(
  supabase: AppSupabaseClient,
  userId: string,
  pathSlug: PathSlug,
): Promise<boolean> {
  const meta = PATH_META[pathSlug];
  if (!meta.prerequisitePath) return true;
  const prereqProgress = await getProgressForPath(
    supabase,
    userId,
    meta.prerequisitePath,
  );
  const completed = prereqProgress.filter((p) => p.completed).length;
  return completed >= PATH_META[meta.prerequisitePath].totalLessons;
}

export interface NavigationNeighbors {
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  positionLabel: { current: number; total: number };
}

/**
 * Compute prev/next neighbors for a lesson within its path. Uses the on-disk
 * available lessons (not the planned total) so navigation only ever links to
 * existing JSONs.
 */
export function getLessonNeighbors(
  available: LessonContent[],
  current: LessonContent,
): NavigationNeighbors {
  const idx = available.findIndex((l) => l.id === current.id);
  const prev = idx > 0 ? available[idx - 1] : null;
  const next = idx >= 0 && idx < available.length - 1 ? available[idx + 1] : null;
  return {
    prev: prev ? { id: prev.id, title: prev.title } : null,
    next: next ? { id: next.id, title: next.title } : null,
    positionLabel: { current: idx + 1, total: available.length },
  };
}

// PostHog analytics events for lesson_started / exercise_attempt /
// lesson_completed are intentionally NOT wired in Round 3a — see LESSONS.md
// "Eventi PostHog (predisposti, wiring in round successivo)".
