// lib/ai/anthropic.ts
//
// Server-only Anthropic Messages API client for Spark's free chat.
// Reads ANTHROPIC_API_KEY + ANTHROPIC_MODEL + ANTHROPIC_MAX_TOKENS from
// process.env at call time (NOT module init) — same pattern as
// lib/ai/openai.ts, so an accidental client-side import doesn't crash
// the bundle, it only fails the call.
//
// Talks to /v1/messages directly via fetch — no @anthropic-ai/sdk dependency,
// matching the deliberate "no SDK" choice in lib/ai/openai.ts (keeps the
// bundle and the lockfile lean).
//
// Why this exists separately from lib/ai/openai.ts:
//   - Spark is migrating to Claude Haiku 4.5 (see
//     Promptly_Spark_Master_Configuration.md §6, "Sessione 1") for character
//     coherence and prompt-cache savings.
//   - The lesson commentary path (app/api/comment-answer) and the Lucia
//     landing demo (app/api/landing-evaluate) stay on OpenAI for now —
//     their prompts and tests are calibrated to gpt-4o-mini.
//
// Prompt caching: the persona block is marked cache_control: ephemeral so
// Anthropic memoises it for ~5 min and only the (smaller) session-context
// block is re-billed full price on each call.
//
// IMPORTANT — caching minimum: ephemeral caching only kicks in when the
// cached content reaches the per-model token floor (1024 tokens for Haiku
// 4.5 at the time of writing). The current Spark persona is shorter than
// that, so the cache_control flag is effectively a no-op until the persona
// is expanded to the full master version
// (Promptly_Spark_Master_Configuration.md §1). The flag is placed now so
// the migration to the longer persona becomes a content-only change.

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_API_VERSION = "2023-06-01";

// Pinned canonical model id. Mirrored verbatim in .env.example so an env
// typo can't silently swap us onto a different Claude — the fallback here
// is the exact same string we ask the operator to set.
//
// If you ever need to bump this, update BOTH this constant AND .env.local /
// .env.example AND re-run the Spark coherence test
// (Promptly_Spark_Master_Configuration.md §7, Test 1).
export const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_DEFAULT_MAX_TOKENS = 300;
const ANTHROPIC_DEFAULT_TEMPERATURE = 0.7;
const REQUEST_TIMEOUT_MS = 12_000;

export type SparkReplyError =
  | { kind: "missing_api_key" }
  | { kind: "anthropic_error"; status: number; detail: string }
  | { kind: "network_error"; detail: string }
  | { kind: "invalid_response"; detail: string };

export type SparkReplyResult =
  | { ok: true; reply: string }
  | { ok: false; error: SparkReplyError };

interface SparkReplyInput {
  /** Stable persona text — eligible for prompt caching when long enough. */
  persona: string;
  /** Per-call session context (lesson, step, contextSummary). NOT cached. */
  sessionContext: string;
  /** The user's free-form message. */
  userMessage: string;
  /** Hard cap on output tokens. Falls back to ANTHROPIC_MAX_TOKENS env, then 300. */
  maxOutputTokens?: number;
  temperature?: number;
}

interface MessagesResponse {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

/**
 * Send a Spark chat request to Anthropic. Pure function — does no logging
 * of either the prompt or the user message (callers can log metadata).
 */
export async function requestSparkReply(
  input: SparkReplyInput,
): Promise<SparkReplyResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return { ok: false, error: { kind: "missing_api_key" } };
  }
  if (input.persona.trim().length === 0) {
    return {
      ok: false,
      error: { kind: "invalid_response", detail: "empty persona at runtime" },
    };
  }

  const model = process.env.ANTHROPIC_MODEL || ANTHROPIC_DEFAULT_MODEL;
  const envMaxTokens = parseEnvInt(process.env.ANTHROPIC_MAX_TOKENS);
  const maxTokens =
    input.maxOutputTokens ?? envMaxTokens ?? ANTHROPIC_DEFAULT_MAX_TOKENS;
  const temperature = input.temperature ?? ANTHROPIC_DEFAULT_TEMPERATURE;

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
        max_tokens: maxTokens,
        temperature,
        // Two system blocks. Anthropic caches up to (and including) the last
        // block flagged with cache_control, so the persona is cached and the
        // dynamic session context stays fresh on every call.
        system: [
          {
            type: "text",
            text: input.persona,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: input.sessionContext,
          },
        ],
        messages: [{ role: "user", content: input.userMessage }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: "network_error",
        detail: err instanceof Error ? err.message : "fetch failed",
      },
    };
  }

  if (!res.ok) {
    let detail = `status ${res.status}`;
    try {
      const body = (await res.json()) as MessagesResponse;
      if (body.error?.message) detail = body.error.message;
    } catch {
      // body wasn't json — keep the status-based detail
    }
    return {
      ok: false,
      error: { kind: "anthropic_error", status: res.status, detail },
    };
  }

  let data: MessagesResponse;
  try {
    data = (await res.json()) as MessagesResponse;
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: "invalid_response",
        detail: err instanceof Error ? err.message : "non-json response",
      },
    };
  }

  // Anthropic returns content as an array of blocks. We only ask for plain
  // text (no tool use), so we expect a single text block.
  const firstText = data.content?.find((b) => b.type === "text")?.text?.trim();
  if (!firstText) {
    return {
      ok: false,
      error: { kind: "invalid_response", detail: "empty assistant content" },
    };
  }
  return { ok: true, reply: firstText };
}

function parseEnvInt(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
