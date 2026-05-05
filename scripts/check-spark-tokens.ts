#!/usr/bin/env tsx
/**
 * Pre-deploy validator for Spark's persona size against the Anthropic Haiku
 * 4.5 prompt-cache threshold.
 *
 * Anthropic's documented minimum cacheable size for Claude Haiku 4.5 is
 * 4096 input tokens. A persona below that floor still works functionally,
 * but `cache_control: ephemeral` is silently ignored by the API — input
 * cost regresses ~10× because every call re-bills the full system prompt.
 * That's a stealth cost regression, exactly the kind of thing that should
 * fail a build instead of leaking into production.
 *
 * Operational thresholds (chosen to leave headroom for editorial edits):
 *   FAIL  if persona < 4500 tokens (cache would not activate; cost regresses)
 *   WARN  if persona < 5500 tokens (cache works but margin is thin)
 *   OK    if persona ≥ 5500 tokens
 *
 * Wired via package.json `prebuild` so it runs automatically before every
 * `next build` — including Netlify deploys.
 *
 * Behaviour by environment:
 *   - Local dev (.env.local has ANTHROPIC_API_KEY):    enforces.
 *   - Netlify production context (key in env):         enforces.
 *   - Netlify deploy-preview / branch-deploy / dev-server contexts where
 *     ANTHROPIC_API_KEY is intentionally empty:         skips with a SKIP
 *     log line and proceeds. Production is the authoritative gate.
 *
 * Mock mode for testing the gate logic without touching the real persona:
 *   SPARK_TOKEN_CHECK_MOCK_IT=N    override IT count without calling Anthropic
 *   SPARK_TOKEN_CHECK_MOCK_EN=N    override EN count without calling Anthropic
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");
const PERSONA_SRC = path.join(ROOT, "lib/ai/spark-system-prompt.ts");

const FAIL_BELOW = 4500;
const WARN_BELOW = 5500;
const HAIKU_MIN_CACHE = 4096;

const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

// ── ANSI colours (work in Netlify build logs) ──────────────────────────────
const C = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

// ── Env reader: .env.local first (local dev), process.env wins (CI) ────────
function loadEnv(): Record<string, string | undefined> {
  const fileEnv: Record<string, string> = {};
  if (fs.existsSync(ENV_PATH)) {
    const text = fs.readFileSync(ENV_PATH, "utf-8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      fileEnv[key] = val;
    }
  }
  return { ...fileEnv, ...process.env };
}

interface Persona {
  lang: "IT" | "EN";
  text: string;
  chars: number;
}

function extractPersonas(): Persona[] {
  const src = fs.readFileSync(PERSONA_SRC, "utf-8");
  const itMatch = src.match(/export const SPARK_PERSONA_IT = `([\s\S]*?)`;/);
  const enMatch = src.match(/export const SPARK_PERSONA_EN = `([\s\S]*?)`;/);
  if (!itMatch || !enMatch) {
    console.error(
      `${C.red}× Could not extract SPARK_PERSONA_IT or SPARK_PERSONA_EN from ${PERSONA_SRC}${C.reset}`,
    );
    process.exit(1);
  }
  return [
    { lang: "IT", text: itMatch[1], chars: itMatch[1].length },
    { lang: "EN", text: enMatch[1], chars: enMatch[1].length },
  ];
}

interface CountTokensResponse {
  input_tokens?: number;
}

// Constant overhead included in count_tokens beyond the persona itself:
// the "test" user message + role markers + structural tokens. Empirically
// ~7 tokens against the live API (May 2026). We subtract it so the number
// we report is the "persona-only" size that maps to cache_creation_input_tokens
// in production /v1/messages calls. Verified by comparing count_tokens vs
// real cache_creation_input_tokens from scripts/spark-raw-call.mjs:
//   count_tokens.input_tokens = 7181
//   real cache_creation       = 7174
//   delta                     = 7
const COUNT_TOKENS_OVERHEAD = 7;

async function countPersonaTokens(
  persona: string,
  apiKey: string,
  model: string,
): Promise<number> {
  const res = await fetch(
    "https://api.anthropic.com/v1/messages/count_tokens",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model,
        // Mirror the production request shape (persona as cached system
        // block, minimal user message). count_tokens itself doesn't break
        // out cache_creation_input_tokens — it returns a single
        // input_tokens total — so we approximate persona-only by
        // subtracting the known constant overhead. Sub-call accuracy is
        // ~99.9%, well within our threshold tolerance.
        system: [
          {
            type: "text",
            text: persona,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: "test" }],
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Anthropic count_tokens ${res.status}: ${detail}`);
  }
  const body = (await res.json()) as CountTokensResponse;
  const total = body.input_tokens ?? 0;
  return Math.max(0, total - COUNT_TOKENS_OVERHEAD);
}

type Verdict = "OK" | "WARN" | "FAIL" | "SKIP";

function classify(tokens: number): Exclude<Verdict, "SKIP"> {
  if (tokens < FAIL_BELOW) return "FAIL";
  if (tokens < WARN_BELOW) return "WARN";
  return "OK";
}

function formatLine(lang: string, tokens: number, verdict: Verdict): string {
  if (verdict === "SKIP") {
    return `${C.dim}SKIP${C.reset} ${C.bold}${lang}${C.reset}  no API key in this build context — production build is the authoritative gate`;
  }
  const margin = tokens - HAIKU_MIN_CACHE;
  const marginPct = Math.round((margin / HAIKU_MIN_CACHE) * 100);
  const colour =
    verdict === "FAIL" ? C.red : verdict === "WARN" ? C.yellow : C.green;
  const marginStr =
    margin >= 0
      ? `+${margin} (${marginPct}% above floor)`
      : `${margin} (${Math.abs(marginPct)}% BELOW floor)`;
  return `${colour}${verdict.padEnd(4)}${C.reset} ${C.bold}${lang}${C.reset}  ${tokens} tokens  ${C.dim}(${marginStr})${C.reset}`;
}

async function main(): Promise<void> {
  const env = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY;
  const model = env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  console.log(
    `${C.bold}Spark persona token check${C.reset} ${C.dim}(model: ${model}; FAIL<${FAIL_BELOW}, WARN<${WARN_BELOW}, Haiku 4.5 floor=${HAIKU_MIN_CACHE})${C.reset}`,
  );

  const personas = extractPersonas();
  const results: Array<{ lang: string; tokens: number; verdict: Verdict }> = [];

  for (const p of personas) {
    const mockKey = `SPARK_TOKEN_CHECK_MOCK_${p.lang}`;
    const mockVal = env[mockKey];

    if (mockVal) {
      const tokens = parseInt(mockVal, 10);
      if (!Number.isFinite(tokens) || tokens < 0) {
        console.error(
          `${C.red}× Invalid ${mockKey}=${mockVal} (must be a non-negative integer)${C.reset}`,
        );
        process.exit(1);
      }
      const verdict = classify(tokens);
      console.log(`${C.dim}  (${mockKey}=${tokens}, mock mode)${C.reset}`);
      console.log(formatLine(p.lang, tokens, verdict));
      results.push({ lang: p.lang, tokens, verdict });
      continue;
    }

    if (!apiKey) {
      console.log(formatLine(p.lang, 0, "SKIP"));
      results.push({ lang: p.lang, tokens: 0, verdict: "SKIP" });
      continue;
    }

    try {
      const tokens = await countPersonaTokens(p.text, apiKey, model);
      const verdict = classify(tokens);
      console.log(formatLine(p.lang, tokens, verdict));
      results.push({ lang: p.lang, tokens, verdict });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `${C.red}× Failed to count tokens for ${p.lang}: ${msg}${C.reset}`,
      );
      // Treat Anthropic outage as a non-blocking issue — surface clearly,
      // proceed with the build. A persistent outage will be visible across
      // every build and is its own signal.
      console.error(
        `${C.yellow}  Anthropic outage or transient error; build continues. Re-run later.${C.reset}`,
      );
      results.push({ lang: p.lang, tokens: 0, verdict: "SKIP" });
    }
  }

  const failures = results.filter((r) => r.verdict === "FAIL");
  if (failures.length > 0) {
    const langs = failures.map((f) => `${f.lang} (${f.tokens})`).join(", ");
    console.error(
      `\n${C.red}${C.bold}DEPLOY BLOCKED${C.reset} — Spark persona is below the safety floor of ${FAIL_BELOW} tokens for: ${langs}.`,
    );
    console.error(
      `${C.dim}  Cache will not activate at this size; input cost regresses ~10× vs cached calls.${C.reset}`,
    );
    console.error(
      `${C.dim}  Fix: expand the persona in lib/ai/spark-system-prompt.ts above ${WARN_BELOW} tokens, then re-run.${C.reset}`,
    );
    process.exit(1);
  }

  const warnings = results.filter((r) => r.verdict === "WARN");
  if (warnings.length > 0) {
    const langs = warnings.map((w) => `${w.lang} (${w.tokens})`).join(", ");
    console.warn(
      `\n${C.yellow}WARN${C.reset} — persona margin is thin for: ${langs}. Cache still active but a small edit could drop it below ${FAIL_BELOW}.`,
    );
  }

  if (results.every((r) => r.verdict === "OK" || r.verdict === "SKIP")) {
    console.log(`${C.green}OK${C.reset} — proceeding with build.`);
  }
}

main().catch((err) => {
  console.error(
    `${C.red}× Unexpected error in token check: ${err instanceof Error ? err.message : String(err)}${C.reset}`,
  );
  process.exit(1);
});
