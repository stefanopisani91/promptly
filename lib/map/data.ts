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
  LessonContent,
  PathSlug,
  UnlockState,
} from "@/types";
import { listBonusPaths } from "@/lib/bonus-paths";
import { PATH_META, PATH_ORDER } from "@/lib/lessons/paths";
import { loadAvailableLessonsInPath } from "@/lib/lessons/load";
import { getAllUserProgress, type AppSupabaseClient } from "@/lib/supabase/queries";
import { checkAllBonusPathsFromSnapshot, getUnlockSnapshot } from "@/lib/unlock";

// Path 3-5 ship without lesson content in MVP. We treat them as Pro-locked
// for everyone — once `users.subscription_tier` is wired this becomes a
// per-user decision instead.
const PRO_PATHS: ReadonlySet<PathSlug> = new Set<PathSlug>(["build", "debug", "ship"]);

export type NodeState =
  | "completed"
  | "current"
  | "available"
  | "locked_sequential"
  | "locked_pro";

export interface MapNodeData {
  index: number; // 0-based position within the path
  lessonId: string | null; // null for placeholder nodes (paths without content yet)
  title: string | null;
  state: NodeState;
  xpEarned?: number;
  href: string | null; // null when state requires a modal instead of navigation
}

export interface MapPathSection {
  slug: PathSlug;
  title: string;
  description: string;
  isPro: boolean;
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
  side: BonusSide;
  // Which lesson on the spine the island branches off from. We anchor near
  // the *last* lesson of the parent path so the bonus appears at the top
  // of its parent's section (matching DASHBOARD_V2.md §1 illustration).
  branchAtLessonIndex: number;
}

export interface MapEndgameData {
  bonus: BonusPath; // PathT
  unlock: UnlockState;
}

export interface MapCurrentLocation {
  pathSlug: PathSlug | null;
  lessonIndex: number | null; // 0-based
  isAtStart: boolean; // true when the user has zero progress anywhere
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
  available: LessonContent[];
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

  const lessonsBySlug: Record<PathSlug, LessonContent[]> = {
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
  // earliest non-completed unlocked path.
  let current: MapCurrentLocation = { pathSlug: null, lessonIndex: null, isAtStart: false };
  for (const slug of PATH_ORDER) {
    if (!unlockedBySlug[slug]) continue;
    if (PRO_PATHS.has(slug)) continue;
    const total = PATH_META[slug].totalLessons;
    const completedCount = completedIdsBySlug[slug].size;
    if (completedCount < total) {
      current = { pathSlug: slug, lessonIndex: completedCount, isAtStart: false };
      break;
    }
  }
  // Edge: brand-new user with zero progress everywhere — show the START
  // indicator near mindset lesson 0.
  if (allProgress.length === 0) {
    current = { pathSlug: "mindset", lessonIndex: 0, isAtStart: true };
  }

  const paths: MapPathSection[] = PATH_ORDER.map((slug) => {
    const meta = PATH_META[slug];
    const available = lessonsBySlug[slug];
    const completedSet = completedIdsBySlug[slug];
    const isPro = PRO_PATHS.has(slug);
    const isUnlocked = unlockedBySlug[slug];

    const nodes: MapNodeData[] = [];
    for (let i = 0; i < meta.totalLessons; i++) {
      const lesson = available[i];
      const lessonId = lesson?.id ?? null;
      const title = lesson?.title ?? placeholderTitle(slug, i, lang);

      let state: NodeState;
      let href: string | null = null;
      let xpEarned: number | undefined;

      if (isPro) {
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

      nodes.push({ index: i, lessonId, title, state, xpEarned, href });
    }

    // Bonus paths anchored to this main path, with the side from spec §3.
    const bonusAttachments: MapBonusAttachment[] = listBonusPaths()
      .filter((b) => b.branch_from_path === slug)
      .map((bonus) => ({
        bonus,
        unlock: bonusUnlockStates[bonus.slug],
        side: BONUS_SIDE_BY_SLUG[bonus.slug],
        // Anchor near the top of the parent section.
        branchAtLessonIndex: Math.max(0, meta.totalLessons - 2),
      }));

    return {
      slug,
      title: pathTitles[slug],
      description: pathDescriptions[slug],
      isPro,
      isUnlocked,
      totalLessons: meta.totalLessons,
      completedLessons: completedSet.size,
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
