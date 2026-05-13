// Spark Helper — per-quick-win configuration.
//
// ⚠️ SERVER-ONLY. Never import this module from a `"use client"` component.
// The `contextNote` strings describe each exercise's *scenario* — including
// the things the helper must NOT reveal (the correct pivot, the disaster
// it's built on, etc.). They are model instructions, not UI copy, and must
// never reach the browser bundle. The chip labels the user sees live in
// `lib/i18n/lessons.ts` instead.
//
// What this file decides:
//   - WHICH quick-wins get a Spark Helper at all (the allowlist). Lesson 1's
//     Lucia loop joined the list 2026-05-13 (SparkHelper_FixBundle_v1 §4).
//     The public landing demo of Lucia stays helper-free because SparkHeader
//     (which renders the Ask-Spark bubble) is only mounted inside the
//     authenticated lesson page — not in the marketing surface.
//   - The server-side "scenario brief + anti-leak" note per widget, fed into
//     the helper's per-call context (see lib/ai/spark-system-prompt.ts).
//
// The /api/spark-helper route rejects any widgetKey not in the allowlist, so
// the helper is structurally impossible to invoke on a text/principle step
// or on a Path 2 V1 lesson.

import type { Lang } from "@/types";

/** Quick-win widget keys that expose a Spark Helper. */
export const SPARK_HELPER_WIDGETS = [
  "lucia_prompt_loop",
  "claudemd_editor",
  "block_picker",
  "constraints_editor",
  "broken_session_debugger",
  "prompt_architecture",
] as const;

export type SparkHelperWidgetKey = (typeof SPARK_HELPER_WIDGETS)[number];

const HELPER_WIDGET_SET: ReadonlySet<string> = new Set(SPARK_HELPER_WIDGETS);

export function isSparkHelperWidget(
  key: string | null | undefined,
): key is SparkHelperWidgetKey {
  return typeof key === "string" && HELPER_WIDGET_SET.has(key);
}

// Per-widget brief: what the exercise asks for + what the helper must never
// hand over. Written in the second person ("the learner is doing…") because
// it's spliced into Spark's per-call context.
const CONTEXT_NOTES: Record<SparkHelperWidgetKey, { it: string; en: string }> = {
  lucia_prompt_loop: {
    it: "L'utente sta facendo il primo quick-win di Promptly: il sito di Lucia (FrigoMagico) ha 3 bug — una foto di un frigo storta nell'header, una sezione che esce dallo schermo su mobile (overflow), e un bottone «iscriviti» che non risponde al click. L'utente scrive UN solo prompt che indirizza tutti e 3 i bug insieme; il prompt viene valutato su 4 dimensioni (chiarezza, contesto, obiettivo, protezione). Aiutalo a capire cos'è il «prompt loop», come si parla a un'AI per descrivere un bug, cosa vede uno sviluppatore nella console del browser, come si mette una protezione («non toccare il backend, solo CSS»). NON elencare i 3 bug per nome (foto/overflow/bottone), né dare un prompt-modello che li menzioni tutti e tre. Se fai un esempio di prompt, usa un sito COMPLETAMENTE DIVERSO (non un sito vetrina di un'azienda alimentare) e un solo bug astratto.",
    en: "The learner is on Promptly's very first quick-win: Lucia's site (FrigoMagico) has 3 bugs — a crooked fridge photo in the header, a section overflowing the viewport on mobile, and a «sign up» button that doesn't respond to clicks. They write ONE prompt that addresses all 3 bugs together; the prompt is graded on 4 dimensions (clarity, context, goal, protection). Help them understand what the «prompt loop» is, how to talk to an AI to describe a bug, what a developer sees in the browser console, how to add a protection («don't touch the backend, only CSS»). DO NOT list the 3 bugs by name (photo/overflow/button), and DO NOT give a model prompt that names all three. If you give a prompt example, use a COMPLETELY DIFFERENT site (not a food-company portfolio) and one abstract bug.",
  },
  claudemd_editor: {
    it: "L'utente sta scrivendo il suo primo CLAUDE.md su uno di tre progetti di esempio (un piccolo e-commerce, un'app per tracciare abitudini, o un sito vetrina/portfolio). Compila 4 sezioni: cosa stiamo costruendo, lo stack, le house rules (cosa l'AI NON deve fare), e come vuole lavorare con l'AI. Aiutalo a capire i termini (stack, house rules, workflow) e a essere concreto. Se fai esempi, usa un progetto inventato DIVERSO dai tre, oppure tienili generici — non scrivere mai tu le quattro sezioni al posto suo.",
    en: "The learner is writing their first CLAUDE.md against one of three sample projects (a small e-commerce, a habit-tracker app, or a portfolio/landing site). They fill 4 sections: what we're building, the stack, the house rules (what the AI must NOT do), and how they want to work with the AI. Help them understand the terms (stack, house rules, workflow) and how to be concrete. If you give examples, use a made-up project DIFFERENT from those three, or keep them generic — never write the four sections for them.",
  },
  block_picker: {
    it: "L'utente è sullo scenario «App di prenotazione ristoranti / aggiungi login» e deve scegliere 4 blocchi pre-scritti (uno per livello: progetto, codice, vincoli, esempi) per comporre un prompt ricco. I 12 blocchi disponibili hanno marker di qualità nascosti (correct / generic / off_scenario) — NON rivelare mai quali sono i blocchi «corretti», né elencare i blocchi per id o per testo letterale (sarebbe equivalente a un cheat). Aiutalo a capire cosa significa ogni livello (progetto = di cosa parla il progetto e chi lo usa; codice = dove vivono i file e cosa esiste già; vincoli = cosa l'AI NON deve fare; esempi = pattern da riusare) e come riconoscere il blocco più specifico per ogni livello. Se fai esempi, usa uno scenario DIVERSO (non «app ristoranti / login») e tieni i tuoi esempi astratti.",
    en: "The learner is on the «Restaurant reservation app / add login» scenario and has to pick 4 pre-written blocks (one per level: project, code, constraints, examples) to compose a rich prompt. The 12 available blocks carry hidden quality markers (correct / generic / off_scenario) — NEVER reveal which blocks are «correct», and DO NOT list blocks by id or by literal text (that would be a cheat). Help them understand what each level means (project = what the project is about and who uses it; code = where the files live and what already exists; constraints = what the AI must NOT do; examples = patterns to reuse) and how to recognise the most specific block per level. If you give examples, use a DIFFERENT scenario (not «restaurant app / login») and keep your examples abstract.",
  },
  constraints_editor: {
    it: "L'utente vede un disastro fisso — un'AI che ha droppato una colonna del database durante un refactoring del flusso di autenticazione, dopo aver installato librerie che nessuno aveva chiesto — e deve scrivere 3 vincoli che l'avrebbero prevenuto: protettivo (cosa l'AI NON deve toccare), di processo (come deve lavorare con te, es. mostrare il diff prima), di stile (coerenza con quello che esiste). Aiutalo a capire cos'è uno «schema di database», la differenza tra protettivo/processo/stile, come si scrive una negazione efficace. Negli esempi usa un disastro inventato DIVERSO — mai quello della colonna del DB durante il refactoring di auth — e non scrivere mai tu i tre vincoli al posto suo.",
    en: "The learner sees a fixed disaster — an AI that dropped a database column while refactoring an auth flow, after installing libraries nobody asked for — and has to write 3 constraints that would have prevented it: protective (what the AI must NOT touch), process (how it must work with you, e.g. show the diff first), style (consistency with what exists). Help them understand what a 'database schema' is, the difference between protective/process/style, how to phrase an effective negative. In examples use a DIFFERENT invented disaster — never the DB-column-during-auth-refactor one — and never write the three constraints for them.",
  },
  broken_session_debugger: {
    it: "L'utente legge una sessione di vibe coding ricostruita: una richiesta «crea un form di login» che l'AI ha gonfiato in OAuth multi-provider + magic link + 4 librerie nuove, poi «sistemata» con una finta libreria di gestione errori, poi peggiorata rimuovendo il middleware di autenticazione. L'utente deve (a) scegliere in quale messaggio dell'AI avrebbe dovuto fermarsi e ricalibrare, e (b) scrivere il messaggio di recupero che avrebbe dovuto mandare — uno che riconosce lo sforamento, ricalibra preciso (es. «solo email/password, niente librerie nuove»), e mette un vincolo per il futuro. Aiutalo a capire cos'è OAuth, cos'è un middleware, cosa significa «fare rollback», com'è fatto un messaggio di recupero «chirurgico». FONDAMENTALE: non rivelare mai in quale messaggio è il punto giusto in cui fermarsi, e non scrivere mai tu il messaggio di recupero. Se fai un esempio di messaggio di recupero, usa uno scenario COMPLETAMENTE DIVERSO (non un form di login, non OAuth) così non può copiarlo.",
    en: "The learner reads a reconstructed vibe-coding session: a 'create a login form' request the AI ballooned into multi-provider OAuth + magic link + 4 new libraries, then 'fixed' with a fake error-handling library, then made worse by removing the auth middleware. They must (a) pick at which AI message the user should have stopped and recalibrated, and (b) write the recovery message the user should have sent — one that recognises the overreach, recalibrates precisely (e.g. 'only email/password, no new libraries'), and adds a constraint for the future. Help them understand what OAuth is, what a middleware is, what 'rollback' means, what a 'surgical' recovery message looks like. CRITICAL: never reveal which message is the right place to stop, and never write the recovery message for them. If you give an example recovery message, use a COMPLETELY DIFFERENT scenario (not a login form, not OAuth) so they can't copy it.",
  },
  prompt_architecture: {
    it: "L'utente compone un template di prompt a 4 blocchi mettendoli in ordine — CONTESTO, VINCOLI, TASK, VERIFICA — e poi il widget gli genera un prompt compilato. Aiutalo a capire perché i vincoli vanno prima del task, cosa mettere nel blocco VERIFICA, come riuserà questo schema domani sul suo progetto vero. Se è ancora alle prese con l'ordine, non dirgli la sequenza giusta: stimola il ragionamento («cosa serve all'AI per prima, il compito o le regole del gioco?»). Negli esempi usa un task DIVERSO da quello su cui sta lavorando lui.",
    en: "The learner assembles a 4-block prompt template by ordering them — CONTEXT, CONSTRAINTS, TASK, VERIFY — and then the widget generates a filled-in prompt for them. Help them understand why constraints come before the task, what goes in the VERIFY block, how they'll reuse this template tomorrow on their real project. If they're still wrestling with the order, don't give them the sequence: nudge the reasoning ('what does the AI need first — the task, or the rules of the game?'). In examples use a task DIFFERENT from the one they're working on.",
  },
};

export function getHelperContextNote(
  widgetKey: string,
  lang: Lang,
): string | null {
  if (!isSparkHelperWidget(widgetKey)) return null;
  const entry = CONTEXT_NOTES[widgetKey];
  return lang === "en" ? entry.en : entry.it;
}

// Per-widget allowlist of "current_phase" values the route is willing to
// accept. The client computes the phase from the widget's persisted state
// (LessonV3View.helperPhase) and POSTs it; the route validates against this
// allowlist before splicing it into Spark's per-call context. The set is
// kept small and stable per widget — adding a phase here is a deliberate
// content change, not a runtime decision.
// `between_attempts` is a cross-widget phase that shadows the regular phase
// whenever the learner has at least one attempt-with-evaluation behind them
// but hasn't yet finalised the quick-win — Spark uses it to refer to the
// previous attempt's weak dimension without re-doing the explainer prose.
// Not present on prompt_architecture (it's a drag-and-drop puzzle, no
// per-attempt evaluator output of the same shape).
const HELPER_PHASES: Record<SparkHelperWidgetKey, ReadonlySet<string>> = {
  lucia_prompt_loop: new Set(["writing_lucia_prompt", "between_attempts"]),
  claudemd_editor: new Set([
    "awaiting_project_selection",
    "writing_claudemd",
    "between_attempts",
  ]),
  block_picker: new Set(["picking_blocks", "between_attempts"]),
  constraints_editor: new Set([
    "writing_constraints",
    "writing_protective",
    "writing_process",
    "writing_style",
    "between_attempts",
  ]),
  broken_session_debugger: new Set([
    "pivot_question",
    "recovery_question",
    "between_attempts",
  ]),
  prompt_architecture: new Set(["placing_pillars", "after_generation"]),
};

export function isSparkHelperPhase(
  widgetKey: SparkHelperWidgetKey,
  phase: string,
): boolean {
  return HELPER_PHASES[widgetKey].has(phase);
}
