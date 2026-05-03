import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type {
  AnyLessonContent,
  ArchetypeQuizBlock,
  Lang,
  LessonContent,
  LessonV2BodyBlock,
  LessonV2Content,
  OpenQuestionBlock,
  PathSlug,
} from "@/types";
import { isPathSlug } from "@/types";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function pathDir(lang: Lang, pathSlug: PathSlug): string {
  return path.join(CONTENT_ROOT, lang, pathSlug);
}

async function readJson(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

// ─── V1 (legacy fill_blank) validator ──────────────────────────────
//
// Kept intact for backward compatibility with the lessons currently in
// production. New content authoring uses V2 — see isLessonV2Content.
function isLessonV1Content(value: unknown): value is LessonContent {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  // V1 has no format_version. If a file declares format_version it's V2 (or
  // future), and must NOT be accepted here.
  if ("format_version" in v) return false;
  return (
    typeof v.id === "string" &&
    typeof v.order === "number" &&
    typeof v.title === "string" &&
    typeof v.icon === "string" &&
    isPathSlug(v.path_slug) &&
    Array.isArray(v.theory) &&
    typeof v.exercise === "object" &&
    v.exercise !== null
  );
}

// ─── V2 (open_question + archetype_quiz) validator ─────────────────
//
// Strict: every interactive block must carry the fields the renderer and
// API route depend on. Failing loud at load time is the rule (see
// PROMPTLY.md rule 16). A malformed lesson is silently dropped from the
// listing — the lesson page returns notFound() rather than rendering a
// half-broken view.
function isOpenQuestionBlock(value: unknown): value is OpenQuestionBlock {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    b.type === "open_question" &&
    typeof b.id === "string" &&
    b.id.length > 0 &&
    typeof b.prompt === "string" &&
    b.prompt.length > 0 &&
    typeof b.system_prompt === "string" &&
    b.system_prompt.length > 0
  );
}

function isArchetypeQuizBlock(value: unknown): value is ArchetypeQuizBlock {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  if (b.type !== "archetype_quiz") return false;
  if (typeof b.id !== "string" || b.id.length === 0) return false;
  if (!Array.isArray(b.questions) || b.questions.length === 0) return false;
  if (!Array.isArray(b.archetypes) || b.archetypes.length < 2) return false;
  if (!Array.isArray(b.tie_breaker_priority)) return false;

  const archetypeKeys = new Set<string>();
  for (const a of b.archetypes) {
    if (
      typeof a !== "object" ||
      a === null ||
      typeof (a as Record<string, unknown>).key !== "string" ||
      typeof (a as Record<string, unknown>).title !== "string" ||
      typeof (a as Record<string, unknown>).description !== "string"
    ) {
      return false;
    }
    archetypeKeys.add((a as Record<string, unknown>).key as string);
  }

  // tie_breaker_priority must contain exactly the same set as archetype keys.
  const tbSet = new Set<string>();
  for (const k of b.tie_breaker_priority) {
    if (typeof k !== "string" || !archetypeKeys.has(k)) return false;
    tbSet.add(k);
  }
  if (tbSet.size !== archetypeKeys.size) return false;

  for (const q of b.questions) {
    if (typeof q !== "object" || q === null) return false;
    const qq = q as Record<string, unknown>;
    if (typeof qq.id !== "string" || typeof qq.prompt !== "string") return false;
    if (!Array.isArray(qq.options) || qq.options.length === 0) return false;
    for (const o of qq.options) {
      if (typeof o !== "object" || o === null) return false;
      const oo = o as Record<string, unknown>;
      if (
        typeof oo.key !== "string" ||
        typeof oo.label !== "string" ||
        typeof oo.archetype_key !== "string"
      ) {
        return false;
      }
      if (!archetypeKeys.has(oo.archetype_key)) return false;
    }
  }

  return true;
}

function isLessonV2BodyBlock(value: unknown): value is LessonV2BodyBlock {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  switch (b.type) {
    case "paragraph":
      return typeof b.text === "string";
    case "callout":
      return (
        typeof b.text === "string" &&
        (b.variant === "key" || b.variant === "warning" || b.variant === "tip")
      );
    case "example":
      return typeof b.label === "string" && typeof b.text === "string";
    case "simulated_output":
      return typeof b.prompt === "string" && typeof b.output === "string";
    case "comparison_table":
      return (
        typeof b.bad === "object" &&
        b.bad !== null &&
        typeof b.good === "object" &&
        b.good !== null
      );
    case "quote":
      return typeof b.text === "string" && typeof b.attribution === "string";
    case "section_heading":
      return typeof b.text === "string";
    case "open_question":
      return isOpenQuestionBlock(b);
    case "archetype_quiz":
      return isArchetypeQuizBlock(b);
    default:
      return false;
  }
}

function isLessonV2Content(value: unknown): value is LessonV2Content {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.format_version !== 2) return false;
  if (
    typeof v.id !== "string" ||
    typeof v.order !== "number" ||
    typeof v.title !== "string" ||
    typeof v.icon !== "string" ||
    !isPathSlug(v.path_slug) ||
    !Array.isArray(v.body) ||
    typeof v.outro !== "object" ||
    v.outro === null
  ) {
    return false;
  }
  // map_title is optional but when present must be a non-empty string.
  if ("map_title" in v) {
    if (typeof v.map_title !== "string" || v.map_title.length === 0) {
      return false;
    }
  }
  for (const block of v.body) {
    if (!isLessonV2BodyBlock(block)) return false;
  }
  // Cross-block id uniqueness for interactive blocks (open_question +
  // archetype_quiz). A duplicate id would break the API route lookup.
  const ids = new Set<string>();
  for (const block of v.body) {
    if (block.type === "open_question" || block.type === "archetype_quiz") {
      if (ids.has(block.id)) return false;
      ids.add(block.id);
    }
  }
  return true;
}

interface LoadedLessonFile {
  filename: string;
  lesson: AnyLessonContent;
}

async function loadLessonsForPath(
  pathSlug: PathSlug,
  lang: Lang,
): Promise<LoadedLessonFile[]> {
  let entries: string[];
  try {
    entries = await readdir(pathDir(lang, pathSlug));
  } catch {
    return [];
  }

  const jsonFiles = entries.filter((name) => name.endsWith(".json"));
  const loaded = await Promise.all(
    jsonFiles.map(async (file): Promise<LoadedLessonFile | null> => {
      const data = await readJson(path.join(pathDir(lang, pathSlug), file));
      if (isLessonV2Content(data)) return { filename: file, lesson: data };
      if (isLessonV1Content(data)) return { filename: file, lesson: data };
      return null;
    }),
  );

  return loaded.filter((l): l is LoadedLessonFile => l !== null);
}

/**
 * Returns every lesson present on disk for the given path/lang, sorted by
 * `order`. Missing/invalid JSON files are silently skipped — we only surface
 * what's actually authored. Use `PATH_META[slug].totalLessons` for the planned
 * total.
 *
 * V1/V2 coexistence (V2 rollout, see LESSON-GUIDELINES.md §3.b):
 * If both `<order>-<slug>.json` (V1) and `<order>-<slug>.v2.json` (V2) exist
 * for the same lesson id, **V2 wins** and V1 is dropped. This lets V2 files
 * land in the repo without touching V1, and the swap is just "delete V1
 * once V2 is stable".
 */
export async function loadAvailableLessonsInPath(
  pathSlug: PathSlug,
  lang: Lang,
): Promise<AnyLessonContent[]> {
  const loaded = await loadLessonsForPath(pathSlug, lang);

  // Group by lesson id; if both V1 and V2 exist, keep V2.
  const byId = new Map<string, AnyLessonContent>();
  for (const { lesson } of loaded) {
    const existing = byId.get(lesson.id);
    if (!existing) {
      byId.set(lesson.id, lesson);
      continue;
    }
    const existingIsV2 = "format_version" in existing;
    const newIsV2 = "format_version" in lesson;
    if (newIsV2 && !existingIsV2) byId.set(lesson.id, lesson);
    // else: existing wins (either both V1 or existing already V2).
  }

  return [...byId.values()].sort((a, b) => a.order - b.order);
}

/**
 * Load a single lesson by its public id (e.g. "mindset-01"). Falls back to
 * English if the requested language file doesn't exist (so a partially
 * translated path still renders). V2 wins over V1 when both exist (see
 * loadAvailableLessonsInPath).
 */
export async function loadLessonById(
  lessonId: string,
  lang: Lang,
): Promise<AnyLessonContent | null> {
  const match = /^([a-z]+)-(\d{2})$/.exec(lessonId);
  if (!match) return null;
  const [, slug] = match;
  if (!isPathSlug(slug)) return null;

  const lessons = await loadAvailableLessonsInPath(slug, lang);
  const found = lessons.find((l) => l.id === lessonId);
  if (found) return found;

  if (lang !== "en") {
    const fallback = await loadAvailableLessonsInPath(slug, "en");
    return fallback.find((l) => l.id === lessonId) ?? null;
  }
  return null;
}
