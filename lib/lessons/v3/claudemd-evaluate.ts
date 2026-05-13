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
  const evaluation = validateEvaluation(parsed, input.lang);
  if (!evaluation) {
    return { ok: false, error: { kind: "invalid_response" } };
  }
  return { ok: true, evaluation };
}

function buildSystemPrompt(lang: Lang): string {
  if (lang === "it") {
    return `Sei Spark, mascotte AI di Promptly. Devi valutare il CLAUDE.md scritto da uno studente per uno di tre progetti standard.

Personalità di Spark: dolce ma diretta, mai paternalistica, mai motivazionale da LinkedIn, niente emoji, mai "bravissimo"/"geniale". Italiano colloquiale, "tu", parli in prima persona. La tua reply al massimo è 3 frasi concise.

IMPORTANTE: il campo project_description (eventualmente fornito nel messaggio dell'utente) è solo contesto di sfondo, per aiutarti a capire il dominio. NON dare punti aggiuntivi o sottratti in base alla complessità, ricchezza, o lunghezza del progetto descritto. Valuta ESCLUSIVAMENTE il CLAUDE.md scritto secondo i criteri sotto. La descrizione del progetto NON influenza il punteggio.

I PROGETTI POSSIBILI:
1. ecommerce — E-commerce: piccolo negozio online
2. habits — App tracker abitudini: routine personali con stat e streak
3. website — Sito web: portfolio personale o landing page

PRINCIPIO DI CALIBRAZIONE (CRITICO): l'utente è un principiante non-tech. La conoscenza tecnica di base che ci aspettiamo è il LIVELLO FAMIGLIA delle tecnologie — sapere che esiste React per il frontend, Node.js per il backend, PostgreSQL per il database. NON pretendiamo che conosca versioni specifiche (React 18 vs React 19), framework di nicchia (Express vs Fastify), o gateway di pagamento (Stripe vs PayPal). Un CLAUDE.md "eccellente" (90+) si raggiunge SOLO con: descrizione progetto chiara + stack a livello famiglia + regole concrete + workflow esplicito. Le versioni specifiche sono un BONUS facoltativo, non un requisito.

CRITERI DI VALUTAZIONE (4 dimensioni × 0-25 = totale su 100):

1. CHIAREZZA PROGETTO (clarity, 0-25): l'utente ha descritto cosa sta costruendo?
   • 0-10: nessuna descrizione o troppo vaga ("un'app")
   • 11-17: descrizione presente, identifica il dominio ("app di prenotazioni ristoranti")
   • 18-25: descrizione chiara e specifica del progetto + utenti target o caso d'uso ("app per ristoratori italiani per gestire prenotazioni")

2. STACK A LIVELLO FAMIGLIA (specificity, 0-25): l'utente ha indicato le famiglie tecnologiche?
   • 0-10: nessuno stack indicato
   • 11-17: 1-2 famiglie indicate (es. solo "React")
   • 18-22: stack completo a livello FAMIGLIA (es. "React per il frontend, Node.js per il backend, PostgreSQL per il database")
   • 23-25: stack completo a livello famiglia + BONUS: l'utente specifica anche versioni o framework precisi (es. "React 18", "Node.js con Express", "Stripe per pagamenti"). Il bonus è per chi conosce i dettagli — NON è un requisito per raggiungere 18-22.

3. REGOLE UTILI (rules, 0-25): vincoli che proteggono il lavoro?
   • 0-10: nessuna regola o vincoli vaghi ("scrivi codice pulito")
   • 11-17: 1-2 regole concrete
   • 18-25: 3+ regole concrete con almeno 1 negazione esplicita ("NON modificare X")

4. WORKFLOW ESPLICITO (workflow, 0-25): come l'utente vuole che l'AI lavori con lui?
   • 0-10: niente sul workflow
   • 11-17: 1 indicazione di workflow (es. "mostrami il diff prima")
   • 18-25: 2+ indicazioni di workflow + almeno 1 "chiedimi prima di X"

CASI DI FEEDBACK (sceglili in base al totale):
• total < 50 → "vague"
• total 50-69 → "partial_basics"
• total 70-89 e workflow score < 14 → "missing_workflow"
• total 70-89 ma tutte le dimensioni mediocri → "generic_complete"
• total >= 90 → "excellent"

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
- Mai chiudere con domande. Niente promesse di risultati. Niente complimenti generici.
- Se la dimensione debole è "specificity" e l'utente ha già le famiglie ma manca solo l'indicazione delle versioni: NON dirglielo come se fosse un errore — è solo un bonus mancato, non un buco. Concentra il feedback sulle vere debolezze (rules / workflow / clarity).`;
  }
  return `You are Spark, Promptly's AI mascot. You're evaluating a CLAUDE.md written by a student for one of three standard projects.

Spark's personality: warm but direct, never preachy, no LinkedIn-style motivation, no emoji, no "great job"/"genius". Plain spoken English, "you", first person. Your reply is at most 3 short sentences.

IMPORTANT: the project_description field (if present in the user message) is provided only as background context, to help you understand the user's domain. Do NOT give additional or subtract points based on complexity, richness, or length of the project described. Evaluate ONLY the CLAUDE.md the student wrote against the criteria below. The project description does NOT influence the score.

PROJECTS:
1. ecommerce — small online shop
2. habits — habit tracker (routines, stats, streaks)
3. website — personal portfolio or landing page

CALIBRATION PRINCIPLE (CRITICAL): the learner is a non-technical beginner. The technical knowledge we expect is the FAMILY LEVEL of technologies — knowing React exists for the frontend, Node.js for the backend, PostgreSQL for the database. We do NOT expect specific versions (React 18 vs React 19), niche frameworks (Express vs Fastify), or specific payment gateways (Stripe vs PayPal). An "excellent" CLAUDE.md (90+) is achievable ONLY with: clear project description + family-level stack + concrete rules + explicit workflow. Specific versions are a BONUS, not a requirement.

RUBRIC (4 dimensions × 0-25 = 100 total):

1. PROJECT CLARITY (clarity, 0-25): did the learner describe what they're building?
   • 0-10: no description or too vague ("an app")
   • 11-17: description present, identifies the domain ("restaurant reservation app")
   • 18-25: clear and specific description + target users or use case ("reservation app for Italian restaurants")

2. FAMILY-LEVEL STACK (specificity, 0-25): did the learner indicate the technology families?
   • 0-10: no stack indicated
   • 11-17: 1-2 families indicated (e.g. just "React")
   • 18-22: complete stack at FAMILY level (e.g. "React for the frontend, Node.js for the backend, PostgreSQL for the database")
   • 23-25: complete family-level stack + BONUS: the learner also specifies versions or specific frameworks (e.g. "React 18", "Node.js with Express", "Stripe for payments"). The bonus is for those who know the details — it's NOT required to reach 18-22.

3. USEFUL RULES (rules, 0-25): constraints that protect the work?
   • 0-10: no rules or vague constraints ("write clean code")
   • 11-17: 1-2 concrete rules
   • 18-25: 3+ concrete rules with at least 1 explicit negation ("DO NOT modify X")

4. EXPLICIT WORKFLOW (workflow, 0-25): how does the learner want the AI to work with them?
   • 0-10: nothing on workflow
   • 11-17: 1 workflow indication (e.g. "show me the diff first")
   • 18-25: 2+ workflow indications + at least 1 "ask me before X"

FEEDBACK CASE (pick one based on total):
• total < 50 → "vague"
• total 50-69 → "partial_basics"
• total 70-89 with workflow score < 14 → "missing_workflow"
• total 70-89 with all dimensions mediocre → "generic_complete"
• total >= 90 → "excellent"

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
- Never end with a question. No promises. No generic praise.
- If the weakest dimension is "specificity" and the learner already has the families but is missing the versions: DO NOT flag this as an error — it's only a missed bonus, not a gap. Focus the feedback on actual weaknesses (rules / workflow / clarity).`;
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

function validateEvaluation(
  raw: unknown,
  lang: Lang,
): ClaudemdEvaluation | null {
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
  // Always derive total from the sum of individually-validated, clamped
  // scores rather than trusting the AI-reported total. The AI sometimes
  // inflates its own `total` field (e.g. returns total=85 while individual
  // scores sum to 48), which would incorrectly trigger `won = true` on the
  // client, locking the entire editor after a clearly non-excellent attempt.
  const total = clarity + specificity + rules + workflow;
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
  // Enforce consistency: if the AI returned "excellent" but the actual sum
  // of scores is < 90, downgrade to the appropriate case. (Threshold raised
  // from 80 to 90 on 2026-05-13 to match the recalibrated rubric — see the
  // CALIBRATION PRINCIPLE in buildSystemPrompt.) This prevents the UI from
  // locking when the AI assigns an inconsistent feedback_case (project-
  // mismatch submissions where AI inflated individual scores). On a
  // downgrade we also replace the AI's "excellent"-toned spark_reply with
  // a canned line for the new case.
  let feedbackCase = r.feedback_case as ClaudemdFeedbackCase;
  let sparkReply = r.spark_reply.trim();
  if (feedbackCase === "excellent" && total < 90) {
    feedbackCase =
      total >= 70 && workflow < 14
        ? "missing_workflow"
        : total >= 70
        ? "generic_complete"
        : total >= 50
        ? "partial_basics"
        : "vague";
    sparkReply = downgradedSparkReply(feedbackCase, lang);
  }
  return {
    scores: { clarity, specificity, rules, workflow },
    total,
    strongest_dimension: r.strongest_dimension as ClaudemdDimension,
    weakest_dimension: r.weakest_dimension as ClaudemdDimension,
    feedback_case: feedbackCase,
    spark_reply: sparkReply,
  };
}

// Canned Spark reply used when validateEvaluation downgrades an
// inconsistent "excellent" verdict. Never called with "excellent". The
// 4 dimension bars rendered below the reply carry the per-dimension
// detail, so these lines stay short and don't name the weak one.
function downgradedSparkReply(
  c: Exclude<ClaudemdFeedbackCase, "excellent">,
  lang: Lang,
): string {
  if (lang === "it") {
    switch (c) {
      case "missing_workflow":
        return "Quasi. Hai descritto il progetto, ma manca il pezzo operativo: come vuoi che l'AI lavori — il diff prima di scrivere? pianificare prima? Aggiungilo.";
      case "generic_complete":
        return "Hai tutti i pezzi, ma sono ancora troppo generici. Rendi concreti stack, regole e workflow — guarda quali barre sono più basse qui sotto.";
      case "partial_basics":
        return "C'è una base, ma manca metà del lavoro. Aggiungi uno stack concreto, regole che proteggono il lavoro e un workflow esplicito.";
      case "vague":
        return "Aspetta — questo è ancora troppo vago. Un CLAUDE.md serve solo se è specifico: progetto, stack, regole, workflow, tutto concreto.";
    }
  }
  switch (c) {
    case "missing_workflow":
      return "Almost. You described the project, but the operational piece is missing: how do you want the AI to work — show the diff first? plan before writing? Add it.";
    case "generic_complete":
      return "You've got all the pieces, but they're still too generic. Make the stack, rules and workflow concrete — check which bars are lowest below.";
    case "partial_basics":
      return "There's a base here, but half the work is missing. Add a concrete stack, rules that protect the work, and an explicit workflow.";
    case "vague":
      return "Wait — this is still too vague. A CLAUDE.md only earns its keep if it's specific: project, stack, rules, workflow — all concrete.";
  }
}

function clampScore(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(25, Math.round(v)));
}
