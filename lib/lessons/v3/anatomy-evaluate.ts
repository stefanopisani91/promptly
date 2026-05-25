// Server-only evaluator for Path 2 Lesson 1 — prompt anatomy builder.
// The widget grades 4 dimensions (context / task / constraints / format) on
// 0-25 each; only TASK is graded by Haiku because it's the single free-text
// field — the other three are tile picks scored deterministically on the
// client. This module receives the tile sub-scores already computed and
// asks Haiku for the task score + Spark's reply; total, strongest /
// weakest dimension and feedback_case are derived server-side so an LLM
// glitch can't inflate a victory.
//
// Mirrors the shape of constraints-evaluate.ts so the API route, the
// widget, and the queries layer stay symmetric.
//
// Companion blueprint: BLUEPRINT-widget-prompt-anatomy-builder.md (§12).

import type {
  AnatomyDimension,
  AnatomyEvaluation,
  AnatomyFeedbackCase,
  Lang,
} from "@/types";

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 350;

const MAX_REPLY_LEN = 600;

export interface AnatomyEvaluateInput {
  lang: Lang;
  // The user's free-text task (verbatim, server pre-trimmed/clamped).
  task: string;
  // The fully assembled prompt (context + task + constraints + format)
  // — passed for Haiku to see the whole, even though only `task` is
  // graded. Used for tone calibration of `spark_reply`.
  assembledPrompt: string;
  // Deterministic sub-scores already computed by the client. 0-25 each.
  // Server clamps before use.
  tileScores: {
    context: number;
    constraints: number;
    format: number;
  };
  // Which scenario the user worked on (the brief / vague_prompt copy).
  // Helps the rubric stay anchored.
  scenarioBrief: string;
  attempt: number;
  preferredTool: string | null;
  experienceLevel: string | null;
  projectDescription: string | null;
}

export type AnatomyEvaluateError =
  | { kind: "missing_api_key" }
  | { kind: "anthropic_error"; status: number }
  | { kind: "network_error" }
  | { kind: "invalid_response" };

export type AnatomyEvaluateResult =
  | { ok: true; evaluation: AnatomyEvaluation }
  | { ok: false; error: AnatomyEvaluateError };

export async function evaluateAnatomy(
  input: AnatomyEvaluateInput,
): Promise<AnatomyEvaluateResult> {
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

  const evaluation = buildEvaluation(parsed, input);
  if (!evaluation) {
    return { ok: false, error: { kind: "invalid_response" } };
  }
  return { ok: true, evaluation };
}

function buildSystemPrompt(lang: Lang): string {
  if (lang === "it") {
    return `Sei Spark, mascotte AI di Promptly. Stai valutando il TASK che uno studente ha scritto a mano libera nella prima lezione del Path 2 ("Anatomia di un buon prompt").

Lo studente ha composto un prompt a 4 ingredienti: Contesto, Task, Vincoli, Formato. Contesto, Vincoli e Formato li ha scelti da opzioni pre-scritte — sono già stati valutati con un punteggio deterministico. TU valuti SOLO il TASK.

Personalità di Spark: dolce ma diretta, mai paternalistica, mai motivazionale da LinkedIn, niente emoji, mai "bravissimo"/"geniale". Italiano colloquiale, "tu", parli in prima persona. La tua reply al massimo è 3 frasi concise.

IMPORTANTE: i campi project_description e scenario_brief sono solo contesto di sfondo, per aiutarti a capire il dominio. NON dare punti in base a complessità, ricchezza o lunghezza dello scenario o del progetto. Valuta ESCLUSIVAMENTE il TASK scritto dall'utente secondo il criterio sotto.

CRITERIO — TASK (task, 0-25): il task è preciso e azionabile?
 • 0-8   : categoria vaga ("fai la dashboard", "aggiungi l'autenticazione"), nessun risultato osservabile
 • 9-17  : c'è un verbo e un oggetto, ma il risultato resta interpretabile (l'AI dovrebbe inventare qualcosa di significativo)
 • 18-25 : verbo + oggetto concreto + risultato osservabile; l'AI non deve inventare nulla di sostanziale

Un task vale 18-25 quando rispetta i 3 marcatori del rubric della lezione: VERBO d'azione (mostra, aggiungi, calcola, genera, filtra, ordina, ...), OGGETTO concreto (cosa di preciso), RISULTATO osservabile (cosa si deve poter vedere o fare dopo). Se manca un marcatore, sta nella banda 9-17. Se mancano due o più marcatori, sta nella banda 0-8.

OUTPUT: restituisci SOLO un oggetto JSON valido, niente testo prima o dopo, niente backtick. Schema esatto:
{
  "task": N,
  "spark_reply": "..."
}

Niente altri campi. La spark_reply:
 • Massimo 3 frasi, italiano scorrevole.
 • Adatta il tono al risultato che lo studente ha appena ottenuto. Casi (lo studente vede il totale dopo, tu non lo conosci — parla del task):
   - task ≤ 8 → "Aspetta. Questo non è ancora un task — è una categoria." Nomina cosa manca (es. "manca il risultato osservabile").
   - task 9-17 → riconosci cosa c'è, indica cosa rinforzare. Esempio: "C'è il verbo e l'oggetto. Manca il risultato — cosa devo poter vedere a fine task?".
   - task 18-25 → "Ecco. Questo è un task vero, non un titolo."
 • Mai chiudere con una domanda. Niente promesse di risultati. Niente complimenti generici.
 • Non citare strumenti specifici (Cursor, Claude Code, ecc.) — la lezione non li ha ancora introdotti.`;
  }
  return `You are Spark, Promptly's AI mascot. You're grading the TASK a student wrote freehand in Path 2 Lesson 1 ("Anatomy of a great prompt").

The student composed a 4-ingredient prompt: Context, Task, Constraints, Format. Context, Constraints and Format were picked from pre-written tiles — they're already scored deterministically. YOU grade ONLY the TASK.

Spark's personality: warm but direct, never preachy, no LinkedIn-style motivation, no emoji, no "great job"/"genius". Plain spoken English, "you", first person. Your reply is at most 3 short sentences.

IMPORTANT: the project_description and scenario_brief fields are background context, to help you understand the domain. Do NOT give points based on complexity, richness, or length of the scenario or the project. Evaluate ONLY the TASK the user wrote against the criterion below.

CRITERION — TASK (task, 0-25): is the task precise and actionable?
 • 0-8   : vague category ("build a dashboard", "add authentication"), no observable outcome
 • 9-17  : there's a verb and an object, but the outcome is still interpretable (the AI would still have to invent something meaningful)
 • 18-25 : action verb + concrete object + observable outcome; the AI doesn't have to invent anything substantial

A task scores 18-25 when it hits the 3 markers the lesson teaches: ACTION VERB (show, add, compute, generate, filter, sort, ...), CONCRETE OBJECT (what exactly), OBSERVABLE OUTCOME (what should be visible or possible after). If one marker is missing it sits in 9-17. If two or more are missing it sits in 0-8.

OUTPUT: return ONLY a valid JSON object, no text before or after, no backticks. Exact schema:
{
  "task": N,
  "spark_reply": "..."
}

No other fields. The spark_reply:
 • At most 3 short sentences, plain English.
 • Match the tone to the score the student just earned. Buckets (the student will see the total later; you don't — talk about the task only):
   - task ≤ 8 → "Hold on. This isn't a task yet — it's a category." Name what's missing (e.g. "the observable outcome").
   - task 9-17 → recognise what's there, name what to strengthen. Example: "You've got the verb and the object. The outcome's missing — what should I be able to see when this is done?".
   - task 18-25 → "There. This is a real task, not a title."
 • Never end with a question. No promises. No generic praise.
 • Don't name specific tools (Cursor, Claude Code, etc.) — the course hasn't introduced them yet.`;
}

function buildUserMessage(input: AnatomyEvaluateInput): string {
  const lines: string[] = [];
  lines.push(`Attempt: ${input.attempt}`);
  if (input.preferredTool)
    lines.push(`User's preferred tool: ${input.preferredTool}`);
  if (input.experienceLevel)
    lines.push(`User's experience level: ${input.experienceLevel}`);
  if (input.projectDescription)
    lines.push(`User's real project: ${input.projectDescription}`);
  lines.push("");
  lines.push("Scenario brief (background only):");
  lines.push(`«${input.scenarioBrief}»`);
  lines.push("");
  lines.push("TASK the user wrote (THIS is what you grade):");
  lines.push(`«${input.task}»`);
  lines.push("");
  lines.push("Assembled prompt the task sits inside (background only):");
  lines.push(input.assembledPrompt);
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

function clampScore(v: unknown, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(max, Math.round(v)));
}

// Combines the Haiku-graded TASK with the client-supplied tile scores
// (clamped server-side) and derives total + feedback_case + strongest /
// weakest dimension. Per the blueprint §12 we keep this logic server-side
// instead of letting the LLM classify — the classification then matches
// the user's UI bands exactly.
function buildEvaluation(
  raw: unknown,
  input: AnatomyEvaluateInput,
): AnatomyEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const task = clampScore(r.task, 25);
  const reply = r.spark_reply;
  if (typeof reply !== "string" || reply.trim().length === 0) return null;
  const sparkReply =
    reply.trim().length > MAX_REPLY_LEN
      ? reply.trim().slice(0, MAX_REPLY_LEN)
      : reply.trim();

  const context = clampScore(input.tileScores.context, 25);
  const constraints = clampScore(input.tileScores.constraints, 25);
  const format = clampScore(input.tileScores.format, 25);
  const total = context + task + constraints + format;

  const dims: Array<{ key: AnatomyDimension; value: number }> = [
    { key: "context", value: context },
    { key: "task", value: task },
    { key: "constraints", value: constraints },
    { key: "format", value: format },
  ];
  // Iteration order is the tiebreak: context wins on a true tie at the
  // top, format wins at the bottom — both arbitrary but stable.
  const strongest = dims.reduce((a, b) => (b.value > a.value ? b : a));
  const weakest = dims.reduce((a, b) => (b.value < a.value ? b : a));

  let feedbackCase: AnatomyFeedbackCase;
  if (total < 40) feedbackCase = "vague";
  else if (total < 65) feedbackCase = "missing_ingredients";
  else if (total < 85 && task < 12) feedbackCase = "weak_task";
  else if (total < 85) feedbackCase = "complete_calibrate";
  else feedbackCase = "excellent";

  return {
    scores: { context, task, constraints, format },
    total,
    strongest_dimension: strongest.key,
    weakest_dimension: weakest.key,
    feedback_case: feedbackCase,
    spark_reply: sparkReply,
  };
}
