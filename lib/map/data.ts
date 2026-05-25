// Server-side data builder for the Learning Map (Dashboard V2 — Phase 4).
//
// Single entry point: `buildMapData(supabase, userId, lang)` does every
// query in parallel and produces the full props tree LearningMap needs.
//
// Why centralised here: page.tsx stays small, and each component receives
// already-shaped data instead of re-deriving things from raw rows.

import type {
  BonusPath,
  BonusPathSlug,
  Lang,
  AnyLessonContent,
  PathSlug,
  UnlockState,
} from "@/types";
import { listBonusPaths } from "@/lib/bonus-paths";
import { PATH_META, PATH_ORDER } from "@/lib/lessons/paths";
import { loadAvailableLessonsInPath } from "@/lib/lessons/load";
import { getShortTitle } from "@/lib/lessons/display";
import { getAllUserProgress, type AppSupabaseClient } from "@/lib/supabase/queries";
import { checkAllBonusPathsFromSnapshot, getUnlockSnapshot } from "@/lib/unlock";

// Path 3-5 ship without lesson content in MVP. We treat them as Pro-locked
// for everyone — once `users.subscription_tier` is wired this becomes a
// per-user decision instead.
const PRO_PATHS: ReadonlySet<PathSlug> = new Set<PathSlug>(["build", "debug", "ship"]);

// Paths whose content exists but is intentionally hidden until the public
// launch (1 June 2026 for Path 2 — the V1 fill-in-the-blank lessons are
// being rewritten in V3 and we don't want users to see the older format
// in the meantime). Visible on the map with a "coming soon" lock so the
// dashboard still shows the full product surface.
const COMING_SOON_PATHS: ReadonlySet<PathSlug> = new Set<PathSlug>(["prompt"]);

// Individual lessons exempt from their path's coming-soon lock — for
// previewing a single migrated V3 lesson on a path that's otherwise
// hidden. The remaining lessons in the same path still render as
// "coming soon" on the map. As lessons land in V3 their id moves out
// of here; when the whole path is ready, drop the path from
// COMING_SOON_PATHS and clear the exceptions for it.
const COMING_SOON_LESSON_EXCEPTIONS: ReadonlySet<string> = new Set<string>([
  "prompt-01",
]);

/**
 * True iff this lesson should be treated as "still coming soon" given its
 * path's gate AND the per-lesson exception list. Lessons in
 * `COMING_SOON_LESSON_EXCEPTIONS` always return false — they're previewed
 * even when their path is otherwise hidden.
 */
export function isLessonComingSoonGated(
  pathSlug: PathSlug,
  lessonId: string | null,
): boolean {
  if (!COMING_SOON_PATHS.has(pathSlug)) return false;
  if (lessonId && COMING_SOON_LESSON_EXCEPTIONS.has(lessonId)) return false;
  return true;
}

export type NodeState =
  | "completed"
  | "current"
  | "available"
  | "locked_sequential"
  | "locked_pro"
  | "locked_coming_soon";

/**
 * Re-exported for server-side checks (e.g. /lesson/[id]/page.tsx)
 * — keeps the lock list in one place.
 */
export function isComingSoonPath(slug: PathSlug): boolean {
  return COMING_SOON_PATHS.has(slug);
}

export interface MapNodeData {
  index: number; // 0-based position within the path
  lessonId: string | null; // null for placeholder nodes (paths without content yet)
  title: string | null;
  state: NodeState;
  xpEarned?: number;
  /**
   * Estimated minutes from the lesson catalog. Present whenever the lesson
   * has shipped content (mirrors lesson availability in the path). Used by
   * the dashboard Continue card and DailyGoal computation.
   */
  estimatedMinutes?: number;
  href: string | null; // null when state requires a modal instead of navigation
}

export interface MapPathSection {
  slug: PathSlug;
  title: string;
  description: string;
  isPro: boolean;
  /**
   * True when the path's lessons exist but are gated until launch
   * (Path 2 — see `COMING_SOON_PATHS`). The map renders the section
   * with locked nodes and a "in arrivo" badge; the progress bar is
   * hidden because there's no progress to show.
   */
  isComingSoon: boolean;
  isUnlocked: boolean; // sequential prerequisite met
  totalLessons: number;
  completedLessons: number;
  isCompletedAll: boolean;
  nodes: MapNodeData[];
  // Bonus paths anchored to this section, with their resolved positioning
  // (see DASHBOARD_V2.md §3 — left/right of the parent section).
  bonusAttachments: MapBonusAttachment[];
}

export type BonusSide = "left" | "right";

export interface MapBonusAttachment {
  bonus: BonusPath;
  unlock: UnlockState;
  /**
   * Catalog-declared side preference. The layout helper may override this
   * if the spine's concave at the slot lies on the other side (we always
   * favour visual coherence — see lib/map/layout.ts).
   */
  side: BonusSide;
  /**
   * Position among siblings on the same parent (0 or 1). Drives vertical
   * staggering so two bonuses on one parent don't overlap.
   */
  slotIndex: number;
}

export interface MapEndgameData {
  bonus: BonusPath; // PathT
  unlock: UnlockState;
}

export interface MapCurrentLocation {
  pathSlug: PathSlug | null;
  lessonIndex: number | null; // 0-based
  isAtStart: boolean; // true when the user has zero progress anywhere
  // True when the active lesson is a per-lesson exception on an
  // otherwise-coming-soon path (e.g. prompt-01 previewed before Path 2
  // launches). Lets the dashboard switch the ContinueCard framing from
  // "resume" to "new lessons are out".
  isFreshNewLesson: boolean;
}

export interface MapData {
  paths: MapPathSection[];
  endgame: MapEndgameData;
  current: MapCurrentLocation;
}

// ─── Bonus → side assignment ────────────────────────────────────────
// Pre-computed once because spec §3 specifies sides explicitly.
const BONUS_SIDE_BY_SLUG: Record<BonusPathSlug, BonusSide> = {
  "path-x": "right",
  "path-y": "left",
  "path-z": "left",
  "path-w": "right",
  "path-q": "left",
  "path-r": "right",
  "path-s": "left",
  "path-t": "right", // unused — endgame is rendered separately
};

// ─── Node title fallback ────────────────────────────────────────────
function placeholderTitle(slug: PathSlug, index: number, lang: Lang): string {
  const n = (index + 1).toString().padStart(2, "0");
  return lang === "it" ? `Lezione ${n}` : `Lesson ${n}`;
}

interface PathLessons {
  slug: PathSlug;
  available: AnyLessonContent[];
}

// ─── Core builder ───────────────────────────────────────────────────

export async function buildMapData(
  supabase: AppSupabaseClient,
  userId: string,
  lang: Lang,
  pathTitles: Record<PathSlug, string>,
  pathDescriptions: Record<PathSlug, string>,
): Promise<MapData> {
  const [snapshot, allProgress, ...pathLessonLists] = await Promise.all([
    getUnlockSnapshot(supabase, userId),
    getAllUserProgress(supabase, userId),
    ...PATH_ORDER.map(async (slug): Promise<PathLessons> => ({
      slug,
      available: await loadAvailableLessonsInPath(slug, lang),
    })),
  ]);

  const lessonsBySlug: Record<PathSlug, AnyLessonContent[]> = {
    mindset: [],
    prompt: [],
    build: [],
    debug: [],
    ship: [],
  };
  for (const entry of pathLessonLists) lessonsBySlug[entry.slug] = entry.available;

  const completedIdsBySlug: Record<PathSlug, Set<string>> = {
    mindset: new Set(),
    prompt: new Set(),
    build: new Set(),
    debug: new Set(),
    ship: new Set(),
  };
  const xpByLessonId = new Map<string, number>();
  for (const row of allProgress) {
    if (row.completed && row.path_slug in completedIdsBySlug) {
      completedIdsBySlug[row.path_slug as PathSlug].add(row.lesson_id);
      xpByLessonId.set(row.lesson_id, row.xp_earned);
    }
  }

  const completedAllByPath: Record<PathSlug, boolean> = snapshot.completed_paths;

  // Sequential unlocks: a path is unlocked iff its prerequisite is fully done.
  const unlockedBySlug: Record<PathSlug, boolean> = {
    mindset: true,
    prompt: false,
    build: false,
    debug: false,
    ship: false,
  };
  for (const slug of PATH_ORDER) {
    const prereq = PATH_META[slug].prerequisitePath;
    unlockedBySlug[slug] = prereq === null || completedAllByPath[prereq];
  }

  // Bonus path unlock states (one DB-free pass given we already have snapshot).
  const bonusUnlockStates = checkAllBonusPathsFromSnapshot(snapshot);

  // Locate the user's current node — first incomplete lesson in the
  // earliest non-completed unlocked path. Coming-soon paths are
  // normally skipped so the "Continue" indicator never lands on a
  // locked Path 2 node — EXCEPT when an individual lesson on that
  // coming-soon path is in COMING_SOON_LESSON_EXCEPTIONS. In that
  // case the indicator lands on the first uncompleted exempt lesson
  // (used to surface a single migrated V3 lesson on an otherwise-
  // hidden path).
  let current: MapCurrentLocation = {
    pathSlug: null,
    lessonIndex: null,
    isAtStart: false,
    isFreshNewLesson: false,
  };
  for (const slug of PATH_ORDER) {
    if (!unlockedBySlug[slug]) continue;
    if (PRO_PATHS.has(slug)) continue;
    const total = PATH_META[slug].totalLessons;
    const completedSetForSlug = completedIdsBySlug[slug];
    if (COMING_SOON_PATHS.has(slug)) {
      // Coming-soon path — look ONLY for an exempt-and-uncompleted
      // lesson. If none, skip the whole path as before.
      const available = lessonsBySlug[slug];
      let exemptIndex: number | null = null;
      for (let i = 0; i < total; i++) {
        const lesson = available[i];
        const lessonId = lesson?.id;
        if (!lessonId) continue;
        if (!COMING_SOON_LESSON_EXCEPTIONS.has(lessonId)) continue;
        if (completedSetForSlug.has(lessonId)) continue;
        exemptIndex = i;
        break;
      }
      if (exemptIndex !== null) {
        current = {
          pathSlug: slug,
          lessonIndex: exemptIndex,
          isAtStart: false,
          isFreshNewLesson: true,
        };
        break;
      }
      continue;
    }
    const completedCount = completedSetForSlug.size;
    if (completedCount < total) {
      current = {
        pathSlug: slug,
        lessonIndex: completedCount,
        isAtStart: false,
        isFreshNewLesson: false,
      };
      break;
    }
  }
  // Stuck-pawn fallback: the loop above didn't find an incomplete
  // lesson but the user has progress. This is the "finished Path 1,
  // Path 2 not yet open" case — the next path is gated, there's
  // nothing to continue, but we still want to anchor the robot to the
  // last completed lesson so the user sees their position on the map
  // (instead of an empty robot-less canvas). We walk PATH_ORDER in
  // reverse and pick the latest accessible path the user has worked
  // through; coming-soon and Pro paths are skipped because the robot
  // shouldn't pin to a locked node even if historical V1 progress
  // exists there.
  if (current.pathSlug === null && allProgress.length > 0) {
    for (let i = PATH_ORDER.length - 1; i >= 0; i--) {
      const slug = PATH_ORDER[i];
      if (PRO_PATHS.has(slug)) continue;
      if (COMING_SOON_PATHS.has(slug)) continue;
      const completedCount = completedIdsBySlug[slug].size;
      if (completedCount > 0) {
        current = {
          pathSlug: slug,
          lessonIndex: completedCount - 1,
          isAtStart: false,
          isFreshNewLesson: false,
        };
        break;
      }
    }
  }
  // Edge: brand-new user with zero progress everywhere — show the START
  // indicator near mindset lesson 0.
  if (allProgress.length === 0) {
    current = {
      pathSlug: "mindset",
      lessonIndex: 0,
      isAtStart: true,
      isFreshNewLesson: false,
    };
  }

  const paths: MapPathSection[] = PATH_ORDER.map((slug) => {
    const meta = PATH_META[slug];
    const available = lessonsBySlug[slug];
    const completedSet = completedIdsBySlug[slug];
    const isPro = PRO_PATHS.has(slug);
    const isComingSoon = COMING_SOON_PATHS.has(slug);
    const isUnlocked = unlockedBySlug[slug];

    const nodes: MapNodeData[] = [];
    for (let i = 0; i < meta.totalLessons; i++) {
      const lesson = available[i];
      const lessonId = lesson?.id ?? null;
      // Map nodes use the short navigation label so storytelling V2 titles
      // ("Il villaggio. Da dove tutto comincia.") don't blow out the node
      // width. V1 lessons just return their title via getShortTitle.
      const title = lesson
        ? getShortTitle(lesson)
        : placeholderTitle(slug, i, lang);

      let state: NodeState;
      let href: string | null = null;
      let xpEarned: number | undefined;

      // Order matters: coming-soon wins over Pro/sequential because the
      // bioma is fully laid out (we want to show all 8 nodes), the
      // prerequisite is met, the lessons exist — only the launch date
      // gates them. Exception: lessons in COMING_SOON_LESSON_EXCEPTIONS
      // bypass the path-level lock (used to preview a single migrated
      // V3 lesson on an otherwise-hidden path).
      const lessonExempt =
        lessonId !== null && COMING_SOON_LESSON_EXCEPTIONS.has(lessonId);
      if (isComingSoon && !lessonExempt) {
        state = "locked_coming_soon";
      } else if (isPro) {
        state = "locked_pro";
      } else if (!isUnlocked) {
        state = "locked_sequential";
      } else if (lessonId && completedSet.has(lessonId)) {
        state = "completed";
        xpEarned = xpByLessonId.get(lessonId);
      } else if (
        current.pathSlug === slug &&
        current.lessonIndex === i &&
        lessonId !== null
      ) {
        state = "current";
        href = `/lesson/${lessonId}`;
      } else if (lessonId !== null && i <= completedSet.size) {
        // Adjacent-to-progress: also treated as current-style (clickable);
        // strictly speaking only the first uncompleted is current, but if
        // there's a content gap we still let the user open later lessons.
        state = "available";
        href = `/lesson/${lessonId}`;
      } else if (lessonId === null) {
        // Path is unlocked but content for this index isn't shipped yet.
        state = "locked_sequential";
      } else {
        state = "locked_sequential";
      }

      nodes.push({
        index: i,
        lessonId,
        title,
        state,
        xpEarned,
        estimatedMinutes: lesson?.estimated_minutes,
        href,
      });
    }

    // Bonus paths anchored to this main path, with the side from spec §3.
    // slotIndex is assigned in catalog order — first attached bonus = slot 0.
    const bonusAttachments: MapBonusAttachment[] = listBonusPaths()
      .filter((b) => b.branch_from_path === slug)
      .map((bonus, index) => ({
        bonus,
        unlock: bonusUnlockStates[bonus.slug],
        side: BONUS_SIDE_BY_SLUG[bonus.slug],
        slotIndex: index,
      }));

    return {
      slug,
      title: pathTitles[slug],
      description: pathDescriptions[slug],
      isPro,
      isComingSoon,
      isUnlocked,
      totalLessons: meta.totalLessons,
      // For coming-soon paths we report 0 completed regardless of any
      // historical V1 progress — the section reads as "untouched, in
      // arrivo" instead of partially-done with a frozen progress bar.
      completedLessons: isComingSoon ? 0 : completedSet.size,
      isCompletedAll: completedAllByPath[slug],
      nodes,
      bonusAttachments,
    };
  });

  // Endgame: PathT (`branch_from_path: null`) — sits above Path 5.
  const endgameBonus = listBonusPaths().find((b) => b.slug === "path-t");
  if (!endgameBonus) {
    throw new Error("path-t metadata missing from BONUS_PATHS catalog");
  }
  const endgame: MapEndgameData = {
    bonus: endgameBonus,
    unlock: bonusUnlockStates["path-t"],
  };

  return { paths, endgame, current };
}
