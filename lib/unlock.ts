// Bonus path unlock evaluator (Dashboard V2 — Phase 3).
//
// Two-layer design:
//   - getUnlockSnapshot(): one DB round-trip pulling everything an evaluator
//     needs (XP, streaks, completed lessons per path, referral count).
//   - evaluateCondition(): pure function over a snapshot. Synchronous,
//     trivially testable, and the data structure for the missing-* fields
//     is stable for the future map UI to consume.
//
// `checkAllBonusPaths()` glues the two for callers that want every state
// at once (server-rendered map).

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BonusPathSlug,
  PathSlug,
  UnlockCondition,
  UnlockState,
} from "@/types";
import type { Database } from "@/lib/supabase/types";
import { PATH_META, PATH_ORDER } from "@/lib/lessons/paths";
import { BONUS_PATHS } from "@/lib/bonus-paths";

type AppSupabaseClient = SupabaseClient<Database>;

export interface UnlockSnapshot {
  total_xp: number;
  current_streak: number;
  // The "any time" streak achievement (e.g. PathR's streak-7 requirement)
  // matches against `longest_streak`, not `current_streak`, per spec.
  longest_streak: number;
  referral_count: number;
  // Per-path completion = (completed lesson count >= PATH_META[slug].totalLessons).
  // For paths whose content isn't shipped (Path 3-5 in MVP), this stays
  // false because progressRows is necessarily empty.
  completed_paths: Record<PathSlug, boolean>;
}

const EMPTY_PATH_COMPLETION: Record<PathSlug, boolean> = {
  mindset: false,
  prompt: false,
  build: false,
  debug: false,
  ship: false,
};

/**
 * Pulls everything needed to evaluate every bonus path's unlock condition
 * for a single user, in parallel where independent.
 */
export async function getUnlockSnapshot(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<UnlockSnapshot> {
  const [profileResult, progressResult, referralCountResult] = await Promise.all([
    supabase
      .from("users")
      .select("total_xp, current_streak, longest_streak")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_progress")
      .select("path_slug, completed")
      .eq("user_id", userId)
      .eq("completed", true),
    supabase
      .from("user_referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (progressResult.error) throw progressResult.error;
  if (referralCountResult.error) throw referralCountResult.error;

  // Tally completed lessons per path, then compare to the planned total.
  const completedCount: Record<PathSlug, number> = {
    mindset: 0,
    prompt: 0,
    build: 0,
    debug: 0,
    ship: 0,
  };
  for (const row of progressResult.data ?? []) {
    const slug = row.path_slug as PathSlug;
    if (slug in completedCount) completedCount[slug]++;
  }

  const completed_paths: Record<PathSlug, boolean> = { ...EMPTY_PATH_COMPLETION };
  for (const slug of PATH_ORDER) {
    completed_paths[slug] = completedCount[slug] >= PATH_META[slug].totalLessons;
  }

  return {
    total_xp: profileResult.data?.total_xp ?? 0,
    current_streak: profileResult.data?.current_streak ?? 0,
    longest_streak: profileResult.data?.longest_streak ?? 0,
    referral_count: referralCountResult.count ?? 0,
    completed_paths,
  };
}

/**
 * Pure evaluator. Returns `unlocked: true` plus optional `missing_*` fields
 * describing what's left for the user. For composite_and the missing
 * fields aggregate across all child conditions.
 */
export function evaluateCondition(
  snapshot: UnlockSnapshot,
  condition: UnlockCondition,
): UnlockState {
  switch (condition.type) {
    case "xp_threshold": {
      const missing = condition.xp_required - snapshot.total_xp;
      return missing <= 0
        ? { unlocked: true }
        : { unlocked: false, missing_xp: missing };
    }
    case "achievement_streak": {
      // We store the *target threshold* rather than the delta because copy
      // reads "Reach a 7-day streak (any time)" — the threshold is the
      // actionable number, not how many days the user is short by.
      return snapshot.longest_streak >= condition.streak_min
        ? { unlocked: true }
        : { unlocked: false, missing_streak: condition.streak_min };
    }
    case "social_referral": {
      const missing = condition.min_count - snapshot.referral_count;
      return missing <= 0
        ? { unlocked: true }
        : { unlocked: false, missing_referrals: missing };
    }
    case "achievement_path": {
      const done = snapshot.completed_paths[condition.path_slug];
      return done
        ? { unlocked: true }
        : { unlocked: false, missing_paths: [condition.path_slug] };
    }
    case "achievement_all_paths": {
      const missing = PATH_ORDER.filter(
        (slug) => !snapshot.completed_paths[slug],
      );
      return missing.length === 0
        ? { unlocked: true }
        : { unlocked: false, missing_paths: missing };
    }
    case "composite_and": {
      const parts = condition.all_of.map((c) => evaluateCondition(snapshot, c));
      const allUnlocked = parts.every((p) => p.unlocked);
      if (allUnlocked) return { unlocked: true };

      // Aggregate the worst (largest) missing values from any failing child.
      const result: UnlockState = { unlocked: false };
      for (const part of parts) {
        if (part.missing_xp !== undefined) {
          result.missing_xp = Math.max(result.missing_xp ?? 0, part.missing_xp);
        }
        if (part.missing_streak !== undefined) {
          result.missing_streak = Math.max(
            result.missing_streak ?? 0,
            part.missing_streak,
          );
        }
        if (part.missing_referrals !== undefined) {
          result.missing_referrals = Math.max(
            result.missing_referrals ?? 0,
            part.missing_referrals,
          );
        }
        if (part.missing_paths) {
          result.missing_paths = Array.from(
            new Set([...(result.missing_paths ?? []), ...part.missing_paths]),
          );
        }
      }
      return result;
    }
  }
}

/**
 * Evaluate every bonus path against the user's snapshot. The map and any
 * unlock-progress UI consume this single record.
 */
export async function checkAllBonusPaths(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<Record<BonusPathSlug, UnlockState>> {
  const snapshot = await getUnlockSnapshot(supabase, userId);
  return checkAllBonusPathsFromSnapshot(snapshot);
}

/**
 * Synchronous variant for callers that already have a snapshot (e.g.
 * server components that load multiple things in parallel and want to
 * avoid the duplicate DB round-trip).
 */
export function checkAllBonusPathsFromSnapshot(
  snapshot: UnlockSnapshot,
): Record<BonusPathSlug, UnlockState> {
  const out = {} as Record<BonusPathSlug, UnlockState>;
  for (const path of Object.values(BONUS_PATHS)) {
    out[path.slug] = evaluateCondition(snapshot, path.unlock_condition);
  }
  return out;
}
