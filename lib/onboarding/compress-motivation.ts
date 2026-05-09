// Server-only utility: compress the user's deep_motivation down to ≤100
// characters with Claude Haiku 4.5, preserving the EMOTIONAL CORE
// (frustration / dream / urgency / fear). Output is in first person, as
// if the user summarised themselves — Spark uses this string as an
// "emotional anchor" in empathic interventions.
//
// Asymmetric on purpose vs. compress-project.ts: the project version
// strips fluff and keeps facts (sostantivi, dominio); the motivation
// version strips facts and keeps feelings (verbi, sensazioni). Mixing
// the two prompts would ruin both compressions.
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
const MAX_OUTPUT_TOKENS = 120;
// Hard cap on the returned string. The model is asked to stay ≤100 chars,
// but we trim defensively — this is the value persisted on `users`.
export const COMPRESSED_MOTIVATION_HARD_CAP = 100;

export type CompressMotivationError =
  | { kind: "missing_api_key" }
  | { kind: "anthropic_error"; status: number }
  | { kind: "network_error" }
  | { kind: "invalid_response" };

export type CompressMotivationResult =
  | { ok: true; compressed: string }
  | { ok: false; error: CompressMotivationError };

export interface CompressMotivationInput {
  raw: string;
  lang: Lang;
}

export async function compressMotivation(
  input: CompressMotivationInput,
): Promise<CompressMotivationResult> {
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
        // Slightly higher than the project compress (0.2) — emotional
        // paraphrasing benefits from a bit of looseness. Still low
        // enough to keep outputs deterministic across attempts.
        temperature: 0.4,
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
  // Strip surrounding quotes the model sometimes adds, collapse
  // whitespace, then enforce the hard cap defensively.
  const cleaned = raw
    .trim()
    .replace(/^["'«»]+|["'«»]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) {
    return { ok: false, error: { kind: "invalid_response" } };
  }
  const compressed =
    cleaned.length <= COMPRESSED_MOTIVATION_HARD_CAP
      ? cleaned
      : cleaned.slice(0, COMPRESSED_MOTIVATION_HARD_CAP).trimEnd();
  return { ok: true, compressed };
}

function buildSystemPrompt(lang: Lang): string {
  if (lang === "it") {
    return `Comprimi la motivazione profonda dell'utente in MASSIMO 100 caratteri.

OBIETTIVO: mantenere il NUCLEO EMOTIVO. Non perdere il sentimento — frustrazione, sogno, urgenza, paura, rivalsa, curiosità. Conta più COSA SENTE che cosa dice.

REGOLE:
- Scrivi in PRIMA PERSONA, come se fosse l'utente stesso a riassumersi ad alta voce.
- Conserva i verbi emotivi ("voglio", "non ce la faccio", "mi blocco", "non ho tempo", "ho paura").
- Taglia i dettagli tecnici, i nomi di tool, i numeri concreti — quelli vanno in project_description, non qui.
- Niente parole vuote ("un po'", "diciamo", "tipo").
- Se ci sono più sentimenti, scegli il più dominante.

OUTPUT:
- Restituisci SOLO il testo compresso, senza virgolette, prefissi tipo "Compressed:", o spiegazioni.
- Massimo 100 caratteri. Se non ce la fai, taglia i dettagli secondari ma TIENI il sentimento principale.

Esempi:
- Input: "Ho un'idea da 3 anni che non riesco a costruire, ogni volta che ci provo mi blocco perché non so programmare e i corsi che ho fatto sono troppo astratti, voglio finalmente farcela"
- Output: ho un'idea da 3 anni, mi blocco sempre, voglio farcela davvero

- Input: "Lavoro come marketing manager, vorrei imparare a costruire piccoli tool per il mio team senza dipendere ogni volta dagli sviluppatori che hanno mille altre priorità"
- Output: voglio costruire tool per il mio team senza dipendere dagli sviluppatori`;
  }
  return `Compress the user's deep motivation into AT MOST 100 characters.

GOAL: keep the EMOTIONAL CORE. Don't lose the feeling — frustration, dream, urgency, fear, redemption, curiosity. What they FEEL matters more than what they say.

RULES:
- Write in FIRST PERSON, as if the user summarised themselves out loud.
- Keep emotional verbs ("I want", "I can't", "I get stuck", "I don't have time", "I'm afraid").
- Drop technical details, tool names, concrete numbers — those belong in project_description, not here.
- No filler ("kinda", "like", "sort of").
- If multiple feelings show up, pick the dominant one.

OUTPUT:
- Return ONLY the compressed text — no quotes, no "Compressed:" prefix, no explanation.
- At most 100 characters. If you can't, drop secondary details but KEEP the main feeling.

Examples:
- Input: "I've had an idea for 3 years that I can't build, every time I try I get stuck because I don't know how to code and the courses I've taken were too abstract, I want to finally do it"
- Output: I've had an idea for 3 years, I keep getting stuck, I want to finally do it

- Input: "I work as a marketing manager, I'd love to learn to build small tools for my team without depending every time on developers who have a thousand other priorities"
- Output: I want to build tools for my team without depending on developers`;
}

/**
 * Persist the compressed value. Caller decides whether to overwrite
 * an existing non-null compressed (e.g. on a settings-page motivation
 * edit) by passing `force: true`.
 */
export async function storeCompressedMotivation(
  supabase: import("@/lib/supabase/queries").AppSupabaseClient,
  userId: string,
  compressed: string,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ deep_motivation_compressed: compressed })
    .eq("id", userId);
  if (error) throw error;
}
