// Glossario Vivo — dizionario dei 12 termini cliccabili di Path 1.
//
// Vedi Glossario_Vivo_Blueprint.md per la spec completa. Tre regole:
//   1. Definizioni in stile Spark (asciutto, prima persona implicita,
//      analogia o esempio concreto, max 4 frasi, niente Wikipedia).
//   2. Niente gergo tecnico non spiegato dentro la definizione.
//   3. La prima occorrenza cross-app del termine è cliccabile; le
//      successive sono testo normale (responsabilità dell'autore della
//      lezione, non del componente).
//
// Aggiunte future: bilanciare ogni nuova lezione con 3-5 termini, evitare
// sinonimi che si confondono (es. "pacchetto" e "dipendenza" → tienine
// uno solo).

import type { Lang } from "@/types";

export interface GlossaryTerm {
  // Stable kebab-case id. Used in the [[term:<id>]] markup, in
  // user_profiles.glossary_seen, and as the React key.
  id: string;
  // Visible label (in case the wrapped text in the lesson differs from
  // the canonical label — e.g. "AI" vs "intelligenza artificiale").
  label_it: string;
  label_en: string;
  // Spark's definition, 1-4 sentences. Same tone as the rest of Spark.
  definition_it: string;
  definition_en: string;
  // Lesson where the term is introduced — used for analytics + a sanity
  // check at authoring time. Nullable so future paths can reuse the
  // dictionary without forcing a back-reference.
  first_lesson?: string;
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  // ─── Lezione 1 ────────────────────────────────────────────────
  prompt: {
    id: "prompt",
    label_it: "prompt",
    label_en: "prompt",
    definition_it:
      "Una prompt è la frase che dai all'AI per chiederle di fare qualcosa. Più è chiara e specifica, meglio l'AI lavora. Tipo dare istruzioni a uno chef, non a un cuoco generico.",
    definition_en:
      "A prompt is the instruction you give to AI. The clearer and more specific it is, the better the AI works. Like giving directions to a chef, not a generic cook.",
    first_lesson: "mindset-01",
  },
  ai: {
    id: "ai",
    label_it: "AI",
    label_en: "AI",
    definition_it:
      "AI sta per Intelligenza Artificiale. Modelli che capiscono il linguaggio umano e generano risposte. Tipo Claude, ChatGPT, Gemini. Bravissimi nelle cose che possono indovinare dal contesto, scemi nelle cose che non sanno.",
    definition_en:
      "AI stands for Artificial Intelligence. Models that understand human language and generate responses. Like Claude, ChatGPT, Gemini. Great at things they can infer from context, dumb at things they don't know.",
    first_lesson: "mindset-01",
  },
  "vibe-coding": {
    id: "vibe-coding",
    label_it: "vibe coding",
    label_en: "vibe coding",
    definition_it:
      "Vibe coding è quando costruisci software descrivendo a parole cosa vuoi, e l'AI scrive il codice per te. Tu dirigi, lei esegue. Niente programmazione tradizionale necessaria.",
    definition_en:
      "Vibe coding is when you build software by describing what you want in words, and AI writes the code for you. You direct, it executes. No traditional programming required.",
    first_lesson: "mindset-01",
  },
  ide: {
    id: "ide",
    label_it: "IDE",
    label_en: "IDE",
    definition_it:
      "IDE sta per Integrated Development Environment, in pratica «l'ambiente dove scrivi codice». Cursor, Windsurf, VS Code sono IDE. Il bello è che ora hanno un'AI dentro che ti aiuta in tempo reale.",
    definition_en:
      "IDE stands for Integrated Development Environment, basically «the place where you write code». Cursor, Windsurf, VS Code are IDEs. The cool part is they now have AI built in that helps you in real time.",
    first_lesson: "mindset-02",
  },

  // ─── Lezione 2 ────────────────────────────────────────────────
  "claude-md": {
    id: "claude-md",
    label_it: "CLAUDE.md",
    label_en: "CLAUDE.md",
    definition_it:
      "È un file di istruzioni che dai all'AI nel tuo progetto. Una specie di lettera che lei rilegge ogni volta che ti aiuta. Le dici cosa stai costruendo, con cosa, e cosa NON deve fare. Senza, l'AI improvvisa ogni volta.",
    definition_en:
      "It's an instruction file you give to AI in your project. A kind of letter it re-reads every time it helps you. You tell it what you're building, with what, and what NOT to do. Without it, AI improvises every time.",
    first_lesson: "mindset-02",
  },
  stack: {
    id: "stack",
    label_it: "stack",
    label_en: "stack",
    definition_it:
      "Lo stack sono i mattoni con cui costruisci la tua app. Tipo: Next.js (per la struttura del sito), Supabase (per il database), Tailwind (per gli stili). Quando li metti insieme, lo chiami stack.",
    definition_en:
      "The stack is the building blocks of your app. Like: Next.js (for site structure), Supabase (for database), Tailwind (for styles). When you put them together, you call it a stack.",
    first_lesson: "mindset-02",
  },
  dipendenza: {
    id: "dipendenza",
    label_it: "dipendenza",
    label_en: "dependency",
    definition_it:
      "Una dipendenza è un pacchetto di codice già scritto da altri che il tuo progetto usa. Tipo prendere in prestito una libreria invece di scrivere tu un libro. Esempio: invece di scrivere un sistema di pagamenti, usi Stripe come dipendenza.",
    definition_en:
      "A dependency is a package of code written by others that your project uses. Like borrowing a library instead of writing a book yourself. Example: instead of writing a payment system, you use Stripe as a dependency.",
    first_lesson: "mindset-02",
  },
  database: {
    id: "database",
    label_it: "database",
    label_en: "database",
    definition_it:
      "Il database è il posto dove la tua app salva i dati: utenti, messaggi, foto, ordini. Quando accedi a un sito e vedi la tua roba, l'app sta leggendo dal database. Supabase, MongoDB, PostgreSQL sono database.",
    definition_en:
      "The database is where your app saves data: users, messages, photos, orders. When you log into a site and see your stuff, the app is reading from the database. Supabase, MongoDB, PostgreSQL are databases.",
    first_lesson: "mindset-03",
  },

  // ─── Lezione 3 ────────────────────────────────────────────────
  contesto: {
    id: "contesto",
    label_it: "contesto",
    label_en: "context",
    definition_it:
      "Il contesto è tutto quello che l'AI deve sapere PRIMA di rispondere alla tua domanda. Non quello che le chiedi, ma quello che le serve per capire la domanda. «Aggiungi una funzione» senza contesto è cieca; «aggiungi una funzione di login al mio e-commerce in Next.js» è vista.",
    definition_en:
      "Context is everything AI needs to know BEFORE answering your question. Not what you ask, but what it needs to understand the question. «Add a function» without context is blind; «add a login function to my Next.js e-commerce» has eyes.",
    first_lesson: "mindset-03",
  },
  funzione: {
    id: "funzione",
    label_it: "funzione",
    label_en: "function",
    definition_it:
      "Una funzione è un blocco di codice che fa una cosa specifica. Tipo: la funzione «salvaUtente» fa solo quello, salvare un utente nel database. Le funzioni sono i mattoncini Lego del codice — ne combini tante per costruire un'app.",
    definition_en:
      "A function is a block of code that does one specific thing. Like: the «saveUser» function does only that, saving a user in the database. Functions are the Lego bricks of code — you combine many to build an app.",
    first_lesson: "mindset-03",
  },
  componente: {
    id: "componente",
    label_it: "componente",
    label_en: "component",
    definition_it:
      "Un componente è un pezzo riutilizzabile dell'interfaccia del tuo sito. Tipo un bottone, una card, un form. Lo scrivi una volta, lo usi mille volte. Esempio: il bottone «Salva» che vedi su 30 schermate diverse è uno solo componente, riusato.",
    definition_en:
      "A component is a reusable piece of your site's interface. Like a button, a card, a form. You write it once, use it a thousand times. Example: the «Save» button you see on 30 different screens is one component, reused.",
    first_lesson: "mindset-03",
  },
  framework: {
    id: "framework",
    label_it: "framework",
    label_en: "framework",
    definition_it:
      "Un framework è un insieme di regole e strumenti che ti dà una struttura già pronta per costruire l'app. Tipo Next.js: ti dice «metti le pagine qui, le API qui, gli stili qui», e ti risparmia mille decisioni iniziali. Ti dà la struttura, tu ci metti dentro la storia.",
    definition_en:
      "A framework is a set of rules and tools that gives you a ready-made structure to build your app. Like Next.js: it tells you «put pages here, APIs here, styles here», saving you a thousand initial decisions. It gives you the skeleton, you add the story.",
    first_lesson: "mindset-03",
  },

  // ─── Lezione 4 ────────────────────────────────────────────────
  vincoli: {
    id: "vincoli",
    label_it: "vincoli",
    label_en: "constraints",
    definition_it:
      "Un vincolo è una frase che dice all'AI cosa NON deve fare. Tipo «non toccare il file X», «non aggiungere dipendenze». È più potente di un comando positivo: una negazione strategica protegge il tuo lavoro mentre l'AI esegue.",
    definition_en:
      "A constraint is a sentence that tells AI what NOT to do. Like «don't touch file X», «don't add dependencies». It's more powerful than a positive command: a strategic negation protects your work while the AI executes.",
    first_lesson: "mindset-04",
  },
  schema: {
    id: "schema",
    label_it: "schema",
    label_en: "schema",
    definition_it:
      "Lo schema del database è la mappa di come i dati sono organizzati: quali tabelle ci sono, quali colonne, che tipo di valori accettano. Modificarlo è un'azione delicata — sbagli lì e perdi i dati. Per questo è uno dei posti dove i vincoli protettivi servono di più.",
    definition_en:
      "A database schema is the map of how data is organised: which tables exist, which columns, what types of values they accept. Modifying it is delicate — get it wrong and you lose data. That's why protective constraints matter most here.",
    first_lesson: "mindset-04",
  },
  refactoring: {
    id: "refactoring",
    label_it: "refactoring",
    label_en: "refactoring",
    definition_it:
      "Il refactoring è quando riscrivi codice che già funziona per migliorarne la struttura senza cambiarne il comportamento. Tipo riordinare l'armadio: i vestiti sono gli stessi, ma adesso li trovi. Bel concetto, però è anche il momento dove l'AI fa più danni se non la vincoli.",
    definition_en:
      "Refactoring is rewriting code that already works to improve its structure without changing its behaviour. Like tidying a wardrobe: same clothes, but now you can find them. Good concept, but also where AI does the most damage if you don't constrain it.",
    first_lesson: "mindset-04",
  },
  diff: {
    id: "diff",
    label_it: "diff",
    label_en: "diff",
    definition_it:
      "Il diff è la differenza tra «com'era prima» e «com'è dopo» quando modifichi del codice. Tipo le modifiche tracciate di Word: vedi cosa è stato aggiunto, tolto, cambiato. Chiedere all'AI di mostrartelo prima di applicare è uno dei vincoli di processo più utili che esistano.",
    definition_en:
      "A diff is the difference between «before» and «after» when you modify code. Like Word's tracked changes: you see what was added, removed, changed. Asking AI to show you the diff before applying is one of the most useful process constraints out there.",
    first_lesson: "mindset-04",
  },

  // ─── Lezione 5 ────────────────────────────────────────────────
  allucinazione: {
    id: "allucinazione",
    label_it: "allucinazione",
    label_en: "hallucination",
    definition_it:
      "Un'allucinazione è quando dico una cosa che suona plausibile ma è falsa. Tipo inventarmi il nome di una libreria che non esiste. Non è dispetto: sono un modello probabilistico, e quando non so davvero qualcosa scelgo il pezzo più probabile, che a volte è inventato. La cura non è non averne più, è imparare a riconoscerle e verificarle.",
    definition_en:
      "A hallucination is when I say something that sounds plausible but is false. Like inventing the name of a library that doesn't exist. It's not on purpose: I'm a probabilistic model, and when I don't really know something I pick the most likely piece, which is sometimes made up. The cure isn't never having any, it's learning to spot and verify them.",
    first_lesson: "mindset-05",
  },
  "rate-limiting": {
    id: "rate-limiting",
    label_it: "rate limiting",
    label_en: "rate limiting",
    definition_it:
      "Il rate limiting è un freno: dice quante volte qualcuno può fare la stessa azione in una finestra di tempo. Tipo «massimo 10 richieste al minuto da questo IP». Senza, basta uno script malintenzionato per sommergerti di richieste e farti saltare il server. È una protezione di base che si aggiunge a quasi tutto.",
    definition_en:
      "Rate limiting is a brake: it caps how many times someone can do the same action in a time window. Like «max 10 requests per minute from this IP». Without it, one malicious script is enough to drown you in requests and crash your server. It's basic protection you add to almost everything.",
    first_lesson: "mindset-05",
  },
  token: {
    id: "token",
    label_it: "token",
    label_en: "token",
    definition_it:
      "Per l'AI un token è un piccolo pezzo di testo: una parola corta è un token, una lunga ne occupa due o tre. Quando «scrivo», quello che faccio è scegliere il token successivo più probabile, ogni volta. La fattura dell'API si paga a token: per questo i prompt lunghi costano più dei corti, anche a parità di richiesta.",
    definition_en:
      "To AI, a token is a small chunk of text: a short word is one token, a long one takes two or three. When I «write», what I do is pick the most likely next token, every time. API bills are charged per token: that's why long prompts cost more than short ones, even for the same request.",
    first_lesson: "mindset-05",
  },
};

export function getGlossaryTerm(termId: string): GlossaryTerm | null {
  return Object.prototype.hasOwnProperty.call(GLOSSARY, termId)
    ? GLOSSARY[termId]
    : null;
}

export function labelForTerm(term: GlossaryTerm, lang: Lang): string {
  return lang === "it" ? term.label_it : term.label_en;
}

export function definitionForTerm(term: GlossaryTerm, lang: Lang): string {
  return lang === "it" ? term.definition_it : term.definition_en;
}
