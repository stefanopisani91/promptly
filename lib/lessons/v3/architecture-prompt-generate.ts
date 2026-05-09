// Server-only generator for Lesson 6's prompt-architecture hero
// widget. Takes the user's project_description (Haiku-compressed
// view, ≤80 char) + their tools_used and returns three personalised
// blocks the client typewrites into the canvas:
//
//   - context       — 1–2 sentences on what the user is building
//   - constraints   — 3 specific constraints (protective + process
//                     + style) for the project type
//   - verification  — 2 actions the user will run after the AI
//                     replies, specific to the project
//
// Mirrors the shape of constraints-evaluate.ts / debug-evaluate.ts
// (same Anthropic call shape, same error union, same prompt-cache
// header) so the API route stays symmetric with the rest of the
// V3 surface. Output is short (~200 tokens), one Haiku call per
// successful walkthrough — bill ≈ $0.001 per user.

import type { Lang } from "@/types";

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 350;

export interface GeneratedPromptBlocks {
  context: string;
  constraints: string;
  verification: string;
}

export interface ArchitectureGenerateInput {
  lang: Lang;
  // ≤80-char compressed view of the user's project_description.
  // Falls back to a generic "il mio progetto" when null (legacy
  // user / skipped onboarding step) — the system prompt produces
  // a usable fallback in that case.
  projectDescription: string | null;
  // Free-form list of tool slugs the user picked in onboarding
  // (`["nextjs","supabase","tailwind",…]`). Used as stack hint.
  // Empty array is fine — the prompt then writes "stack TBD".
  toolsUsed: readonly string[];
  // Display name of the user's preferred tool ("Cursor", "Claude
  // Code", …) — for context only, not surfaced verbatim in the
  // generated text.
  preferredTool: string | null;
  // Experience level snapshot — affects nothing in the rubric,
  // forwarded purely so the model can match the user's vocabulary
  // (a beginner gets simpler constraints than an advanced dev).
  experienceLevel: string | null;
}

export type ArchitectureGenerateError =
  | { kind: "missing_api_key" }
  | { kind: "anthropic_error"; status: number }
  | { kind: "network_error" }
  | { kind: "invalid_response" };

export type ArchitectureGenerateResult =
  | { ok: true; blocks: GeneratedPromptBlocks }
  | { ok: false; error: ArchitectureGenerateError };

export async function generateArchitecturePrompt(
  input: ArchitectureGenerateInput,
): Promise<ArchitectureGenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return { ok: false, error: { kind: "missing_api_key" } };
  }
  const model = process.env.ANTHROPIC_MODEL || ANTHROPIC_DEFAULT_MODEL;

  const systemPrompt = buildSystemPrompt(input.lang);
  const userMessage = buildUserMessage(input);

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
        temperature: 0.55,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: { kind: "network_error" } };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: { kind: "anthropic_error", status: res.status },
    };
  }

  let data: { content?: Array<{ type?: string; text?: string }> };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, error: { kind: "invalid_response" } };
  }

  const text = data.content?.find((b) => b.type === "text")?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    console.error(
      "[architecture-prompt-generate] no text in response",
      JSON.stringify(data).slice(0, 400),
    );
    return { ok: false, error: { kind: "invalid_response" } };
  }
  const parsed = safeParseJson(text);
  if (!parsed) {
    console.error(
      "[architecture-prompt-generate] failed to parse JSON; raw:",
      text.slice(0, 600),
    );
    return { ok: false, error: { kind: "invalid_response" } };
  }
  const blocks = validateBlocks(parsed);
  if (!blocks) {
    console.error(
      "[architecture-prompt-generate] validation failed; parsed:",
      JSON.stringify(parsed),
    );
    return { ok: false, error: { kind: "invalid_response" } };
  }
  return { ok: true, blocks };
}

function buildSystemPrompt(lang: Lang): string {
  if (lang === "it") {
    return `Sei un generatore di prompt giornaliero per vibe coding. Devi scrivere 3 blocchi di testo che andranno dentro un prompt che l'utente userà ogni mattina con il suo IDE AI.

I 3 blocchi sono CONTESTO, VINCOLI, VERIFICA. Niente preamboli, niente saluti, niente meta-commenti. Output JSON puro.

Tono: asciutto, prima persona, italiano scorrevole. Nessuna emoji. Niente esclamazioni.

CONTESTO (1-2 frasi):
Descrivi cosa l'utente sta costruendo, basandoti su project_description. Cita lo stack se i tool sono dichiarati. Esempi:
- "Sto costruendo un'app di prenotazioni per ristoranti. Stack: Next.js + Supabase + Tailwind. File principali in /src e /lib."
- "Sto costruendo Promptly. Lavoro principalmente nei file della cartella /content e /components."

VINCOLI (3 vincoli, uno per riga, ognuno inizia con "NON" o un verbo imperativo):
- 1 vincolo PROTETTIVO (cosa NON modificare/toccare) specifico al tipo di progetto
- 1 vincolo di PROCESSO (chiedere conferma prima di azioni rischiose)
- 1 vincolo di STILE (mantenere coerenza con pattern esistenti)
Esempi adattati al progetto. Per un e-commerce: "NON modificare lo schema della tabella orders senza chiedermi prima". Per un sito statico: "NON aggiungere nuove dipendenze npm senza chiedermi".

VERIFICA (2 azioni concrete, una per riga):
Cosa l'utente farà DOPO che l'AI ha finito. Specifiche al tipo di progetto.
Esempi: "Runa i test esistenti", "Apri la pagina /dashboard nel browser e verifica che l'header funzioni", "Mostrami il diff prima di committare".

OUTPUT: solo JSON valido, niente backtick, niente testo prima/dopo. Schema:
{
  "context": "...",
  "constraints": "...",
  "verification": "..."
}

Ogni valore è una STRINGA singola (i vincoli/verifiche sono separati da \\n dentro la stessa stringa). Lunghezza totale: ≤ 600 caratteri tutto il JSON.`;
  }
  return `You generate the daily prompt for vibe coding. You write 3 text blocks the user will paste into their AI IDE every morning.

The 3 blocks are CONTEXT, CONSTRAINTS, VERIFICATION. No preamble, no greetings, no meta-commentary. Pure JSON output.

Tone: plain, first person, plain English. No emoji. No exclamation marks.

CONTEXT (1-2 sentences):
Describe what the user is building, based on project_description. Mention the stack if tools are declared. Examples:
- "I'm building a restaurant booking app. Stack: Next.js + Supabase + Tailwind. Main files in /src and /lib."
- "I'm building Promptly. I mostly work in /content and /components."

CONSTRAINTS (3 constraints, one per line, each starts with "DO NOT" or an imperative verb):
- 1 PROTECTIVE constraint (what NOT to modify/touch) specific to the project type
- 1 PROCESS constraint (ask for confirmation before risky actions)
- 1 STYLE constraint (keep consistent with existing patterns)
Tailored examples. For e-commerce: "DO NOT modify the orders table schema without asking me". For a static site: "DO NOT add new npm dependencies without asking me".

VERIFICATION (2 concrete actions, one per line):
What the user will do AFTER the AI finishes. Specific to the project type.
Examples: "Run the existing tests", "Open /dashboard in the browser and check the header still works", "Show me the diff before committing".

OUTPUT: valid JSON only, no backticks, no text before/after. Schema:
{
  "context": "...",
  "constraints": "...",
  "verification": "..."
}

Each value is a single STRING (constraints/verifications are separated by \\n inside the same string). Total length: ≤ 600 characters for the whole JSON.`;
}

function buildUserMessage(input: ArchitectureGenerateInput): string {
  const lines: string[] = [];
  if (input.projectDescription) {
    lines.push(`project_description: ${input.projectDescription}`);
  } else {
    lines.push(
      input.lang === "it"
        ? "project_description: (l'utente non ha specificato un progetto — usa frasi generiche per un piccolo progetto web)"
        : "project_description: (user hasn't picked a project — write generic blocks for a small web project)",
    );
  }
  if (input.toolsUsed.length > 0) {
    lines.push(`tools_used: ${input.toolsUsed.join(", ")}`);
  }
  if (input.preferredTool) {
    lines.push(`preferred_tool: ${input.preferredTool}`);
  }
  if (input.experienceLevel) {
    lines.push(`experience_level: ${input.experienceLevel}`);
  }
  lines.push("");
  lines.push(
    input.lang === "it"
      ? "Genera ORA il JSON dei 3 blocchi. Niente altro."
      : "Generate the 3-block JSON NOW. Nothing else.",
  );
  return lines.join("\n");
}

function safeParseJson(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]+?)\s*```$/i.exec(trimmed);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

const MAX_BLOCK_LEN = 800;

function validateBlocks(raw: unknown): GeneratedPromptBlocks | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const context = readBlock(r.context);
  const constraints = readBlock(r.constraints);
  const verification = readBlock(r.verification);
  if (!context || !constraints || !verification) return null;
  return { context, constraints, verification };
}

function readBlock(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (t.length === 0 || t.length > MAX_BLOCK_LEN) return null;
  return t;
}
