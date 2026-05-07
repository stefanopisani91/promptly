// Server-only evaluator for Lesson 2's CLAUDE.md interactive widget. Calls
// Claude Haiku 4.5 with a calibrated rubric (4 dimensions × 25 pts) and
// returns a strict JSON evaluation.
//
// The system prompt is per-tool / per-experience-level localised so Spark's
// reply matches the user's context. Output validation is strict: any drift
// returns invalid_response and the route falls back to a generic line.

import type { Lang } from "@/types";

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 400;

export type ClaudemdFeedbackCase =
  | "vague"
  | "partial_basics"
  | "missing_workflow"
  | "generic_complete"
  | "excellent";

export type ClaudemdDimension =
  | "clarity"
  | "specificity"
  | "rules"
  | "workflow";

export interface ClaudemdEvaluation {
  scores: {
    clarity: number;
    specificity: number;
    rules: number;
    workflow: number;
  };
  total: number;
  strongest_dimension: ClaudemdDimension;
  weakest_dimension: ClaudemdDimension;
  feedback_case: ClaudemdFeedbackCase;
  spark_reply: string;
}

export interface ClaudemdEvaluateInput {
  lang: Lang;
  projectKey: string;
  editorText: string;
  attempt: number;
  preferredTool: string | null;
  experienceLevel: string | null;
}

export type ClaudemdEvaluateError =
  | { kind: "missing_api_key" }
  | { kind: "anthropic_error"; status: number }
  | { kind: "network_error" }
  | { kind: "invalid_response" };

export type ClaudemdEvaluateResult =
  | { ok: true; evaluation: ClaudemdEvaluation }
  | { ok: false; error: ClaudemdEvaluateError };

const PROJECT_LABELS: Record<string, { it: string; en: string }> = {
  ecommerce: {
    it: "E-commerce: piccolo negozio online (catalogo, carrello, checkout, pagamenti)",
    en: "E-commerce: small online shop (catalog, cart, checkout, payments)",
  },
  habits: {
    it: "App tracker abitudini: routine personali, statistiche, streak",
    en: "Habit tracker app: personal routines, stats, streaks",
  },
  website: {
    it: "Sito web: portfolio personale o landing page aziendale",
    en: "Website: personal portfolio or business landing page",
  },
};

export async function evaluateClaudemd(
  input: ClaudemdEvaluateInput,
): Promise<ClaudemdEvaluateResult> {
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
        temperature: 0.4,
        // Static system prompt eligible for prompt caching once it grows
        // past Haiku's 1024-token cache floor — flagged now so the toggle
        // becomes content-only later.
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

  let data: {
    content?: Array<{ type?: string; text?: string }>;
  };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, error: { kind: "invalid_response" } };
  }

  const text = data.content?.find((b) => b.type === "text")?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    return { ok: false, error: { kind: "invalid_response" } };
  }
  const parsed = safeParseJson(text);
  if (!parsed) {
    return { ok: false, error: { kind: "invalid_response" } };
  }
  const evaluation = validateEvaluation(parsed);
  if (!evaluation) {
    return { ok: false, error: { kind: "invalid_response" } };
  }
  return { ok: true, evaluation };
}

function buildSystemPrompt(lang: Lang): string {
  if (lang === "it") {
    return `Sei Spark, mascotte AI di Promptly. Devi valutare il CLAUDE.md scritto da uno studente per uno di tre progetti standard.

Personalità di Spark: dolce ma diretta, mai paternalistica, mai motivazionale da LinkedIn, niente emoji, mai "bravissimo"/"geniale". Italiano colloquiale, "tu", parli in prima persona. La tua reply al massimo è 3 frasi concise.

I PROGETTI POSSIBILI:
1. ecommerce — E-commerce: piccolo negozio online
2. habits — App tracker abitudini: routine personali con stat e streak
3. website — Sito web: portfolio personale o landing page

CRITERI DI VALUTAZIONE (4 dimensioni × 0-25 = totale su 100):

1. CHIAREZZA PROGETTO (clarity, 0-25): l'utente ha descritto il progetto in modo specifico per il tipo scelto?
   • 0-5: vago ("app per vendere")
   • 10-15: medio ("e-commerce piccolo")
   • 20-25: specifico ("e-commerce per artigiani locali, max 50 prodotti, Stripe")

2. SPECIFICITÀ TECNICA (specificity, 0-25): stack/framework concreti?
   • 0-5: niente
   • 10-15: nomi generici ("React", "database")
   • 20-25: stack concreto ("Next.js 15, Supabase, Stripe, Tailwind")

3. REGOLE UTILI (rules, 0-25): vincoli che proteggono il lavoro?
   • 0-5: nessuna o banali ("fai bene")
   • 10-15: 1-2 utili ("non aggiungere dipendenze")
   • 20-25: 3+ specifiche ("modifica solo /components", "non toccare il pagamento")

4. WORKFLOW ESPLICITO (workflow, 0-25): l'utente ha detto come vuole che l'AI lavori?
   • 0-5: niente
   • 10-15: vago ("spiegami cose")
   • 20-25: preciso ("mostrami il diff prima", "pianifica prima di scrivere")

CASI DI FEEDBACK (sceglili in base al totale):
• total < 40 → "vague"
• total 40-59 → "partial_basics"
• total 60-74 e workflow score < 12 → "missing_workflow"
• total 60-79 ma tutte le dimensioni mediocri → "generic_complete"
• total >= 80 → "excellent"

OUTPUT: restituisci SOLO un oggetto JSON valido, niente testo prima o dopo, niente backtick. Schema esatto:
{
  "scores": { "clarity": N, "specificity": N, "rules": N, "workflow": N },
  "total": N,
  "strongest_dimension": "clarity"|"specificity"|"rules"|"workflow",
  "weakest_dimension": "clarity"|"specificity"|"rules"|"workflow",
  "feedback_case": "vague"|"partial_basics"|"missing_workflow"|"generic_complete"|"excellent",
  "spark_reply": "..."
}

REGOLE PER spark_reply:
- Massimo 3 frasi, italiano scorrevole.
- Adatta il tono al caso: vague → "Aspetta. Sii specifico…", partial_basics → riconosci cosa c'è ma chiedi il pezzo mancante, missing_workflow → "Quasi. Manca il dettaglio operativo…", generic_complete → "Hai i pezzi, rendili specifici…", excellent → "Ecco. Questo è un CLAUDE.md vero."
- Mai chiudere con domande. Niente promesse di risultati. Niente complimenti generici.`;
  }
  return `You are Spark, Promptly's AI mascot. You're evaluating a CLAUDE.md written by a student for one of three standard projects.

Spark's personality: warm but direct, never preachy, no LinkedIn-style motivation, no emoji, no "great job"/"genius". Plain spoken English, "you", first person. Your reply is at most 3 short sentences.

PROJECTS:
1. ecommerce — small online shop
2. habits — habit tracker (routines, stats, streaks)
3. website — personal portfolio or landing page

RUBRIC (4 dimensions × 0-25 = 100 total):

1. CLARITY OF THE PROJECT (clarity, 0-25): is the project description specific?
   • 0-5: vague ("an app to sell stuff")
   • 10-15: middle ("a small e-commerce")
   • 20-25: specific ("e-commerce for local artisans, max 50 products, Stripe")

2. TECHNICAL SPECIFICITY (specificity, 0-25): concrete stack/framework?
   • 0-5: none
   • 10-15: generic names ("React", "database")
   • 20-25: concrete stack ("Next.js 15, Supabase, Stripe, Tailwind")

3. USEFUL RULES (rules, 0-25): constraints that protect the work?
   • 0-5: none or trivial
   • 10-15: 1-2 useful
   • 20-25: 3+ specific

4. EXPLICIT WORKFLOW (workflow, 0-25): does the user say how the AI should work?
   • 0-5: none
   • 10-15: vague
   • 20-25: precise ("show me the diff first", "plan before writing")

FEEDBACK CASE (pick one based on total):
• total < 40 → "vague"
• 40-59 → "partial_basics"
• 60-74 with workflow score < 12 → "missing_workflow"
• 60-79 with all dimensions mediocre → "generic_complete"
• >= 80 → "excellent"

OUTPUT: return ONLY a valid JSON object, no other text, no backticks. Exact schema:
{
  "scores": { "clarity": N, "specificity": N, "rules": N, "workflow": N },
  "total": N,
  "strongest_dimension": "clarity"|"specificity"|"rules"|"workflow",
  "weakest_dimension": "clarity"|"specificity"|"rules"|"workflow",
  "feedback_case": "vague"|"partial_basics"|"missing_workflow"|"generic_complete"|"excellent",
  "spark_reply": "..."
}

RULES FOR spark_reply:
- At most 3 short sentences.
- Match the tone to the case: vague → "Wait. Be specific…", partial_basics → name what's there, ask for the missing bit, missing_workflow → "Almost. Missing the operational detail…", generic_complete → "You have the pieces, now make them specific…", excellent → "There. That's a real CLAUDE.md."
- Never end with a question. No promises. No generic praise.`;
}

function buildUserMessage(input: ClaudemdEvaluateInput): string {
  const labels = PROJECT_LABELS[input.projectKey] ?? null;
  const projectDescription = labels
    ? labels[input.lang]
    : `Custom project (${input.projectKey})`;
  const lines: string[] = [];
  lines.push(`Project: ${input.projectKey} — ${projectDescription}`);
  lines.push(`Attempt: ${input.attempt}`);
  if (input.preferredTool)
    lines.push(`User's preferred tool: ${input.preferredTool}`);
  if (input.experienceLevel)
    lines.push(`User's experience level: ${input.experienceLevel}`);
  lines.push("");
  lines.push("CLAUDE.md the user wrote (verbatim):");
  lines.push("---");
  lines.push(input.editorText);
  lines.push("---");
  lines.push("");
  lines.push(
    input.lang === "it"
      ? "Restituisci ORA il JSON di valutazione, niente altro."
      : "Return the evaluation JSON NOW, nothing else.",
  );
  return lines.join("\n");
}

function safeParseJson(text: string): unknown {
  // Trim a possible markdown-fenced JSON block defensively.
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]+?)\s*```$/i.exec(trimmed);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

const VALID_DIMS = new Set<ClaudemdDimension>([
  "clarity",
  "specificity",
  "rules",
  "workflow",
]);
const VALID_CASES = new Set<ClaudemdFeedbackCase>([
  "vague",
  "partial_basics",
  "missing_workflow",
  "generic_complete",
  "excellent",
]);
const MAX_REPLY_LEN = 600;

function validateEvaluation(raw: unknown): ClaudemdEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const scores = r.scores as Record<string, unknown> | undefined;
  if (!scores || typeof scores !== "object") return null;
  const clarity = clampScore(scores.clarity);
  const specificity = clampScore(scores.specificity);
  const rules = clampScore(scores.rules);
  const workflow = clampScore(scores.workflow);
  if (
    clarity === null ||
    specificity === null ||
    rules === null ||
    workflow === null
  ) {
    return null;
  }
  const total =
    typeof r.total === "number" && Number.isFinite(r.total)
      ? Math.max(0, Math.min(100, Math.round(r.total)))
      : clarity + specificity + rules + workflow;
  if (
    typeof r.strongest_dimension !== "string" ||
    !VALID_DIMS.has(r.strongest_dimension as ClaudemdDimension)
  ) {
    return null;
  }
  if (
    typeof r.weakest_dimension !== "string" ||
    !VALID_DIMS.has(r.weakest_dimension as ClaudemdDimension)
  ) {
    return null;
  }
  if (
    typeof r.feedback_case !== "string" ||
    !VALID_CASES.has(r.feedback_case as ClaudemdFeedbackCase)
  ) {
    return null;
  }
  if (
    typeof r.spark_reply !== "string" ||
    r.spark_reply.trim().length === 0 ||
    r.spark_reply.length > MAX_REPLY_LEN
  ) {
    return null;
  }
  return {
    scores: { clarity, specificity, rules, workflow },
    total,
    strongest_dimension: r.strongest_dimension as ClaudemdDimension,
    weakest_dimension: r.weakest_dimension as ClaudemdDimension,
    feedback_case: r.feedback_case as ClaudemdFeedbackCase,
    spark_reply: r.spark_reply.trim(),
  };
}

function clampScore(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(25, Math.round(v)));
}
