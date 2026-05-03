// OpenAI wrapper for the landing-page Lucia demo. Server-only.
// Uses gpt-4o-mini with response_format=json_object for deterministic JSON.
// Validates the response strictly — if anything is off, returns invalid_response
// rather than risk surfacing malformed data to the UI.

import type { BugId, LuciaEvaluation } from "./types";
import { computeTotale } from "./types";
import {
  LANDING_SYSTEM_PROMPT_EN,
  LANDING_SYSTEM_PROMPT_IT,
  sniffLang,
} from "./system-prompt";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_RESPONSE_TOKENS = 350;
const REQUEST_TIMEOUT_MS = 15_000;

export type EvaluateError =
  | { kind: "missing_api_key" }
  | { kind: "openai_error"; status: number }
  | { kind: "network_error" }
  | { kind: "invalid_response" };

export type EvaluateResult =
  | { ok: true; evaluation: LuciaEvaluation }
  | { ok: false; error: EvaluateError };

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

export async function evaluateLandingPrompt(
  userPrompt: string,
): Promise<EvaluateResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return { ok: false, error: { kind: "missing_api_key" } };
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Pick the system prompt that matches the user's language. gpt-4o-mini is
  // very sensitive to system-prompt language for free-form output fields like
  // `consiglio` — feeding the matching prompt is the cheapest reliable way to
  // get an Italian advice for an Italian user and an English one for an English
  // user without a second translation call.
  const detectedLang = sniffLang(userPrompt);
  const systemPrompt =
    detectedLang === "it"
      ? LANDING_SYSTEM_PROMPT_IT
      : LANDING_SYSTEM_PROMPT_EN;

  let res: Response;
  try {
    res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        // Lower temperature → more deterministic scoring across retries.
        temperature: 0.3,
        max_tokens: MAX_RESPONSE_TOKENS,
        // Forces the model to emit valid JSON.
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: { kind: "network_error" } };
  }

  if (!res.ok) {
    return { ok: false, error: { kind: "openai_error", status: res.status } };
  }

  let data: ChatCompletionResponse;
  try {
    data = (await res.json()) as ChatCompletionResponse;
  } catch {
    return { ok: false, error: { kind: "invalid_response" } };
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    return { ok: false, error: { kind: "invalid_response" } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { ok: false, error: { kind: "invalid_response" } };
  }

  const evaluation = validateEvaluation(parsed);
  if (!evaluation) {
    return { ok: false, error: { kind: "invalid_response" } };
  }

  return { ok: true, evaluation };
}

const VALID_BUGS = new Set<BugId>(["foto", "overflow", "bottone"]);
const MAX_ADVICE_LEN = 600;

function isInt0to100(v: unknown): v is number {
  return (
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100
  );
}

function validateEvaluation(raw: unknown): LuciaEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  if (
    !isInt0to100(r.chiarezza) ||
    !isInt0to100(r.contesto) ||
    !isInt0to100(r.obiettivo) ||
    !isInt0to100(r.protezione)
  ) {
    return null;
  }

  if (
    typeof r.consiglio !== "string" ||
    r.consiglio.trim().length === 0 ||
    r.consiglio.length > MAX_ADVICE_LEN
  ) {
    return null;
  }

  if (!Array.isArray(r.bugs_menzionati)) return null;
  const bugs: BugId[] = [];
  const seen = new Set<BugId>();
  for (const b of r.bugs_menzionati) {
    if (typeof b !== "string") continue;
    if (!VALID_BUGS.has(b as BugId)) continue;
    if (seen.has(b as BugId)) continue;
    seen.add(b as BugId);
    bugs.push(b as BugId);
  }

  if (r.lingua !== "it" && r.lingua !== "en") return null;

  // Bonus signals — booleans. Default to false if missing/malformed (lenient)
  // since the model occasionally omits booleans; the calibration just won't
  // award the bonus, which is the safe default.
  const has3PlusOps =
    typeof r.has_3_plus_operational_constraints === "boolean"
      ? r.has_3_plus_operational_constraints
      : false;
  const asksExplain =
    typeof r.asks_fix_explanation === "boolean"
      ? r.asks_fix_explanation
      : false;

  const chiarezza = Math.round(r.chiarezza);
  const contesto = Math.round(r.contesto);
  const obiettivo = Math.round(r.obiettivo);
  const protezione = Math.round(r.protezione);

  const totale = computeTotale(
    chiarezza,
    contesto,
    obiettivo,
    protezione,
    bugs,
    has3PlusOps,
    asksExplain,
  );

  return {
    chiarezza,
    contesto,
    obiettivo,
    protezione,
    totale,
    consiglio: r.consiglio.trim(),
    bugs_menzionati: bugs,
    lingua: r.lingua,
  };
}
