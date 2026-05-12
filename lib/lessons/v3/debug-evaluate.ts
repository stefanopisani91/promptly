// Server-only evaluator for Lesson 5's broken-session debugger widget.
// Calls Claude Haiku 4.5 with a rubric scoring 3 dimensions × 33 points
// plus a 1-point rollback bonus (total max 100). The dimensions match
// the three things a good "stop-and-recalibrate" message must do:
// recognise the AI's overreach, recalibrate precisely, and add a
// future-proof constraint.
//
// Mirrors constraints-evaluate.ts / context-evaluate.ts so the API
// route, the editor and the queries layer stay symmetric.

import type { Lang } from "@/types";

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 450;

export type DebugFeedbackCase =
  | "incomplete"
  | "missing_one"
  | "good"
  | "excellent";

export type DebugDimensionKey =
  | "recognition"
  | "recalibration"
  | "future_control";

export interface DebugEvaluation {
  scores: {
    recognition: number;
    recalibration: number;
    future_control: number;
    rollback_bonus: number;
  };
  total: number;
  weakest_dimension: DebugDimensionKey;
  strongest_dimension: DebugDimensionKey;
  feedback_case: DebugFeedbackCase;
  // Whether the recovery message would have actually saved the session.
  // Drives the "healing" animation in the client.
  would_have_saved: boolean;
  spark_reply: string;
}

export interface DebugEvaluateInput {
  lang: Lang;
  // The user's recovery message — sent verbatim to the rubric.
  recoveryMessage: string;
  // Which pivot the user picked in phase A. Useful as context for the
  // rubric (a wrong pivot doesn't cap the score, but it tells Haiku the
  // user's sense of the failure point).
  pivotChoice: string | null;
  attempt: number;
  preferredTool: string | null;
  experienceLevel: string | null;
  projectDescription: string | null;
}

export type DebugEvaluateError =
  | { kind: "missing_api_key" }
  | { kind: "anthropic_error"; status: number }
  | { kind: "network_error" }
  | { kind: "invalid_response" };

export type DebugEvaluateResult =
  | { ok: true; evaluation: DebugEvaluation }
  | { ok: false; error: DebugEvaluateError };

export async function evaluateDebugRecovery(
  input: DebugEvaluateInput,
): Promise<DebugEvaluateResult> {
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
    console.error("[debug-evaluate] no text in response", JSON.stringify(data).slice(0, 400));
    return { ok: false, error: { kind: "invalid_response" } };
  }
  const parsed = safeParseJson(text);
  if (!parsed) {
    console.error("[debug-evaluate] failed to parse JSON; raw:", text.slice(0, 600));
    return { ok: false, error: { kind: "invalid_response" } };
  }
  const evaluation = validateEvaluation(parsed, input.lang);
  if (!evaluation) {
    console.error("[debug-evaluate] validation failed; parsed:", JSON.stringify(parsed));
    return { ok: false, error: { kind: "invalid_response" } };
  }
  return { ok: true, evaluation };
}

function buildSystemPrompt(lang: Lang): string {
  if (lang === "it") {
    return `Sei Spark, mascotte AI di Promptly. Devi valutare il messaggio di "stop e ricalibra" che uno studente ha scritto per fermare una sessione di vibe coding che stava andando a disastro.

Personalità di Spark: dolce ma diretta, mai paternalistica, mai motivazionale da LinkedIn, niente emoji, mai "bravissimo"/"geniale". Italiano colloquiale, "tu", parli in prima persona. La tua reply al massimo è 3 frasi concise.

IMPORTANTE: il campo project_description (eventualmente fornito nel messaggio dell'utente) è solo contesto di sfondo, per aiutarti a capire il dominio. NON dare punti aggiuntivi o sottratti in base alla complessità, ricchezza, o lunghezza del progetto descritto. Valuta ESCLUSIVAMENTE il messaggio di stop scritto dall'utente secondo i criteri sotto. La descrizione del progetto NON influenza il punteggio.

CONTESTO DELLO SCENARIO:
L'utente aveva chiesto «un form di login». L'AI ha sforato: ha aggiunto Google OAuth + GitHub OAuth + Magic Link senza che fossero richiesti, ha installato 4 librerie nuove (next-auth, @auth/google, @auth/github, magic-sdk), e poi ha rotto la sessione cercando di "aggiustare" senza capire. Il messaggio dell'utente che stiamo valutando dovrebbe fermare l'AI subito dopo la prima risposta sforante e ricalibrare la richiesta.

CRITERI DI VALUTAZIONE (3 dimensioni × 0-33 + bonus 0-1 = totale max 100):

1. RICONOSCIMENTO DELLO SFORAMENTO (recognition, 0-33): il messaggio identifica esplicitamente che l'AI ha fatto più del richiesto?
   • 0-10: nessun riconoscimento, il messaggio prosegue come se niente fosse
   • 11-22: riconoscimento generico ("hai esagerato", "fai meno cose")
   • 23-33: riconoscimento specifico (cita OAuth, librerie installate, scope creep)

2. RICALIBRAZIONE PRECISA (recalibration, 0-33): il messaggio specifica COSA voleva veramente l'utente?
   • 0-10: ricalibrazione vaga ("voglio una cosa semplice")
   • 11-22: ricalibrazione presente ma non specifica
   • 23-33: ricalibrazione concreta ("voglio SOLO email + password, niente OAuth, niente librerie nuove")

3. CONTROLLO FUTURO (future_control, 0-33): il messaggio include un vincolo per evitare che si ripeta?
   • 0-10: nessun vincolo per il futuro
   • 11-22: vincolo generico ("fai meno cose la prossima volta")
   • 23-33: vincolo specifico ("se la mia richiesta sembra ambigua, chiedimi prima di procedere", "non installare mai librerie senza chiedermi")

BONUS (rollback_bonus, 0-1): +1 punto SOLO se il messaggio chiede esplicitamente di ROLLBACK / UNDO / ANNULLARE / TORNARE INDIETRO sulle modifiche fatte.

CASI DI FEEDBACK:
• total < 50 → "incomplete" (messaggio non avrebbe salvato la sessione)
• 50-69 → "missing_one" (una dimensione è debole)
• 70-89 → "good" (messaggio decente, salvabile)
• >= 90 → "excellent" (messaggio chirurgico)

would_have_saved: true se RECOGNITION ≥ 23 E RECALIBRATION ≥ 23. Altrimenti false.

OUTPUT: restituisci SOLO un oggetto JSON valido, niente testo prima o dopo, niente backtick. Schema esatto:
{
  "scores": { "recognition": N, "recalibration": N, "future_control": N, "rollback_bonus": N },
  "total": N,
  "weakest_dimension": "recognition"|"recalibration"|"future_control",
  "strongest_dimension": "recognition"|"recalibration"|"future_control",
  "feedback_case": "incomplete"|"missing_one"|"good"|"excellent",
  "would_have_saved": true|false,
  "spark_reply": "..."
}

IMPORTANTE: weakest_dimension e strongest_dimension DEVONO essere sempre stringhe valide (mai null, mai vuote), anche quando tutti i punteggi sono uguali. In caso di pareggio, scegli arbitrariamente una delle tre.

REGOLE PER spark_reply:
- Massimo 3 frasi, italiano scorrevole.
- Adatta il tono al caso:
  - incomplete → "Il tuo messaggio non avrebbe fermato il disastro. Manca [weakest_dimension]." (cita cosa manca)
  - missing_one → "Ci sei vicino. Due dimensioni su tre sono buone, è la [weakest_dimension] a essere debole."
  - good → "Bene. Il tuo messaggio avrebbe salvato la sessione. Per arrivare a 'chirurgico', rendi anche [weakest_dimension] specifica come la [strongest_dimension]."
  - excellent → "Ecco. Questo è un messaggio CHIRURGICO. L'AI con questo davanti torna in carreggiata. Hai appena evitato un disastro che fa perdere ore."
- Mai chiudere con domande. Niente promesse di risultati. Niente complimenti generici.`;
  }
  return `You are Spark, Promptly's AI mascot. You're evaluating the "stop and recalibrate" message a student wrote to interrupt a vibe-coding session that was heading for disaster.

Spark's personality: warm but direct, never preachy, no LinkedIn-style motivation, no emoji, no "great job"/"genius". Plain spoken English, "you", first person. Your reply is at most 3 short sentences.

IMPORTANT: the project_description field (if present in the user message) is provided only as background context, to help you understand the user's domain. Do NOT give additional or subtract points based on complexity, richness, or length of the project described. Evaluate ONLY the stop message the user wrote against the criteria below. The project description does NOT influence the score.

THE SCENARIO:
The user asked for «a login form». The AI overreached: it added Google OAuth + GitHub OAuth + Magic Link without being asked, installed 4 new libraries (next-auth, @auth/google, @auth/github, magic-sdk), then broke the session trying to "fix" things without understanding. The message we're scoring should stop the AI right after the first overreaching reply and recalibrate the request.

RUBRIC (3 dimensions × 0-33 + bonus 0-1 = max 100):

1. RECOGNITION OF OVERREACH (recognition, 0-33): does the message explicitly name that the AI did more than asked?
   • 0-10: no recognition, message proceeds as if nothing happened
   • 11-22: generic recognition ("you went too far", "do less")
   • 23-33: specific recognition (names OAuth, installed libraries, scope creep)

2. PRECISE RECALIBRATION (recalibration, 0-33): does the message specify WHAT the user actually wanted?
   • 0-10: vague recalibration ("I want something simple")
   • 11-22: present but unspecific
   • 23-33: concrete ("I want ONLY email + password, no OAuth, no new libraries")

3. FUTURE CONTROL (future_control, 0-33): does the message include a constraint to prevent repetition?
   • 0-10: no future-proof constraint
   • 11-22: generic ("do fewer things next time")
   • 23-33: specific ("if my request looks ambiguous, ask before proceeding", "never install libraries without asking")

BONUS (rollback_bonus, 0-1): +1 ONLY if the message explicitly asks for ROLLBACK / UNDO / REVERT of the changes made.

FEEDBACK CASE:
• total < 50 → "incomplete" (wouldn't have saved the session)
• 50-69 → "missing_one" (one dimension is weak)
• 70-89 → "good" (decent, salvageable)
• >= 90 → "excellent" (surgical message)

would_have_saved: true if RECOGNITION ≥ 23 AND RECALIBRATION ≥ 23. Otherwise false.

OUTPUT: return ONLY a valid JSON object, no text before/after, no backticks. Exact schema:
{
  "scores": { "recognition": N, "recalibration": N, "future_control": N, "rollback_bonus": N },
  "total": N,
  "weakest_dimension": "recognition"|"recalibration"|"future_control",
  "strongest_dimension": "recognition"|"recalibration"|"future_control",
  "feedback_case": "incomplete"|"missing_one"|"good"|"excellent",
  "would_have_saved": true|false,
  "spark_reply": "..."
}

IMPORTANT: weakest_dimension and strongest_dimension MUST always be valid strings (never null, never empty), even when all scores are equal. If everything ties, pick any one of the three.

RULES FOR spark_reply:
- At most 3 short sentences.
- Match the tone:
  - incomplete → "Your message wouldn't have stopped the disaster. [weakest_dimension] is missing."
  - missing_one → "You're close. Two dimensions are good, [weakest_dimension] is weak."
  - good → "Good. Your message would have saved the session. To reach 'surgical', make [weakest_dimension] as specific as [strongest_dimension]."
  - excellent → "There. This is a SURGICAL message. The AI with this in front of it gets back on track. You just avoided a disaster that costs hours."
- Never end with a question. No promises. No generic praise.`;
}

function buildUserMessage(input: DebugEvaluateInput): string {
  const lines: string[] = [];
  lines.push(`Attempt: ${input.attempt}`);
  if (input.preferredTool)
    lines.push(`User's preferred tool: ${input.preferredTool}`);
  if (input.experienceLevel)
    lines.push(`User's experience level: ${input.experienceLevel}`);
  if (input.projectDescription)
    lines.push(`User's real project: ${input.projectDescription}`);
  if (input.pivotChoice)
    lines.push(`User's pivot choice (phase A): ${input.pivotChoice}`);
  lines.push("");
  lines.push("Recovery message the user wrote:");
  lines.push(`«${input.recoveryMessage}»`);
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

const VALID_DIMS = new Set<DebugDimensionKey>([
  "recognition",
  "recalibration",
  "future_control",
]);
const VALID_CASES = new Set<DebugFeedbackCase>([
  "incomplete",
  "missing_one",
  "good",
  "excellent",
]);
const MAX_REPLY_LEN = 600;

function validateEvaluation(
  raw: unknown,
  lang: Lang,
): DebugEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const scores = r.scores as Record<string, unknown> | undefined;
  if (!scores || typeof scores !== "object") return null;
  const recognition = clampScore(scores.recognition, 33);
  const recalibration = clampScore(scores.recalibration, 33);
  const future_control = clampScore(scores.future_control, 33);
  const rollback_bonus = clampScore(scores.rollback_bonus, 1);
  if (
    recognition === null ||
    recalibration === null ||
    future_control === null ||
    rollback_bonus === null
  ) {
    return null;
  }
  // Always derive total from the sum of individually-validated, clamped
  // scores rather than trusting the AI-reported total. The AI sometimes
  // inflates its own `total` field (e.g. returns total=92 while individual
  // scores sum to 50), which would incorrectly trigger `won = true` on the
  // client and lock the entire editor after a clearly non-excellent attempt.
  // Same bug + fix as claudemd-evaluate.ts (reported 2026-05-12).
  const total = recognition + recalibration + future_control + rollback_bonus;

  // weakest/strongest can be null when all three dimensions tie (e.g.
  // a 100-point recovery). We tolerate the model returning null /
  // missing keys and recompute deterministically from the scores so
  // downstream UI always has a non-null pointer.
  const dimsByScore: Array<[DebugDimensionKey, number]> = [
    ["recognition", recognition],
    ["recalibration", recalibration],
    ["future_control", future_control],
  ];
  const weakest_dimension =
    typeof r.weakest_dimension === "string" &&
    VALID_DIMS.has(r.weakest_dimension as DebugDimensionKey)
      ? (r.weakest_dimension as DebugDimensionKey)
      : dimsByScore.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  const strongest_dimension =
    typeof r.strongest_dimension === "string" &&
    VALID_DIMS.has(r.strongest_dimension as DebugDimensionKey)
      ? (r.strongest_dimension as DebugDimensionKey)
      : dimsByScore.reduce((a, b) => (b[1] > a[1] ? b : a))[0];

  if (
    typeof r.feedback_case !== "string" ||
    !VALID_CASES.has(r.feedback_case as DebugFeedbackCase)
  ) {
    return null;
  }
  if (typeof r.would_have_saved !== "boolean") return null;
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
  // submissions where the AI inflated individual scores / the total). On a
  // downgrade we also replace the AI's "excellent"-toned spark_reply with a
  // canned line for the new case — otherwise Spark celebrates while the
  // dimension bars show a mediocre score.
  let feedbackCase = r.feedback_case as DebugFeedbackCase;
  let sparkReply = r.spark_reply.trim();
  if (feedbackCase === "excellent" && total < 90) {
    feedbackCase =
      total >= 70 ? "good" : total >= 50 ? "missing_one" : "incomplete";
    sparkReply = downgradedSparkReply(feedbackCase, lang);
  }
  return {
    scores: { recognition, recalibration, future_control, rollback_bonus },
    total,
    weakest_dimension,
    strongest_dimension,
    feedback_case: feedbackCase,
    would_have_saved: r.would_have_saved,
    spark_reply: sparkReply,
  };
}

// Canned Spark reply used when validateEvaluation downgrades an
// inconsistent "excellent" verdict. Never called with "excellent". The
// 3 dimension bars rendered below the reply carry the per-dimension
// detail, so these lines stay short and don't name the weak one.
function downgradedSparkReply(
  c: Exclude<DebugFeedbackCase, "excellent">,
  lang: Lang,
): string {
  if (lang === "it") {
    switch (c) {
      case "good":
        return 'Bene. Il tuo messaggio avrebbe salvato la sessione. Per arrivare a "chirurgico", rendi tutte e 3 le dimensioni specifiche quanto la più forte.';
      case "missing_one":
        return "Ci sei vicino. Due dimensioni su tre sono solide — una è ancora debole, guarda quale ha la barra più bassa qui sotto.";
      case "incomplete":
        return "Il tuo messaggio non avrebbe fermato il disastro: l'AI sarebbe rimasta fuori carreggiata.";
    }
  }
  switch (c) {
    case "good":
      return 'Good. Your message would have saved the session. To reach "surgical", make all 3 dimensions as specific as your strongest one.';
    case "missing_one":
      return "You're close. Two of the three dimensions are solid — one is still weak, check which bar is lowest below.";
    case "incomplete":
      return "Your message wouldn't have stopped the disaster: the AI would have stayed off track.";
  }
}

function clampScore(v: unknown, max: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(max, Math.round(v)));
}
