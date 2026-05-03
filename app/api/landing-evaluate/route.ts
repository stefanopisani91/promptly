// Public API for the landing-page Lucia demo. NO auth gate (the landing is
// public), so the anti-abuse stack is the only line of defence:
//   - In-memory sliding-window rate limit (per-IP + global) — see rate-limit.ts
//   - Honeypot field (rejects naive bots filling the entire form)
//   - Input cap: 1500 chars before LLM call
//   - Prompt-injection signature filter (cheap pre-check)
//   - max_tokens cap on the LLM response (cost ceiling per call)
//   - Strict JSON schema validation on the LLM response
//   - The OpenAI Project budget cap is the financial backstop
//
// We deliberately do NOT log the user's prompt — the demo is anonymous and
// public; capturing what people type would be both creepy and a GDPR issue.

import { NextResponse } from "next/server";
import { checkAndRecord, extractClientIp } from "@/lib/landing-demo/rate-limit";
import { evaluateLandingPrompt } from "@/lib/landing-demo/openai-evaluate";

const MAX_PROMPT_CHARS = 1500;
const MIN_PROMPT_CHARS = 4;

// Cheap pre-check for the most obvious prompt-injection patterns. Not
// exhaustive — the system prompt is the real defence — but blocks the
// laziest attempts before they cost us a token.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /you\s+are\s+(now\s+)?a\s+different\s+(assistant|ai|model)/i,
  /system\s+prompt\s*[:=]/i,
  /\bjailbreak\b/i,
  /sei\s+(ora\s+)?un\s+assistente\s+diverso/i,
  /ignora\s+(tutte\s+)?le\s+istruzioni\s+precedenti/i,
];

interface RequestBody {
  prompt?: unknown;
  /** Honeypot — must be absent or empty. Filled = bot. */
  hp?: unknown;
}

export async function POST(request: Request) {
  // 1. Parse body.
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // 2. Honeypot — silently succeed-as-failure for bots (no useful signal back).
  if (typeof body.hp === "string" && body.hp.trim().length > 0) {
    // Pretend success so bots don't iterate, but don't burn LLM tokens.
    return NextResponse.json({ error: "invalid_prompt" }, { status: 400 });
  }

  // 3. Validate prompt shape.
  const promptRaw = body.prompt;
  if (typeof promptRaw !== "string") {
    return NextResponse.json({ error: "invalid_prompt" }, { status: 400 });
  }
  const prompt = promptRaw.trim();
  if (prompt.length < MIN_PROMPT_CHARS) {
    return NextResponse.json({ error: "empty_prompt" }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json({ error: "prompt_too_long" }, { status: 413 });
  }

  // 4. Cheap injection pre-filter. Treated as "invalid_prompt" without
  //    surfacing the real reason — keeps the filter useful.
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return NextResponse.json({ error: "invalid_prompt" }, { status: 400 });
    }
  }

  // 5. Rate limit.
  const ip = extractClientIp(request.headers);
  const limit = checkAndRecord(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", reason: limit.reason },
      { status: 429 },
    );
  }

  // 6. Call the model.
  const result = await evaluateLandingPrompt(prompt);
  if (!result.ok) {
    if (result.error.kind === "missing_api_key") {
      return NextResponse.json({ error: "missing_api_key" }, { status: 503 });
    }
    if (result.error.kind === "network_error") {
      return NextResponse.json({ error: "network_error" }, { status: 502 });
    }
    if (result.error.kind === "openai_error") {
      const code =
        result.error.status >= 400 && result.error.status < 500
          ? result.error.status
          : 502;
      return NextResponse.json({ error: "openai_error" }, { status: code });
    }
    return NextResponse.json({ error: "invalid_ai_response" }, { status: 502 });
  }

  return NextResponse.json({ evaluation: result.evaluation });
}

export const dynamic = "force-dynamic";
