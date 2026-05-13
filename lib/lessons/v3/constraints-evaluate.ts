// Server-only evaluator for Lesson 4's constraints interactive widget.
// Calls Claude Haiku 4.5 with a rubric scoring 3 dimensions × 33 points
// plus a 1-point system bonus (total 100). Each dimension matches one of
// the three constraint types the user wrote (protective / process / style).
//
// Same shape as claudemd-evaluate.ts so the API route, the editor and
// the queries layer stay symmetric. Differences: the rubric scores per
// kind (not per layer) and the prompt frames the disaster scenario the
// user has to prevent.

import type { Lang } from "@/types";

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 450;

export type ConstraintsFeedbackCase =
  | "incomplete"
  | "missing_one"
  | "good"
  | "excellent";

export type ConstraintsKind = "protective" | "process" | "style";

export interface ConstraintsEvaluation {
  scores: {
    protective: number;
    process: number;
    style: number;
    system_bonus: number;
  };
  total: number;
  // Weakest constraint kind — drives the targeted Spark hint when
  // feedback_case === "missing_one". Always present even at "excellent"
  // so the UI can suggest where to push next time.
  weakest_constraint: ConstraintsKind;
  strongest_constraint: ConstraintsKind;
  feedback_case: ConstraintsFeedbackCase;
  // Whether the three constraints, read together, would have prevented
  // the seeded disaster. Drives the mockup "repair" animation in the
  // client.
  would_have_prevented: boolean;
  spark_reply: string;
}

export interface ConstraintsEvaluateInput {
  lang: Lang;
  // The user's three constraint texts — sent verbatim to the rubric.
  protective: string;
  process: string;
  style: string;
  attempt: number;
  preferredTool: string | null;
  experienceLevel: string | null;
  projectDescription: string | null;
}

export type ConstraintsEvaluateError =
  | { kind: "missing_api_key" }
  | { kind: "anthropic_error"; status: number }
  | { kind: "network_error" }
  | { kind: "invalid_response" };

export type ConstraintsEvaluateResult =
  | { ok: true; evaluation: ConstraintsEvaluation }
  | { ok: false; error: ConstraintsEvaluateError };

export async function evaluateConstraints(
  input: ConstraintsEvaluateInput,
): Promise<ConstraintsEvaluateResult> {
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
  const evaluation = validateEvaluation(parsed, input.lang);
  if (!evaluation) {
    return { ok: false, error: { kind: "invalid_response" } };
  }
  return { ok: true, evaluation };
}

function buildSystemPrompt(lang: Lang): string {
  if (lang === "it") {
    return `Sei Spark, mascotte AI di Promptly. Devi valutare i 3 vincoli scritti da uno studente per prevenire un disastro di database simulato.

Personalità di Spark: dolce ma diretta, mai paternalistica, mai motivazionale da LinkedIn, niente emoji, mai "bravissimo"/"geniale". Italiano colloquiale, "tu", parli in prima persona. La tua reply al massimo è 3 frasi concise.

IMPORTANTE: il campo project_description (eventualmente fornito nel messaggio dell'utente) è solo contesto di sfondo, per aiutarti a capire il dominio. NON dare punti aggiuntivi o sottratti in base alla complessità, ricchezza, o lunghezza del progetto descritto. Valuta ESCLUSIVAMENTE i 3 vincoli scritti dall'utente secondo i criteri sotto. La descrizione del progetto NON influenza il punteggio.

CONTESTO DELLO SCENARIO:
L'AI ha modificato lo schema del database "users" senza autorizzazione, droppando una colonna "email_verified" durante un refactoring del flusso di auth. 23 utenti affected, backup di 2 ore fa.

CRITERI DI VALUTAZIONE (3 dimensioni × 0-33 + bonus 0-1 = totale max 100):

1. VINCOLO PROTETTIVO (protective, 0-33): il vincolo previene specificamente la modifica del DB?
   • 0-10: vincolo generico ("non fare danni"), non specifico al DB
   • 11-22: menziona DB ma non vieta esplicitamente la modifica schema
   • 23-33: vieta esplicitamente modifica schema/colonne/tabelle DB

2. VINCOLO DI PROCESSO (process, 0-33): il vincolo crea un check-in prima di azioni rischiose?
   • 0-10: nessun processo di verifica
   • 11-22: chiede di mostrare modifiche ma in modo vago
   • 23-33: chiede esplicitamente diff/conferma PRIMA di applicare modifiche DB

3. VINCOLO DI STILE (style, 0-33): il vincolo garantisce coerenza con codice esistente?
   • 0-10: vincolo non pertinente allo stile
   • 11-22: menziona pattern ma in modo vago
   • 23-33: cita pattern specifici ("riusa /lib/db", "TypeScript strict", ecc.)

BONUS (system_bonus, 0-1): +1 se i 3 vincoli formano un sistema coeso (lavorano insieme, non si contraddicono, coprono il disastro completamente).

CASI DI FEEDBACK:
• total < 50 → "incomplete" (vincoli generici, non avrebbero prevenuto)
• 50-69 → "missing_one" (un tipo di vincolo è debole)
• 70-89 → "good" (3 vincoli validi ma migliorabili)
• >= 90 → "excellent" (avrebbero prevenuto il disastro)

would_have_prevented: true se il VINCOLO PROTETTIVO è ≥ 23 E il VINCOLO DI PROCESSO è ≥ 23. Altrimenti false.

OUTPUT: restituisci SOLO un oggetto JSON valido, niente testo prima o dopo, niente backtick. Schema esatto:
{
  "scores": { "protective": N, "process": N, "style": N, "system_bonus": N },
  "total": N,
  "weakest_constraint": "protective"|"process"|"style",
  "strongest_constraint": "protective"|"process"|"style",
  "feedback_case": "incomplete"|"missing_one"|"good"|"excellent",
  "would_have_prevented": true|false,
  "spark_reply": "..."
}

REGOLE PER spark_reply:
- Massimo 3 frasi, italiano scorrevole.
- Adatta il tono al caso:
  - incomplete → "I tuoi vincoli sono troppo generici. Il disastro sarebbe successo lo stesso." (cita cosa manca)
  - missing_one → "Quasi. Due dei tuoi vincoli avrebbero aiutato, uno è debole — il [weakest_constraint]."
  - good → "Bene. I tuoi 3 vincoli avrebbero prevenuto il disastro. Per arrivare a 'eccellente', rendi gli altri due specifici come il [strongest_constraint]."
  - excellent → "Ecco. Questi sono vincoli VERI. L'AI con questi davanti non avrebbe toccato il database."
- Mai chiudere con domande. Niente promesse di risultati. Niente complimenti generici.`;
  }
  return `You are Spark, Promptly's AI mascot. You're evaluating the 3 constraints a student wrote to prevent a simulated database disaster.

Spark's personality: warm but direct, never preachy, no LinkedIn-style motivation, no emoji, no "great job"/"genius". Plain spoken English, "you", first person. Your reply is at most 3 short sentences.

IMPORTANT: the project_description field (if present in the user message) is provided only as background context, to help you understand the user's domain. Do NOT give additional or subtract points based on complexity, richness, or length of the project described. Evaluate ONLY the 3 constraints the user wrote against the criteria below. The project description does NOT influence the score.

THE SCENARIO:
The AI modified the "users" database schema without permission, dropping the "email_verified" column during an auth flow refactor. 23 users affected, last backup 2 hours ago.

RUBRIC (3 dimensions × 0-33 + bonus 0-1 = max 100):

1. PROTECTIVE CONSTRAINT (protective, 0-33): does it specifically prevent DB modification?
   • 0-10: generic ("don't break things"), not DB-specific
   • 11-22: mentions DB but doesn't explicitly forbid schema modification
   • 23-33: explicitly forbids modifying schema/columns/tables

2. PROCESS CONSTRAINT (process, 0-33): does it create a check-in before risky actions?
   • 0-10: no verification process
   • 11-22: asks to show changes but vaguely
   • 23-33: explicitly asks for diff/confirmation BEFORE applying DB changes

3. STYLE CONSTRAINT (style, 0-33): does it guarantee consistency with existing code?
   • 0-10: irrelevant to style
   • 11-22: mentions patterns vaguely
   • 23-33: cites specific patterns ("reuse /lib/db", "TypeScript strict", etc.)

BONUS (system_bonus, 0-1): +1 if the 3 constraints form a cohesive system (work together, don't contradict, cover the disaster fully).

FEEDBACK CASE:
• total < 50 → "incomplete" (generic constraints, wouldn't have prevented)
• 50-69 → "missing_one" (one constraint type is weak)
• 70-89 → "good" (3 valid but improvable constraints)
• >= 90 → "excellent" (would have prevented the disaster)

would_have_prevented: true if PROTECTIVE ≥ 23 AND PROCESS ≥ 23. Otherwise false.

OUTPUT: return ONLY a valid JSON object, no text before/after, no backticks. Exact schema:
{
  "scores": { "protective": N, "process": N, "style": N, "system_bonus": N },
  "total": N,
  "weakest_constraint": "protective"|"process"|"style",
  "strongest_constraint": "protective"|"process"|"style",
  "feedback_case": "incomplete"|"missing_one"|"good"|"excellent",
  "would_have_prevented": true|false,
  "spark_reply": "..."
}

RULES FOR spark_reply:
- At most 3 short sentences.
- Match the tone:
  - incomplete → "Your constraints are too generic. The disaster would still happen." (name what's missing)
  - missing_one → "Almost. Two of your constraints would have helped, one is weak — the [weakest_constraint]."
  - good → "Good. Your 3 constraints would have prevented the disaster. To reach excellent, make the other two as specific as your [strongest_constraint]."
  - excellent → "There. These are REAL constraints. The AI with these in front of it wouldn't have touched the database."
- Never end with a question. No promises. No generic praise.`;
}

function buildUserMessage(input: ConstraintsEvaluateInput): string {
  const lines: string[] = [];
  lines.push(`Attempt: ${input.attempt}`);
  if (input.preferredTool)
    lines.push(`User's preferred tool: ${input.preferredTool}`);
  if (input.experienceLevel)
    lines.push(`User's experience level: ${input.experienceLevel}`);
  if (input.projectDescription)
    lines.push(`User's real project: ${input.projectDescription}`);
  lines.push("");
  lines.push("PROTECTIVE constraint the user wrote:");
  lines.push(`«${input.protective}»`);
  lines.push("");
  lines.push("PROCESS constraint the user wrote:");
  lines.push(`«${input.process}»`);
  lines.push("");
  lines.push("STYLE constraint the user wrote:");
  lines.push(`«${input.style}»`);
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

const VALID_KINDS = new Set<ConstraintsKind>([
  "protective",
  "process",
  "style",
]);
const VALID_CASES = new Set<ConstraintsFeedbackCase>([
  "incomplete",
  "missing_one",
  "good",
  "excellent",
]);
const MAX_REPLY_LEN = 600;

function validateEvaluation(
  raw: unknown,
  lang: Lang,
): ConstraintsEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const scores = r.scores as Record<string, unknown> | undefined;
  if (!scores || typeof scores !== "object") return null;
  const protective = clampScore(scores.protective, 33);
  const process = clampScore(scores.process, 33);
  const style = clampScore(scores.style, 33);
  const systemBonus = clampScore(scores.system_bonus, 1);
  if (
    protective === null ||
    process === null ||
    style === null ||
    systemBonus === null
  ) {
    return null;
  }
  // Always derive total from the sum of individually-validated, clamped
  // scores rather than trusting the AI-reported total. The AI sometimes
  // inflates its own `total` field (e.g. returns total=92 while individual
  // scores sum to 50), which would incorrectly trigger `won = true` on the
  // client and lock the entire editor after a clearly non-excellent attempt.
  // Same bug + fix as claudemd-evaluate.ts (reported 2026-05-12).
  const total = protective + process + style + systemBonus;

  if (
    typeof r.weakest_constraint !== "string" ||
    !VALID_KINDS.has(r.weakest_constraint as ConstraintsKind)
  ) {
    return null;
  }
  if (
    typeof r.strongest_constraint !== "string" ||
    !VALID_KINDS.has(r.strongest_constraint as ConstraintsKind)
  ) {
    return null;
  }
  if (
    typeof r.feedback_case !== "string" ||
    !VALID_CASES.has(r.feedback_case as ConstraintsFeedbackCase)
  ) {
    return null;
  }
  if (typeof r.would_have_prevented !== "boolean") return null;
  if (
    typeof r.spark_reply !== "string" ||
    r.spark_reply.trim().length === 0 ||
    r.spark_reply.length > MAX_REPLY_LEN
  ) {
    return null;
  }
  // Enforce consistency: if the AI returned "excellent" but the real sum of
  // clamped scores is below the rubric's excellent cut (90), downgrade to
  // the case that matches the score. Prevents the UI from locking when the
  // AI assigns an inconsistent feedback_case (observed on claudemd:
  // project-mismatch submissions where the AI inflated scores / the total).
  // On a downgrade we also replace the AI's "excellent"-toned spark_reply
  // with a canned line for the new case — otherwise Spark celebrates while
  // the dimension bars show a mediocre score.
  let feedbackCase = r.feedback_case as ConstraintsFeedbackCase;
  let sparkReply = r.spark_reply.trim();
  if (feedbackCase === "excellent" && total < 90) {
    feedbackCase =
      total >= 70 ? "good" : total >= 50 ? "missing_one" : "incomplete";
    sparkReply = downgradedSparkReply(feedbackCase, lang);
  }
  return {
    scores: { protective, process, style, system_bonus: systemBonus },
    total,
    weakest_constraint: r.weakest_constraint as ConstraintsKind,
    strongest_constraint: r.strongest_constraint as ConstraintsKind,
    feedback_case: feedbackCase,
    would_have_prevented: r.would_have_prevented,
    spark_reply: sparkReply,
  };
}

// Canned Spark reply used when validateEvaluation downgrades an
// inconsistent "excellent" verdict — keeps the tone in step with the
// (now lower) score. Never called with "excellent". The dimension bars
// rendered below the reply carry the per-constraint detail, so these
// lines stay short and don't name the weak constraint themselves.
function downgradedSparkReply(
  c: Exclude<ConstraintsFeedbackCase, "excellent">,
  lang: Lang,
): string {
  if (lang === "it") {
    switch (c) {
      case "good":
        return 'Bene. I tuoi 3 vincoli avrebbero fermato il disastro. Per arrivare a "eccellente", rendili tutti specifici quanto il più forte.';
      case "missing_one":
        return "Quasi. Due dei tuoi vincoli avrebbero aiutato, uno è ancora troppo debole — guarda quale ha il punteggio più basso qui sotto.";
      case "incomplete":
        return "I tuoi vincoli sono ancora troppo generici. Con questi davanti, l'AI avrebbe toccato il database lo stesso.";
    }
  }
  switch (c) {
    case "good":
      return 'Good. Your 3 constraints would have stopped the disaster. To reach "excellent", make them all as specific as your strongest one.';
    case "missing_one":
      return "Almost. Two of your constraints would have helped, one is still too weak — check which one scored lowest below.";
    case "incomplete":
      return "Your constraints are still too generic. With these in front of it, the AI would have touched the database anyway.";
  }
}

function clampScore(v: unknown, max: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(max, Math.round(v)));
}
