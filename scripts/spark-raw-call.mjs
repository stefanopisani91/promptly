// One-shot raw API capture: makes ONE call to Anthropic with the live
// Spark persona and writes the COMPLETE raw response JSON (no parsing, no
// trimming) so we can verify field-by-field that prompt caching is actually
// active in production-equivalent conditions.
//
// Output:
//   scripts/_spark-raw-response.json — exact body returned by Anthropic
//   scripts/_spark-raw-meta.json     — request body sent + minimal metadata

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");
const PERSONA_SRC = path.join(ROOT, "lib/ai/spark-system-prompt.ts");
const RESPONSE_PATH = path.join(ROOT, "scripts/_spark-raw-response.json");
const META_PATH = path.join(ROOT, "scripts/_spark-raw-meta.json");

function readEnv(envPath) {
  const text = fs.readFileSync(envPath, "utf-8");
  const env = {};
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
    env[key] = val;
  }
  return env;
}

const env = readEnv(ENV_PATH);
const apiKey = env.ANTHROPIC_API_KEY;
const model = env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

if (!apiKey || !apiKey.startsWith("sk-ant-")) {
  console.error("× Missing or invalid ANTHROPIC_API_KEY in .env.local");
  process.exit(1);
}

const sourceText = fs.readFileSync(PERSONA_SRC, "utf-8");
const personaMatch = sourceText.match(
  /export const SPARK_PERSONA_IT = `([\s\S]*?)`;/,
);
if (!personaMatch) {
  console.error("× Could not extract SPARK_PERSONA_IT");
  process.exit(1);
}
const persona = personaMatch[1];

const sessionContext = `CONTESTO DELLA SESSIONE
Lezione: "L'AI esegue. Tu dirigi." (step 1 di 14)
Argomento: Il primo segreto del vibe coding non è un prompt. È come pensi.`;

const requestBody = {
  model,
  max_tokens: 220,
  temperature: 0.7,
  system: [
    {
      type: "text",
      text: persona,
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: sessionContext },
  ],
  messages: [{ role: "user", content: "Ciao, chi sei?" }],
};

console.log(`Model: ${model}`);
console.log(`Persona chars: ${persona.length}`);
console.log(`Sending one call to Anthropic...`);

const start = Date.now();
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify(requestBody),
});
const latencyMs = Date.now() - start;

const rawText = await res.text();
let parsed;
try {
  parsed = JSON.parse(rawText);
} catch {
  parsed = null;
}

fs.writeFileSync(
  RESPONSE_PATH,
  parsed ? JSON.stringify(parsed, null, 2) : rawText,
);

fs.writeFileSync(
  META_PATH,
  JSON.stringify(
    {
      requestUrl: "https://api.anthropic.com/v1/messages",
      requestHeaders: {
        "Content-Type": "application/json",
        "x-api-key": "[REDACTED]",
        "anthropic-version": "2023-06-01",
      },
      requestBodyShape: {
        model: requestBody.model,
        max_tokens: requestBody.max_tokens,
        temperature: requestBody.temperature,
        systemBlocks: requestBody.system.map((b) => ({
          type: b.type,
          textChars: b.text.length,
          cache_control: b.cache_control ?? null,
        })),
        messages: requestBody.messages,
      },
      responseStatus: res.status,
      responseHeaders: Object.fromEntries(res.headers.entries()),
      latencyMs,
    },
    null,
    2,
  ),
);

console.log(`HTTP ${res.status} in ${latencyMs}ms`);
console.log(`Raw response: ${RESPONSE_PATH}`);
console.log(`Meta:         ${META_PATH}`);
