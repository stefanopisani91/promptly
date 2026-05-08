// Server-only evaluator for Lesson 3's context-prompt interactive widget.
// Calls Claude Haiku 4.5 with a 4-level rubric (project / code / constraints
// / examples — 0-25 each) and returns a strict JSON evaluation.
//
// Follows the same shape as claudemd-evaluate.ts so the API route, the
// client component and the queries layer can stay symmetric. The only real
// differences are the rubric and the feedback cases (matching the blueprint:
// incomplete / missing_one / good / excellent).

import type { Lang } from "@/types";

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 400;

export type ContextFeedbackCase =
  | "incomplete"
  | "missing_one"
  | "good"
  | "excellent";

export type ContextLayer = "project" | "code" | "constraints" | "examples";

export interface ContextEvaluation {
  scores: {
    project: number;
    code: number;
    constraints: number;
    examples: number;
  };
  total: number;
  // Layer the user is weakest on — used to drive the targeted Spark hint
  // when feedback_case === "missing_one". Always present even at "excellent",
  // so the UI can still show a "next time work on X" line.
  missing_layer: ContextLayer | null;
  richest_layer: ContextLayer;
  feedback_case: ContextFeedbackCase;
  spark_reply: string;
}

export interface ContextEvaluateInput {
  lang: Lang;
  scenarioKey: string;
  emptyPrompt: string;
  userRichPrompt: string;
  attempt: number;
  preferredTool: string | null;
  experienceLevel: string | null;
  projectDescription: string | null;
}

export type ContextEvaluateError =
  | { kind: "missing_api_key" }
  | { kind: "anthropic_error"; status: number }
  | { kind: "network_error" }
  | { kind: "invalid_response" };

export type ContextEvaluateResult =
  | { ok: true; evaluation: ContextEvaluation }
  | { ok: false; error: ContextEvaluateError };

const SCENARIO_LABELS: Record<string, { it: string; en: string }> = {
  login: {
    it: "Aggiungi login: sistema di autenticazione utenti",
    en: "Add login: user authentication system",
  },
  notifications: {
    it: "Aggiungi notifiche email: email automatica quando succede un evento",
    en: "Add email notifications: auto-send email on a key event",
  },
  stats: {
    it: "Aggiungi pagina statistiche: dashboard con grafici dei dati utente",
    en: "Add stats page: dashboard with user data charts",
  },
};

export async function evaluateContext(
  input: ContextEvaluateInput,
): Promise<ContextEvaluateResult> {
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
    return `Sei Spark, mascotte AI di Promptly. Devi valutare la trasformazione fatta da uno studente di un prompt scarno in un prompt ricco di contesto.

Personalità di Spark: dolce ma diretta, mai paternalistica, mai motivazionale da LinkedIn, niente emoji, mai "bravissimo"/"geniale". Italiano colloquiale, "tu", parli in prima persona. La tua reply al massimo è 3 frasi concise.

LO SCENARIO:
Lo studente parte da un prompt vuoto (es. "aggiungi login all'app") e deve trasformarlo aggiungendo i 4 livelli di contesto.

CRITERI (4 livelli × 0-25 = totale su 100):

1. PROGETTO (project, 0-25): l'utente ha specificato cosa stiamo costruendo? Tipo di app, dominio, utenti target?
   • 0-5: nessuna menzione del contesto progetto
   • 10-15: menzione vaga ("un'app web")
   • 20-25: descrizione specifica ("e-commerce per B2B con catalogo prodotti")

2. CODICE/FILE (code, 0-25): l'utente ha specificato dove sta il codice, quali file/strutture esistono, dove va aggiunta la nuova feature?
   • 0-5: niente di tecnico
   • 10-15: struttura vaga ("ho dei file in /components")
   • 20-25: percorsi/pattern concreti ("riusa il pattern di /lib/auth.ts, aggiungi in /components/forms/LoginForm.tsx")

3. VINCOLI (constraints, 0-25): l'utente ha dato vincoli espliciti che proteggono il lavoro?
   • 0-5: nessun vincolo o vincoli generici ("fai bene")
   • 10-15: 1 vincolo specifico ("non aggiungere dipendenze")
   • 20-25: 2+ vincoli specifici ("no OAuth, no librerie esterne, mantieni TypeScript")

4. ESEMPI (examples, 0-25): l'utente ha indicato pattern esistenti da seguire come riferimento?
   • 0-5: niente esempi
   • 10-15: riferimento vago ("come le altre funzioni")
   • 20-25: riferimento concreto ("come signupUser() in /lib/auth.ts")

CASI DI FEEDBACK:
• total < 40 → "incomplete" (mancano 2+ livelli)
• total 40-65 → "missing_one" (manca 1 livello chiaramente)
• total 66-84 → "good" (4 livelli presenti ma calibrabili)
• total >= 85 → "excellent"

OUTPUT: restituisci SOLO un oggetto JSON valido, niente testo prima o dopo, niente backtick. Schema esatto:
{
  "scores": { "project": N, "code": N, "constraints": N, "examples": N },
  "total": N,
  "missing_layer": "project"|"code"|"constraints"|"examples"|null,
  "richest_layer": "project"|"code"|"constraints"|"examples",
  "feedback_case": "incomplete"|"missing_one"|"good"|"excellent",
  "spark_reply": "..."
}

REGOLE PER missing_layer:
- "incomplete": il livello con score più basso (riferimento per la prossima Spark reply, anche se ne mancano due).
- "missing_one": il livello mancante (score < 12).
- "good"/"excellent": null se non c'è davvero un livello debole.

REGOLE PER spark_reply:
- Massimo 3 frasi, italiano scorrevole.
- Adatta il tono al caso:
  - incomplete → "Aspetta. È un prompt come quello vuoto, solo più lungo. Mi servono almeno 2 dei 4 livelli mancanti." (cita quali)
  - missing_one → "Quasi. Hai messo terra, ma manca [livello]." (nomina il livello in modo concreto)
  - good → "Bene. Hai tutti e 4 i livelli. Per arrivare a eccellente, rendi più specifico il livello [richest_layer]."
  - excellent → "Ecco. Questo è un prompt RICCO. L'AI con questo davanti non improvvisa niente."
- Mai chiudere con domande. Niente promesse di risultati. Niente complimenti generici.`;
  }
  return `You are Spark, Promptly's AI mascot. You're evaluating a transformation: a student turned a thin prompt into a rich, context-loaded one.

Spark's personality: warm but direct, never preachy, no LinkedIn-style motivation, no emoji, no "great job"/"genius". Plain spoken English, "you", first person. Your reply is at most 3 short sentences.

THE SCENARIO:
The student starts from an empty prompt (e.g. "add login to the app") and has to transform it by adding the 4 levels of context.

RUBRIC (4 levels × 0-25 = 100 total):

1. PROJECT (project, 0-25): did the user specify what we're building? App type, domain, target users?
   • 0-5: no project context at all
   • 10-15: vague mention ("a web app")
   • 20-25: specific ("B2B e-commerce with product catalog")

2. CODE/FILES (code, 0-25): did the user specify where the code lives, which files/structures exist, where the new feature should go?
   • 0-5: nothing technical
   • 10-15: vague structure ("I have some files in /components")
   • 20-25: concrete paths/patterns ("reuse the pattern in /lib/auth.ts, add to /components/forms/LoginForm.tsx")

3. CONSTRAINTS (constraints, 0-25): did the user give explicit constraints that protect the work?
   • 0-5: no constraints, or trivial ("do it well")
   • 10-15: 1 specific constraint ("don't add dependencies")
   • 20-25: 2+ specific constraints ("no OAuth, no external libs, keep TypeScript")

4. EXAMPLES (examples, 0-25): did the user point to existing patterns as a reference?
   • 0-5: no examples
   • 10-15: vague reference ("like the other functions")
   • 20-25: concrete reference ("like signupUser() in /lib/auth.ts")

FEEDBACK CASE:
• total < 40 → "incomplete" (2+ levels missing)
• 40-65 → "missing_one" (1 level clearly missing)
• 66-84 → "good" (all 4 levels present but tunable)
• >= 85 → "excellent"

OUTPUT: return ONLY a valid JSON object, no text before/after, no backticks. Exact schema:
{
  "scores": { "project": N, "code": N, "constraints": N, "examples": N },
  "total": N,
  "missing_layer": "project"|"code"|"constraints"|"examples"|null,
  "richest_layer": "project"|"code"|"constraints"|"examples",
  "feedback_case": "incomplete"|"missing_one"|"good"|"excellent",
  "spark_reply": "..."
}

RULES FOR missing_layer:
- "incomplete": the lowest-scoring level (Spark reply targets it, even if more than one is missing).
- "missing_one": the missing level (score < 12).
- "good"/"excellent": null if no level is really weak.

RULES FOR spark_reply:
- At most 3 short sentences.
- Match the tone:
  - incomplete → "Wait. This is the empty prompt, just longer. I need at least 2 of the 4 missing levels." (name them)
  - missing_one → "Almost. You added ground, but [level] is missing." (name the level concretely)
  - good → "Good. All 4 levels are there. To reach excellent, make the [richest_layer] level more specific."
  - excellent → "There. This is a RICH prompt. With this in front, the AI doesn't improvise anything."
- Never end with a question. No promises. No generic praise.`;
}

function buildUserMessage(input: ContextEvaluateInput): string {
  const labels = SCENARIO_LABELS[input.scenarioKey] ?? null;
  const scenarioDescription = labels
    ? labels[input.lang]
    : `Custom scenario (${input.scenarioKey})`;
  const lines: string[] = [];
  lines.push(`Scenario: ${input.scenarioKey} — ${scenarioDescription}`);
  lines.push(`Empty prompt (the baseline the user is enriching):`);
  lines.push(`«${input.emptyPrompt}»`);
  lines.push(`Attempt: ${input.attempt}`);
  if (input.preferredTool)
    lines.push(`User's preferred tool: ${input.preferredTool}`);
  if (input.experienceLevel)
    lines.push(`User's experience level: ${input.experienceLevel}`);
  if (input.projectDescription)
    lines.push(`User's real project (for personalisation): ${input.projectDescription}`);
  lines.push("");
  lines.push("Rich prompt the user wrote (verbatim):");
  lines.push("---");
  lines.push(input.userRichPrompt);
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
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]+?)\s*```$/i.exec(trimmed);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

const VALID_LAYERS = new Set<ContextLayer>([
  "project",
  "code",
  "constraints",
  "examples",
]);
const VALID_CASES = new Set<ContextFeedbackCase>([
  "incomplete",
  "missing_one",
  "good",
  "excellent",
]);
const MAX_REPLY_LEN = 600;

function validateEvaluation(raw: unknown): ContextEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const scores = r.scores as Record<string, unknown> | undefined;
  if (!scores || typeof scores !== "object") return null;
  const project = clampScore(scores.project);
  const code = clampScore(scores.code);
  const constraints = clampScore(scores.constraints);
  const examples = clampScore(scores.examples);
  if (
    project === null ||
    code === null ||
    constraints === null ||
    examples === null
  ) {
    return null;
  }
  const total =
    typeof r.total === "number" && Number.isFinite(r.total)
      ? Math.max(0, Math.min(100, Math.round(r.total)))
      : project + code + constraints + examples;

  // missing_layer can be null (good/excellent) or a valid layer key.
  let missingLayer: ContextLayer | null = null;
  if (r.missing_layer === null || r.missing_layer === undefined) {
    missingLayer = null;
  } else if (
    typeof r.missing_layer === "string" &&
    VALID_LAYERS.has(r.missing_layer as ContextLayer)
  ) {
    missingLayer = r.missing_layer as ContextLayer;
  } else {
    return null;
  }

  if (
    typeof r.richest_layer !== "string" ||
    !VALID_LAYERS.has(r.richest_layer as ContextLayer)
  ) {
    return null;
  }
  if (
    typeof r.feedback_case !== "string" ||
    !VALID_CASES.has(r.feedback_case as ContextFeedbackCase)
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
    scores: { project, code, constraints, examples },
    total,
    missing_layer: missingLayer,
    richest_layer: r.richest_layer as ContextLayer,
    feedback_case: r.feedback_case as ContextFeedbackCase,
    spark_reply: r.spark_reply.trim(),
  };
}

function clampScore(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(25, Math.round(v)));
}
