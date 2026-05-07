// Generates the three personalised promises shown at STEP 11 of onboarding
// (Profilazione.md §"Le 3 Promesse Personalizzate"). Calls Claude Haiku 4.5
// via the existing /v1/messages helper in lib/ai/anthropic.ts — no new HTTP
// surface, no SDK. The system prompt asks for a strict JSON object so we can
// parse without LLM-prose wrangling.
//
// Design choices:
//   - Single fetch, no retries: an 8-second timeout caps the user-facing
//     wait. If the model is slow or down, we fall back to three pre-written
//     promises (per spec §"Errori da evitare").
//   - Persona is reused via lib/ai/spark-system-prompt.ts so Spark stays in
//     character. The promise-specific instructions sit in the session-context
//     block — fresh on every call (different user, different data).
//   - Output shape: ProfilePromises with `source: 'anthropic' | 'fallback'`
//     so settings can show whether the user is on a fallback set and offer a
//     "regenerate" CTA.
//
// We do NOT log the prompt or the user's deep_motivation — privacy-by-default.

import { requestSparkReply, ANTHROPIC_DEFAULT_MODEL } from "@/lib/ai/anthropic";
import { SPARK_PERSONA_EN, SPARK_PERSONA_IT } from "@/lib/ai/spark-system-prompt";
import {
  toolDisplayName,
  type ToolMeta,
} from "@/lib/onboarding/tools";
import type {
  DailyGoal,
  ExperienceLevel,
  Lang,
  ProfilePromises,
  ProjectClarity,
} from "@/types";
import { getProfilingCopy } from "@/lib/i18n/profiling";

export interface PromiseGenerationInput {
  language: Lang;
  user_name: string;
  experience_level: ExperienceLevel;
  project_clarity: ProjectClarity;
  project_description: string | null;
  tools_used: string[];
  preferred_tool: string | null;
  daily_goal: DailyGoal;
  deep_motivation: string;
}

export interface PromiseGenerationResult {
  promises: ProfilePromises;
  // Surface the failure reason for analytics/logging when we fell back.
  fallback_reason?:
    | "missing_api_key"
    | "anthropic_error"
    | "network_error"
    | "invalid_response"
    | "parse_error";
}

const PROMISE_OUTPUT_TOKENS = 600;
const PROMISE_TEMPERATURE = 0.7;

/**
 * Top-level entry — orchestrates the model call and falls back to static
 * promises on any failure. Always resolves; never throws.
 */
export async function generateProfilePromises(
  input: PromiseGenerationInput,
): Promise<PromiseGenerationResult> {
  const persona =
    input.language === "en" ? SPARK_PERSONA_EN : SPARK_PERSONA_IT;
  const sessionContext = buildPromiseInstructions(input);

  const reply = await requestSparkReply({
    persona,
    sessionContext,
    userMessage: buildUserMessage(input),
    maxOutputTokens: PROMISE_OUTPUT_TOKENS,
    temperature: PROMISE_TEMPERATURE,
  });

  if (!reply.ok) {
    return {
      promises: fallbackPromises(input.language),
      fallback_reason: reply.error.kind,
    };
  }

  const parsed = parseModelJson(reply.reply);
  if (!parsed) {
    return {
      promises: fallbackPromises(input.language),
      fallback_reason: "parse_error",
    };
  }

  return {
    promises: {
      promise_1: parsed.promise_1,
      promise_2: parsed.promise_2,
      promise_3: parsed.promise_3,
      generated_at: new Date().toISOString(),
      source: "anthropic",
      model: process.env.ANTHROPIC_MODEL || ANTHROPIC_DEFAULT_MODEL,
    },
  };
}

function fallbackPromises(lang: Lang): ProfilePromises {
  const copy = getProfilingCopy(lang);
  return {
    ...copy.step11.fallbackPromises,
    generated_at: new Date().toISOString(),
  };
}

// ─── Prompt builders ──────────────────────────────────────────────────

function buildPromiseInstructions(input: PromiseGenerationInput): string {
  const lang = input.language;
  const langLabel = lang === "en" ? "English" : "Italian";

  const toolsLabel =
    input.tools_used.length === 0
      ? lang === "en"
        ? "none"
        : "nessuno"
      : input.tools_used
          .map((slug) => toolDisplayName(slug, lang))
          .join(", ");
  const preferred =
    input.preferred_tool && input.preferred_tool.trim().length > 0
      ? toolDisplayName(input.preferred_tool, lang)
      : lang === "en"
        ? "none"
        : "nessuno";
  const project =
    input.project_description && input.project_description.trim().length > 0
      ? input.project_description.trim()
      : lang === "en"
        ? "not specified"
        : "non specificata";
  const dailyTimeLabel = describeDailyGoal(input.daily_goal, lang);
  const experienceLabel = describeExperience(input.experience_level, lang);
  const clarityLabel = describeClarity(input.project_clarity, lang);

  // Block sent to Anthropic. The english/italian variants share structure
  // so the model produces the same shape regardless of user language.
  return [
    `# CONTEXT — onboarding profilazione, output language: ${langLabel}.`,
    "",
    "Sei Spark, mascotte di Promptly. Devi generare ESATTAMENTE 3 promesse personalizzate per l'utente che ha appena completato la profilazione.",
    "",
    `DATI UTENTE:`,
    `- Nome: ${input.user_name}`,
    `- Lingua: ${langLabel}`,
    `- Livello: ${experienceLabel}`,
    `- Chiarezza progetto: ${clarityLabel}`,
    `- Descrizione progetto: ${project}`,
    `- Tool usati: ${toolsLabel}`,
    `- Tool preferito: ${preferred}`,
    `- Tempo al giorno: ${dailyTimeLabel}`,
    `- Motivazione profonda: ${input.deep_motivation}`,
    "",
    "REGOLE:",
    "1. Ogni promessa deve essere SPECIFICA — richiama un dato dell'utente, mai frasi generiche.",
    "2. Massimo 2-3 frasi per promessa.",
    "3. Tono: asciutto, nella tua voce naturale, prima persona.",
    "4. Nessuna promessa irrealistica (non promettere ricchezza, fama, miracoli).",
    "5. La terza promessa deve essere quella emotivamente più forte e richiamare la motivazione profonda dell'utente, citando il suo nome.",
    `6. Lingua dell'output: ${langLabel}.`,
    "",
    "OUTPUT: rispondi SOLO con un oggetto JSON valido in questa forma esatta, senza testo introduttivo, senza markdown, senza code fences:",
    '{"promise_1":"...","promise_2":"...","promise_3":"..."}',
  ].join("\n");
}

function buildUserMessage(input: PromiseGenerationInput): string {
  return input.language === "en"
    ? `Generate the three promises for ${input.user_name}.`
    : `Genera le tre promesse per ${input.user_name}.`;
}

function describeExperience(level: ExperienceLevel, lang: Lang): string {
  const it: Record<ExperienceLevel, string> = {
    beginner: "principiante (mai provato)",
    tried_failed: "ha provato ma si è incartato",
    working_on_it: "ci sta già lavorando, vuole metodo",
    advanced: "avanzato, cerca struttura seria",
  };
  const en: Record<ExperienceLevel, string> = {
    beginner: "beginner (never tried)",
    tried_failed: "has tried but kept getting stuck",
    working_on_it: "already at it, wants a better method",
    advanced: "advanced, looking for serious structure",
  };
  return (lang === "en" ? en : it)[level];
}

function describeClarity(clarity: ProjectClarity, lang: Lang): string {
  const it: Record<ProjectClarity, string> = {
    precise: "ha un'idea precisa",
    vague: "ha un'idea che sta nascendo",
    exploring: "sta ancora esplorando, niente idea fissa",
  };
  const en: Record<ProjectClarity, string> = {
    precise: "has a precise idea",
    vague: "has an idea still forming",
    exploring: "still exploring, no fixed idea",
  };
  return (lang === "en" ? en : it)[clarity];
}

function describeDailyGoal(goal: DailyGoal, lang: Lang): string {
  const it: Record<DailyGoal, string> = {
    mini: "5 minuti",
    trivial: "10 minuti",
    easy: "15 minuti",
    pro: "30 minuti",
  };
  const en: Record<DailyGoal, string> = {
    mini: "5 minutes",
    trivial: "10 minutes",
    easy: "15 minutes",
    pro: "30 minutes",
  };
  return (lang === "en" ? en : it)[goal];
}

// ─── Parser ───────────────────────────────────────────────────────────
//
// The model is instructed to emit a bare JSON object. We still defend
// against a polite preamble or trailing prose by extracting the first
// {...} block before parsing.

interface ParsedPromises {
  promise_1: string;
  promise_2: string;
  promise_3: string;
}

function parseModelJson(raw: string): ParsedPromises | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const candidate = trimmed.slice(start, end + 1);

  let data: unknown;
  try {
    data = JSON.parse(candidate);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const p1 = typeof obj.promise_1 === "string" ? obj.promise_1.trim() : "";
  const p2 = typeof obj.promise_2 === "string" ? obj.promise_2.trim() : "";
  const p3 = typeof obj.promise_3 === "string" ? obj.promise_3.trim() : "";
  if (!p1 || !p2 || !p3) return null;
  return { promise_1: p1, promise_2: p2, promise_3: p3 };
}

// Used in tests; exported for the unit testing surface that may land later.
export const __test = { buildPromiseInstructions, parseModelJson };
export type { ToolMeta };
