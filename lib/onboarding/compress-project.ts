// Server-only utility: compress the user's project_description down to
// ≤80 characters with Claude Haiku 4.5, so frequent AI calls (Spark chat,
// lesson evaluators) can include the domain context without bloating
// every system prompt with the user's full prose.
//
// Generated once after onboarding step 12 (eager) and lazily back-filled
// by getUserProfile when an existing user with raw > 100 chars hits a
// page (see lib/supabase/queries.ts). Failures fall through to a
// truncate-helper view of the raw — never a hard error for the user.

import type { Lang } from "@/types";

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_OUTPUT_TOKENS = 80;
// Hard cap on the returned string. The model is asked to stay ≤80 chars,
// but we trim defensively — this is the value persisted on `users`.
export const COMPRESSED_HARD_CAP = 80;

export type CompressProjectError =
  | { kind: "missing_api_key" }
  | { kind: "anthropic_error"; status: number }
  | { kind: "network_error" }
  | { kind: "invalid_response" };

export type CompressProjectResult =
  | { ok: true; compressed: string }
  | { ok: false; error: CompressProjectError };

export interface CompressProjectInput {
  raw: string;
  lang: Lang;
}

export async function compressProjectDescription(
  input: CompressProjectInput,
): Promise<CompressProjectResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return { ok: false, error: { kind: "missing_api_key" } };
  }
  const model = process.env.ANTHROPIC_MODEL || ANTHROPIC_DEFAULT_MODEL;

  const systemPrompt = buildSystemPrompt(input.lang);

  let res: Response;
  try {
    res = await fetch(`${ANTHROPIC_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: input.raw.trim() }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: { kind: "network_error" } };
  }

  if (!res.ok) {
    return { ok: false, error: { kind: "anthropic_error", status: res.status } };
  }

  let data: { content?: Array<{ type?: string; text?: string }> };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, error: { kind: "invalid_response" } };
  }

  const raw = data.content?.find((b) => b.type === "text")?.text;
  if (typeof raw !== "string") {
    return { ok: false, error: { kind: "invalid_response" } };
  }
  // Strip surrounding quotes the model sometimes wraps the answer in,
  // collapse any whitespace, then enforce the hard cap defensively.
  const cleaned = raw
    .trim()
    .replace(/^["'«»]+|["'«»]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) {
    return { ok: false, error: { kind: "invalid_response" } };
  }
  const compressed =
    cleaned.length <= COMPRESSED_HARD_CAP
      ? cleaned
      : cleaned.slice(0, COMPRESSED_HARD_CAP).trimEnd();
  return { ok: true, compressed };
}

function buildSystemPrompt(lang: Lang): string {
  if (lang === "it") {
    return `Comprimi la descrizione del progetto utente in MASSIMO 80 caratteri.

Mantieni i concetti chiave: cosa costruisce, dominio, feature principale.

REGOLE:
- Niente articoli inutili ("il", "un", "la").
- Niente parole vuote ("voglio", "vorrei", "sto pensando di").
- Solo sostanza: nomi concreti, feature precise.
- Usa "&" al posto di "e" quando serve risparmiare caratteri.

OUTPUT:
- Restituisci SOLO il testo compresso, niente virgolette, niente prefissi tipo "Compressed:", niente spiegazioni.
- Massimo 80 caratteri. Se non ce la fai, taglia i dettagli secondari.

Esempio:
- Input: "voglio costruire un sito web per la mia agenzia di marketing che serve principalmente PMI food and beverage del centro Italia"
- Output: sito agenzia marketing PMI food&beverage centro Italia`;
  }
  return `Compress the user's project description into AT MOST 80 characters.

Keep the key concepts: what they're building, the domain, the main feature.

RULES:
- No filler articles ("the", "a").
- No empty phrases ("I want to", "I'm thinking about").
- Only substance: concrete nouns, precise features.
- Use "&" instead of "and" when characters are tight.

OUTPUT:
- Return ONLY the compressed text — no quotes, no "Compressed:" prefix, no explanation.
- At most 80 characters. If you can't, drop secondary details.

Example:
- Input: "I want to build a website for my marketing agency, serving mainly food and beverage SMEs in central Italy"
- Output: marketing agency site for food&beverage SMEs in central Italy`;
}

/**
 * Persist the compressed value. Idempotent: only writes when the column
 * is currently null OR when `force` is true (post-onboarding edits could
 * change the raw, so the caller decides).
 */
export async function storeCompressedProjectDescription(
  supabase: import("@/lib/supabase/queries").AppSupabaseClient,
  userId: string,
  compressed: string,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ project_description_compressed: compressed })
    .eq("id", userId);
  if (error) throw error;
}
