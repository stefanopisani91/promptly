import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Lang, LessonContent, PathSlug } from "@/types";
import { isPathSlug } from "@/types";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function pathDir(lang: Lang, pathSlug: PathSlug): string {
  return path.join(CONTENT_ROOT, lang, pathSlug);
}

async function readJson(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function isLessonContent(value: unknown): value is LessonContent {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
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

/**
 * Returns every lesson present on disk for the given path/lang, sorted by
 * `order`. Missing JSON files are silently skipped — we only surface what's
 * actually authored. Use `PATH_META[slug].totalLessons` for the planned total.
 */
export async function loadAvailableLessonsInPath(
  pathSlug: PathSlug,
  lang: Lang,
): Promise<LessonContent[]> {
  let entries: string[];
  try {
    entries = await readdir(pathDir(lang, pathSlug));
  } catch {
    return [];
  }

  const jsonFiles = entries.filter((name) => name.endsWith(".json"));
  const lessons = await Promise.all(
    jsonFiles.map(async (file) => {
      const data = await readJson(path.join(pathDir(lang, pathSlug), file));
      return isLessonContent(data) ? data : null;
    }),
  );

  return lessons
    .filter((l): l is LessonContent => l !== null)
    .sort((a, b) => a.order - b.order);
}

/**
 * Load a single lesson by its public id (e.g. "mindset-01"). Falls back to
 * English if the requested language file doesn't exist (so a partially
 * translated path still renders).
 */
export async function loadLessonById(
  lessonId: string,
  lang: Lang,
): Promise<LessonContent | null> {
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
