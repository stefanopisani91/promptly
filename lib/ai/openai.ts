// lib/ai/openai.ts
//
// Server-only OpenAI client wrapper for the V2 lesson commentary layer.
// Reads OPENAI_API_KEY + OPENAI_MODEL from process.env at call time
// (NOT at module-init time, to avoid bundling issues if a Client Component
// ever imported this by accident — which it shouldn't, but defense in depth).
//
// Talks to the Chat Completions REST API directly via fetch — no openai
// SDK dependency to keep the bundle and the lockfile lean.
//
// Usage: only from server-side code (API routes, Server Actions). PROMPTLY.md
// rule 16 forbids global default system prompts; this module enforces the
// "system prompt is required" contract by typing the input.

const OPENAI_BASE_URL = "https://api.openai.com/v1";

export type CommentaryError =
  | { kind: "missing_api_key" }
  | { kind: "openai_error"; status: number; detail: string }
  | { kind: "network_error"; detail: string }
  | { kind: "invalid_response"; detail: string };

export type CommentaryResult =
  | { ok: true; comment: string }
  | { ok: false; error: CommentaryError };

interface CommentaryInput {
  systemPrompt: string;     // per-question, REQUIRED. See LESSON-GUIDELINES.md §11.
  userAnswer: string;       // already trimmed/length-clamped by the caller
  // Hard limit on response length, in tokens. The system prompt asks for
  // 2 sentences — 120 tokens is plenty (avg ~80 tokens for 2 short Italian
  // sentences) and caps cost on adversarial inputs.
  maxOutputTokens?: number;
  temperature?: number;     // default 0.6 — warm but consistent
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
  error?: { message?: string };
}

/**
 * Send a commentary request to OpenAI. Pure function — does no logging
 * of either the prompt or the answer (callers can log metadata if needed).
 */
export async function requestCommentary(
  input: CommentaryInput,
): Promise<CommentaryResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return { ok: false, error: { kind: "missing_api_key" } };
  }
  if (input.systemPrompt.trim().length === 0) {
    // Should be unreachable: the lesson loader rejects open_question blocks
    // with empty system_prompt. Treated as a programming error.
    return {
      ok: false,
      error: {
        kind: "invalid_response",
        detail: "empty system_prompt at runtime",
      },
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const maxTokens = input.maxOutputTokens ?? 120;
  const temperature = input.temperature ?? 0.6;

  let res: Response;
  try {
    res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userAnswer },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
      // 12s server-side timeout. The user-facing UI shows a loading state
      // and accepts a polite failure if we go over.
      signal: AbortSignal.timeout(12_000),
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
      const body = (await res.json()) as ChatCompletionResponse;
      if (body.error?.message) detail = body.error.message;
    } catch {
      // body wasn't json — keep the status-based detail
    }
    return {
      ok: false,
      error: { kind: "openai_error", status: res.status, detail },
    };
  }

  let data: ChatCompletionResponse;
  try {
    data = (await res.json()) as ChatCompletionResponse;
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: "invalid_response",
        detail: err instanceof Error ? err.message : "non-json response",
      },
    };
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return {
      ok: false,
      error: {
        kind: "invalid_response",
        detail: "empty assistant content",
      },
    };
  }
  return { ok: true, comment: content };
}
