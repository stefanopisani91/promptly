import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type {
  AnyLessonContent,
  ArchetypeQuizBlock,
  Lang,
  LessonContent,
  LessonV2BodyBlock,
  LessonV2Content,
  LessonV3Content,
  LessonV3Step,
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

// ─── V3 (card-step + Spark) validator ─────────────────────────────
//
// Each step type has its own structural shape. We validate just enough at
// load time to reject obviously broken JSON; the renderers trust the data
// past this point, which is why the validator is intentionally strict on
// required fields and lenient on cosmetic ones.

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isVignettesArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every(
    (v) =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as { short?: unknown }).short === "string" &&
      typeof (v as { full?: unknown }).full === "string",
  );
}

function isLessonV3Step(value: unknown): value is LessonV3Step {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  if (typeof b.id !== "string" || b.id.length === 0) return false;
  if ("vignettes" in b && b.vignettes !== undefined) {
    if (!isVignettesArray(b.vignettes)) return false;
  }
  switch (b.type) {
    case "text": {
      if (!isStringArray(b.paragraphs)) return false;
      // Optional reactive paragraphs — added in Lesson 2.
      if ("paragraphs_by_choice" in b && b.paragraphs_by_choice !== undefined) {
        const pbc = b.paragraphs_by_choice as Record<string, unknown>;
        if (
          typeof pbc !== "object" ||
          pbc === null ||
          typeof pbc.source_step_id !== "string" ||
          typeof pbc.by_key !== "object" ||
          pbc.by_key === null
        ) {
          return false;
        }
        for (const v of Object.values(pbc.by_key as Record<string, unknown>)) {
          if (!isStringArray(v)) return false;
        }
      }
      return true;
    }
    case "principle":
      return typeof b.headline === "string" && typeof b.emphasis === "string";
    case "input": {
      return (
        typeof b.prompt === "string" &&
        typeof b.system_prompt === "string" &&
        (b.system_prompt as string).length > 0 &&
        typeof b.fallback_response === "string"
      );
    }
    case "choice": {
      if (typeof b.prompt !== "string") return false;
      if (!Array.isArray(b.options) || b.options.length < 2) return false;
      return b.options.every(
        (o) =>
          typeof o === "object" &&
          o !== null &&
          typeof (o as { key?: unknown }).key === "string" &&
          typeof (o as { label?: unknown }).label === "string",
      );
    }
    case "interactive": {
      if (
        b.widget !== "lucia_prompt_loop" &&
        b.widget !== "claudemd_editor" &&
        b.widget !== "context_prompt_editor" &&
        b.widget !== "constraints_editor" &&
        b.widget !== "broken_session_debugger" &&
        b.widget !== "prompt_architecture"
      ) {
        return false;
      }
      if (typeof b.max_attempts !== "number" || b.max_attempts < 1) return false;
      if (b.widget === "lucia_prompt_loop") {
        if (
          typeof b.xp_by_band !== "object" ||
          b.xp_by_band === null ||
          typeof (b.xp_by_band as Record<string, unknown>).poor !== "number"
        ) {
          return false;
        }
      }
      if (b.widget === "claudemd_editor") {
        const cfg = b.claudemd_config as
          | Record<string, unknown>
          | undefined;
        if (!cfg || typeof cfg !== "object") return false;
        if (!Array.isArray(cfg.projects) || cfg.projects.length < 2) return false;
        if (!Array.isArray(cfg.sections) || cfg.sections.length < 1) return false;
        if (
          typeof cfg.min_chars !== "number" ||
          typeof cfg.max_chars !== "number"
        ) {
          return false;
        }
        if (
          typeof cfg.xp_by_case !== "object" ||
          cfg.xp_by_case === null ||
          typeof (cfg.xp_by_case as Record<string, unknown>).vague !== "number"
        ) {
          return false;
        }
      }
      if (b.widget === "context_prompt_editor") {
        const cfg = b.context_config as
          | Record<string, unknown>
          | undefined;
        if (!cfg || typeof cfg !== "object") return false;
        if (!Array.isArray(cfg.scenarios) || cfg.scenarios.length < 2)
          return false;
        if (
          typeof cfg.min_chars !== "number" ||
          typeof cfg.max_chars !== "number"
        ) {
          return false;
        }
        if (
          typeof cfg.xp_by_case !== "object" ||
          cfg.xp_by_case === null ||
          typeof (cfg.xp_by_case as Record<string, unknown>).incomplete !==
            "number"
        ) {
          return false;
        }
        // Each scenario must carry the empty prompt (used as the read-only
        // baseline shown to the user and forwarded to the rubric).
        for (const s of cfg.scenarios) {
          if (typeof s !== "object" || s === null) return false;
          const ss = s as Record<string, unknown>;
          if (
            typeof ss.key !== "string" ||
            typeof ss.title !== "string" ||
            typeof ss.empty_prompt !== "string"
          ) {
            return false;
          }
        }
      }
      if (b.widget === "constraints_editor") {
        const cfg = b.constraints_config as
          | Record<string, unknown>
          | undefined;
        if (!cfg || typeof cfg !== "object") return false;
        if (!Array.isArray(cfg.textareas) || cfg.textareas.length !== 3)
          return false;
        if (
          typeof cfg.min_chars_per_textarea !== "number" ||
          typeof cfg.max_chars_per_textarea !== "number"
        ) {
          return false;
        }
        if (
          typeof cfg.xp_by_case !== "object" ||
          cfg.xp_by_case === null ||
          typeof (cfg.xp_by_case as Record<string, unknown>).incomplete !==
            "number"
        ) {
          return false;
        }
        // The three textareas must each declare their kind, label and
        // placeholder. kind is one of the discriminator values the
        // evaluator scores against.
        const kinds = new Set<string>();
        for (const t of cfg.textareas) {
          if (typeof t !== "object" || t === null) return false;
          const tt = t as Record<string, unknown>;
          if (
            tt.kind !== "protective" &&
            tt.kind !== "process" &&
            tt.kind !== "style"
          ) {
            return false;
          }
          if (
            typeof tt.label !== "string" ||
            typeof tt.placeholder !== "string"
          ) {
            return false;
          }
          kinds.add(tt.kind as string);
        }
        if (kinds.size !== 3) return false;
      }
      if (b.widget === "broken_session_debugger") {
        const cfg = b.broken_session_config as
          | Record<string, unknown>
          | undefined;
        if (!cfg || typeof cfg !== "object") return false;
        if (
          typeof cfg.disclaimer !== "string" ||
          typeof cfg.address_bar !== "string" ||
          typeof cfg.pivot_question !== "string" ||
          typeof cfg.recovery_question !== "string" ||
          typeof cfg.recovery_placeholder !== "string" ||
          typeof cfg.healed_ai_reply !== "string" ||
          (cfg.healed_ai_reply as string).trim().length === 0
        ) {
          return false;
        }
        if (
          cfg.healed_branch_label !== undefined &&
          typeof cfg.healed_branch_label !== "string"
        ) {
          return false;
        }
        if (
          typeof cfg.min_chars !== "number" ||
          typeof cfg.max_chars !== "number" ||
          cfg.min_chars < 1 ||
          cfg.max_chars <= cfg.min_chars
        ) {
          return false;
        }
        if (
          !Array.isArray(cfg.messages) ||
          cfg.messages.length < 4 ||
          cfg.messages.length > 12
        ) {
          return false;
        }
        let userBubbles = 0;
        let aiBubbles = 0;
        for (const m of cfg.messages) {
          if (typeof m !== "object" || m === null) return false;
          const mm = m as Record<string, unknown>;
          if (typeof mm.text !== "string" || mm.text.trim().length === 0)
            return false;
          if (mm.role !== "user" && mm.role !== "ai") return false;
          if (mm.role === "user") userBubbles += 1;
          else aiBubbles += 1;
          // Optional decorations — narrative-tension chrome added in
          // the Lesson 5 visual refactor. All fields are optional, so
          // legacy authors keep working.
          if (mm.severity !== undefined) {
            if (
              mm.severity !== "normal" &&
              mm.severity !== "warning" &&
              mm.severity !== "critical"
            ) {
              return false;
            }
          }
          if (mm.mood_emoji !== undefined && typeof mm.mood_emoji !== "string")
            return false;
          if (mm.mood_background !== undefined) {
            if (mm.mood_background !== "stone" && mm.mood_background !== "rose")
              return false;
          }
          if (mm.time_gap_label !== undefined && typeof mm.time_gap_label !== "string")
            return false;
          if (mm.highlights !== undefined) {
            if (!Array.isArray(mm.highlights)) return false;
            for (const h of mm.highlights) {
              if (typeof h !== "object" || h === null) return false;
              const hh = h as Record<string, unknown>;
              if (typeof hh.snippet !== "string" || hh.snippet.length === 0)
                return false;
              // Only wrap snippets that actually appear in the parent
              // text — catches typos in the JSON before the user sees
              // a missing underline at runtime.
              if (!(mm.text as string).includes(hh.snippet as string))
                return false;
              if (hh.severity !== "orange" && hh.severity !== "red")
                return false;
            }
          }
        }
        if (userBubbles < 1 || aiBubbles < 1) return false;
        const PIVOT_KEYS = new Set([
          "after_response_1",
          "after_response_2",
          "after_response_3",
          "never_was_broken",
        ]);
        if (!Array.isArray(cfg.pivot_options) || cfg.pivot_options.length < 2)
          return false;
        const seenKeys = new Set<string>();
        for (const o of cfg.pivot_options) {
          if (typeof o !== "object" || o === null) return false;
          const oo = o as Record<string, unknown>;
          if (typeof oo.key !== "string" || !PIVOT_KEYS.has(oo.key))
            return false;
          if (seenKeys.has(oo.key)) return false;
          seenKeys.add(oo.key);
          if (typeof oo.label !== "string") return false;
        }
        if (
          typeof cfg.correct_pivot !== "string" ||
          !PIVOT_KEYS.has(cfg.correct_pivot) ||
          !seenKeys.has(cfg.correct_pivot)
        ) {
          return false;
        }
        if (
          typeof cfg.xp_by_case !== "object" ||
          cfg.xp_by_case === null ||
          typeof (cfg.xp_by_case as Record<string, unknown>).incomplete !==
            "number"
        ) {
          return false;
        }
      }
      if (b.widget === "prompt_architecture") {
        // Lesson 6 — drag-and-drop hero. Validates the 4 pillars and
        // their mandatory presentation strings. Order is enforced
        // client-side and hard-coded (CONTEXT → CONSTRAINTS → TASK →
        // VERIFICATION); the JSON only declares the labels and icons,
        // never the correct order.
        const cfg = b.prompt_architecture_config as
          | Record<string, unknown>
          | undefined;
        if (!cfg || typeof cfg !== "object") return false;
        if (
          typeof cfg.canvas_title !== "string" ||
          typeof cfg.canvas_subtitle !== "string" ||
          typeof cfg.empty_hint !== "string" ||
          typeof cfg.pillars_tray_label !== "string"
        ) {
          return false;
        }
        if (!Array.isArray(cfg.pillars) || cfg.pillars.length !== 4)
          return false;
        const PILLAR_KEYS = new Set([
          "context",
          "constraints",
          "task",
          "verification",
        ]);
        const seenPillars = new Set<string>();
        for (const p of cfg.pillars) {
          if (typeof p !== "object" || p === null) return false;
          const pp = p as Record<string, unknown>;
          if (typeof pp.key !== "string" || !PILLAR_KEYS.has(pp.key))
            return false;
          if (seenPillars.has(pp.key)) return false;
          seenPillars.add(pp.key);
          if (
            typeof pp.icon !== "string" ||
            typeof pp.title !== "string" ||
            typeof pp.description !== "string"
          ) {
            return false;
          }
        }
        if (seenPillars.size !== 4) return false;
      }
      return true;
    }
    case "phase_mapping": {
      // Lesson 6 step 8 — hierarchical phase → lessons map.
      if (typeof b.closing_caption !== "string") return false;
      if (!Array.isArray(b.phases) || b.phases.length !== 4) return false;
      const PHASE_KEYS = new Set([
        "setup",
        "context",
        "execution",
        "verification",
      ]);
      const seenPhases = new Set<string>();
      for (const ph of b.phases) {
        if (typeof ph !== "object" || ph === null) return false;
        const pp = ph as Record<string, unknown>;
        if (typeof pp.key !== "string" || !PHASE_KEYS.has(pp.key))
          return false;
        if (seenPhases.has(pp.key)) return false;
        seenPhases.add(pp.key);
        if (
          typeof pp.icon !== "string" ||
          typeof pp.number !== "string" ||
          typeof pp.title !== "string"
        ) {
          return false;
        }
        if (!Array.isArray(pp.lessons) || pp.lessons.length === 0)
          return false;
        for (const ls of pp.lessons) {
          if (typeof ls !== "object" || ls === null) return false;
          const ll = ls as Record<string, unknown>;
          if (typeof ll.label !== "string") return false;
          if (ll.emphasised !== undefined && typeof ll.emphasised !== "boolean")
            return false;
        }
      }
      return true;
    }
    case "error_taxonomy": {
      // 4-pair animated grid (Lesson 5 step 8). Pure presentation.
      if (typeof b.closing_caption !== "string") return false;
      if (!Array.isArray(b.pairs) || b.pairs.length !== 4) return false;
      const TAXONOMY_KEYS = new Set([
        "omission",
        "invention",
        "misinterpretation",
        "propagation",
      ]);
      const seen = new Set<string>();
      for (const p of b.pairs) {
        if (typeof p !== "object" || p === null) return false;
        const pp = p as Record<string, unknown>;
        if (typeof pp.key !== "string" || !TAXONOMY_KEYS.has(pp.key))
          return false;
        if (seen.has(pp.key)) return false;
        seen.add(pp.key);
        if (
          typeof pp.icon !== "string" ||
          typeof pp.title !== "string" ||
          typeof pp.description !== "string" ||
          typeof pp.cure_title !== "string" ||
          typeof pp.cure_reference !== "string"
        ) {
          return false;
        }
        if (pp.mapping !== "context" && pp.mapping !== "constraints")
          return false;
      }
      return true;
    }
    case "reward": {
      if (b.variant !== "archetype_reveal" && b.variant !== "milestone")
        return false;
      if (b.variant === "archetype_reveal") {
        const arch = b.archetype as
          | { archetypes?: unknown; tie_breaker_priority?: unknown }
          | undefined;
        if (
          !arch ||
          !Array.isArray(arch.archetypes) ||
          arch.archetypes.length < 2 ||
          !Array.isArray(arch.tie_breaker_priority)
        ) {
          return false;
        }
      }
      return true;
    }
    default:
      return false;
  }
}

function isLessonV3Content(value: unknown): value is LessonV3Content {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.format_version !== 3) return false;
  if (
    typeof v.id !== "string" ||
    typeof v.order !== "number" ||
    typeof v.title !== "string" ||
    typeof v.icon !== "string" ||
    typeof v.cliffhanger !== "string" ||
    !isPathSlug(v.path_slug) ||
    !Array.isArray(v.steps) ||
    v.steps.length === 0
  ) {
    return false;
  }
  const ids = new Set<string>();
  for (const step of v.steps) {
    if (!isLessonV3Step(step)) return false;
    if (ids.has((step as { id: string }).id)) return false;
    ids.add((step as { id: string }).id);
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
      if (isLessonV3Content(data)) return { filename: file, lesson: data };
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

  // Group by lesson id and pick the highest format_version. Files coexisting
  // for the same id (legacy V1 alongside the new V3, etc.) are resolved in
  // favour of the newer format so the swap is just "delete the old file once
  // the new one is stable".
  function rank(lesson: AnyLessonContent): number {
    if (
      "format_version" in lesson &&
      (lesson as { format_version?: unknown }).format_version === 3
    ) {
      return 3;
    }
    if (
      "format_version" in lesson &&
      (lesson as { format_version?: unknown }).format_version === 2
    ) {
      return 2;
    }
    return 1;
  }

  const byId = new Map<string, AnyLessonContent>();
  for (const { lesson } of loaded) {
    const existing = byId.get(lesson.id);
    if (!existing || rank(lesson) > rank(existing)) {
      byId.set(lesson.id, lesson);
    }
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
