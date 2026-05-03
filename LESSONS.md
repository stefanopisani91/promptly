# PROMPTLY — Lessons Brief (Round 3)

> Brief completo per l'implementazione del sistema lezioni di Path 1 e Path 2.
>
> Da leggere insieme a `PROMPTLY.md` (single source of truth), `AUTH.md` (utente già autenticato), e `vibe-coding-teoria-completa.md` (fonte primaria del materiale didattico).
>
> Versione 1.0 — 29 April 2026.
>
> ⚠️ **Aggiornamento 2 May 2026 — pivot V2.** Il formato esercizio
> descritto in questo file (`fill_blank` con validazione client-side e
> sinonimi) è **superseded** per i nuovi contenuti. La spec attiva del
> formato V2 (open_question + archetype_quiz + commento GPT-4o mini con
> system prompt per-lezione) vive in `LESSON-GUIDELINES.md` (banner ⚠️
> V2 in cima, §3.b, §11). Le sezioni qui sotto restano valide per il
> renderer V1 in produzione finché non viene sostituito.

---

## Decisioni prese (V1 — Round 3, 29 April 2026)

> Le righe marcate **[V2 superseded]** sono state riviste con il pivot
> del 2 May 2026. La nuova decisione è in `LESSON-GUIDELINES.md`.

| Aspetto | Decisione |
|---|---|
| Lunghezza teoria | 150-300 parole per lezione (V2 alza a 300-500) |
| Tono | Conversazionale, "tu", caldo, accessibile |
| Blank esercizio | Variabile 1-3 a seconda della lezione **[V2 superseded — niente blank, si usano `open_question` + `archetype_quiz`]** |
| Citazioni esperti | Parsimoniose: solo 1-2 in tutto il corso (Karpathy + Willison) |
| Blocchi teoria | `paragraph`, `callout`, `example`, `simulated_output`, `comparison_table`, `quote` (V2 aggiunge `section_heading`, `open_question`, `archetype_quiz`) |
| Lingua-first | Inglese (poi traduzione IT) **[V2 superseded — autoraggio in italiano, traduzione AI in inglese]** |
| Struttura tipica | Hook (quote) → paragraph → example/simulated_output → callout → esercizio **[V2: teoria e interazioni interleaved nell'array `body`]** |
| Outro lezione | Recap rapido + XP toast + bottone "Prossima lezione" |
| Reveal (3° tentativo errato) | Risposta corretta + spiegazione 2-3 frasi, XP -50% **[V2 superseded — niente tentativi, l'utente avanza sempre]** |
| Navigazione | Lezioni libere dentro un path · Path 2 si sblocca solo dopo aver completato Path 1 |
| Validazione blank | Case-insensitive + lista sinonimi (no fuzzy, no AI) **[V2 superseded — commento GPT-4o mini per `open_question`, logica statica per `archetype_quiz`]** |
| Visual | 1 illustrazione SVG semplice per lezione (icona concettuale) |
| Implementazione | Code-first: scaffold + 1 lezione di esempio. Contenuti completi in round successivo |

---

## Curriculum Sources (aggiornate)

Aggiungere a `PROMPTLY.md` sezione "Curriculum Sources":

- **`vibe-coding-teoria-completa.md`** (in root del progetto) — fonte primaria di teoria, indice di 20 sezioni dalle origini di Karpathy a Continuous AI 2026. Riformulare in lezioni, non copiare.
- `roadmap.sh/vibe-coding`
- `producttalk.org/vibe-coding-best-practices`
- `creatoreconomy.so/p/12-rules-to-vibe-code-without-frustration`

---

## Routing & file structure

```
app/(app)/
├── layout.tsx                     # già esistente (auth gate + navbar)
├── dashboard/page.tsx             # già esistente (placeholder + welcome card)
├── path/[slug]/page.tsx           # NUOVO — overview di un path con lista lezioni
└── lesson/[id]/page.tsx           # NUOVO — pagina lezione (theory + exercise)

components/
├── lessons/
│   ├── LessonShell.tsx            # Wrapper della pagina lezione (header + progress + main)
│   ├── TheoryRenderer.tsx         # Renderizza i 6 tipi di blocchi (paragraph/callout/...)
│   ├── ExerciseFillBlank.tsx      # GIA' ESISTE in components/promptly/, lo riusiamo qui
│   ├── LessonOutro.tsx            # Recap card + "Prossima lezione" CTA
│   ├── XpToast.tsx                # Toast slide-in da bottom-right "+150 XP ⚡"
│   ├── LessonNavigator.tsx        # Bottoni prev/next + breadcrumb
│   ├── PathProgressBar.tsx        # Barra "4/10 lezioni" in alto
│   └── PathCard.tsx               # GIA' ESISTE in components/marketing/, riusabile?
├── dashboard/
│   ├── PathOverviewCard.tsx       # NUOVO — card di un path nella dashboard, con progresso
│   └── ContinueCard.tsx           # NUOVO — card "Continua dove eri rimasto"

content/
├── en/
│   ├── mindset/
│   │   ├── 01-what-is-vibe-coding.json
│   │   ├── 02-you-are-the-architect.json
│   │   ├── 03-think-in-outcomes.json
│   │   ├── 04-break-it-down.json
│   │   ├── 05-context-is-everything.json
│   │   └── 06-vibe-coder-checklist.json
│   └── prompt/
│       ├── 01-anatomy-of-a-prompt.json
│       ├── 02-give-the-ai-a-role.json
│       ├── ...
│       └── 08-prompt-patterns-library.json
└── it/
    ├── mindset/...
    └── prompt/...

lib/
├── lessons/
│   ├── load.ts                    # Caricamento dei JSON content (server-side)
│   ├── validate.ts                # Validazione blank (case-insensitive + sinonimi)
│   └── progress.ts                # Logica completamento lezione, sblocco path, ecc.
├── xp.ts                          # Calcolo XP (esisteva in PROMPTLY.md, ora lo creiamo)
└── analytics/posthog.ts           # esteso con eventi lezione (PostHog wiring rimandato)

assets/lessons/                    # Illustrazioni SVG per le lezioni (1 per lezione)
├── mindset-01.svg
├── mindset-02.svg
└── ...
```

---

## Database schema (nuova migration)

File: `supabase/migrations/<timestamp>_lessons_progress.sql`

```sql
-- Tabella: user_progress (una riga per ogni lezione completata o tentata)
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id text not null,                    -- es. "mindset-01"
  path_slug text not null,                    -- es. "mindset" (per query veloci)
  completed boolean not null default false,
  attempts integer not null default 0,        -- 0-3
  xp_earned integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- Indici per le query frequenti
create index if not exists user_progress_user_path_idx
  on public.user_progress (user_id, path_slug);
create index if not exists user_progress_user_completed_idx
  on public.user_progress (user_id, completed);

-- RLS
alter table public.user_progress enable row level security;

create policy "user_progress_select_own" on public.user_progress
  for select using (auth.uid() = user_id);
create policy "user_progress_insert_own" on public.user_progress
  for insert with check (auth.uid() = user_id);
create policy "user_progress_update_own" on public.user_progress
  for update using (auth.uid() = user_id);

-- Trigger updated_at
create trigger user_progress_set_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();

-- Aggiunta sui users: cumulativi (denormalizzati per evitare aggregations)
alter table public.users add column if not exists total_xp integer not null default 0;
alter table public.users add column if not exists current_streak integer not null default 0;
alter table public.users add column if not exists longest_streak integer not null default 0;
alter table public.users add column if not exists last_activity_date date;
```

NOTA: i campi streak su `users` sono predisposti ma non popolati nel Round 3 (Round 4 li attiverà). Il Round 3 popola solo `total_xp` quando l'utente completa una lezione.

---

## Schema JSON di una lezione

File esempio: `content/en/mindset/01-what-is-vibe-coding.json`

```json
{
  "id": "mindset-01",
  "path_slug": "mindset",
  "order": 1,
  "title": "What is vibe coding?",
  "difficulty": "beginner",
  "estimated_minutes": 5,
  "base_xp": 100,
  "difficulty_bonus_xp": 0,
  "icon": "/assets/lessons/mindset-01.svg",
  "theory": [
    {
      "type": "quote",
      "text": "The hottest new programming language is English.",
      "attribution": "Andrej Karpathy, 2023"
    },
    {
      "type": "paragraph",
      "text": "Vibe coding is the practice of building real software by talking to AI in natural language, instead of writing code by hand. You describe what you want, the AI writes it, and you iterate until it works."
    },
    {
      "type": "example",
      "label": "Example",
      "text": "Instead of writing 'function loginUser(email, password) { ... }', you say: 'create a login form with email and password, and connect it to the database'."
    },
    {
      "type": "simulated_output",
      "prompt": "Build a contact form that emails me on submit.",
      "output": "✓ Created /app/contact/page.tsx\n✓ Added Resend integration\n✓ Form validates email + message\n\nReady to test on /contact"
    },
    {
      "type": "callout",
      "variant": "key",
      "text": "In short: you describe the outcome, not the steps."
    }
  ],
  "exercise": {
    "format": "fill_blank",
    "prompt_template": "Vibe coding is the practice of building [BLANK] using [BLANK] instead of writing code manually.",
    "blanks": [
      {
        "index": 0,
        "correct_answers": ["software", "applications", "apps", "real software"],
        "hint_1": "Think about what the end result of development is.",
        "hint_2": "It's a general term for what developers build — programs, apps, digital tools.",
        "explanation": "The answer is 'software' (or 'applications'). Vibe coding produces real, working software — not just code samples."
      },
      {
        "index": 1,
        "correct_answers": ["natural language", "plain language", "words", "natural language prompts"],
        "hint_1": "What language does a non-programmer speak?",
        "hint_2": "It's not Python or JavaScript. It's what you use to talk with a friend.",
        "explanation": "The answer is 'natural language' (or 'words'). You describe what you want in plain English, not in code."
      }
    ]
  },
  "outro": {
    "recap": "You learned what vibe coding is: building software through natural language, not code.",
    "next_prompt": "Next: who's in charge — you or the AI?"
  }
}
```

---

## TypeScript types da aggiungere

In `types/index.ts`:

```typescript
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type TheoryBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'callout'; variant: 'key' | 'warning' | 'tip'; text: string }
  | { type: 'example'; label: string; text: string }
  | { type: 'simulated_output'; prompt: string; output: string }
  | { type: 'comparison_table'; bad: { label: string; content: string }; good: { label: string; content: string } }
  | { type: 'quote'; text: string; attribution: string };

export interface Blank {
  index: number;
  correct_answers: string[];
  hint_1: string;
  hint_2: string;
  explanation: string;
}

export interface FillBlankExercise {
  format: 'fill_blank';
  prompt_template: string;
  blanks: Blank[];
}

export interface LessonContent {
  id: string;                       // es. "mindset-01"
  path_slug: PathSlug;
  order: number;
  title: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  base_xp: number;
  difficulty_bonus_xp: number;
  icon: string;                     // path SVG, es. "/assets/lessons/mindset-01.svg"
  theory: TheoryBlock[];
  exercise: FillBlankExercise;
  outro: {
    recap: string;
    next_prompt: string;
  };
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  path_slug: PathSlug;
  completed: boolean;
  attempts: number;                 // 0-3
  xp_earned: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PathProgress {
  slug: PathSlug;
  total_lessons: number;
  completed_lessons: number;
  total_xp_available: number;
  earned_xp: number;
  next_lesson_id: string | null;    // prossima lezione non completata
  is_unlocked: boolean;
}
```

---

## Logica XP (lib/xp.ts)

```typescript
export function calculateLessonXp(
  baseXp: number,
  difficultyBonus: number,
  attempts: number      // 1, 2, o 3
): number {
  const reveal = attempts >= 3;
  const total = baseXp + difficultyBonus;
  return reveal ? Math.floor(total * 0.5) : total;
}
```

| Difficoltà | base | bonus | 1° tent. | 2° tent. | 3° tent. (reveal) |
|---|---|---|---|---|---|
| Beginner | 100 | 0 | 100 | 100 | 50 |
| Intermediate | 150 | 50 | 200 | 200 | 100 |
| Advanced | 200 | 100 | 300 | 300 | 150 |

---

## Validazione blank (lib/lessons/validate.ts)

```typescript
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function checkBlank(userInput: string, accepted: string[]): boolean {
  const normalized = normalize(userInput);
  return accepted.some(a => normalize(a) === normalized);
}
```

Regole:
- Trim spazi inizio/fine
- Lowercase
- Spazi multipli normalizzati a singolo spazio
- Niente fuzzy matching, niente AI
- L'autore della lezione è responsabile di includere TUTTI i sinonimi accettati

---

## Path overview & sblocco

### Sblocco di Path 2

Path 2 si sblocca quando: tutte le 6 lezioni di Path 1 hanno `completed = true` per l'utente.

Logica server-side in `lib/lessons/progress.ts`:

```typescript
export async function getPathProgress(
  supabase: AppSupabaseClient,
  userId: string,
  pathSlug: PathSlug
): Promise<PathProgress> {
  // 1. count completed lessons in path
  // 2. compute earned XP
  // 3. determine if path is unlocked
  // 4. find next incomplete lesson
}
```

### Dashboard aggiornata

La dashboard placeholder esistente (greeting + 3 stats placeholder + banner "lezioni in arrivo") va arricchita:
- Banner "lezioni in arrivo" → rimuoverlo
- 3 stats placeholder → ora popolati con valori reali (XP, streak placeholder=0, lezioni completate)
- Aggiungere `<ContinueCard />` con la prossima lezione da fare
- Aggiungere `<PathOverviewCard />` per Path 1 (sempre sbloccato) e Path 2 (sbloccato condizionatamente)

---

## Microcopy IT/EN (in lib/i18n/lessons.ts)

Estendere il pattern di `lib/i18n/auth.ts` con sezione `lessons`:

```typescript
{
  lessons: {
    pathOverview: {
      progressLabel: (current, total) => `${current}/${total} lessons completed` / `${current}/${total} lezioni completate`,
      continueCta: 'Continue' / 'Continua',
      startCta: 'Start' / 'Inizia',
      lockedTooltip: (path) => `Complete ${path} to unlock` / `Completa ${path} per sbloccare`,
    },
    lessonPage: {
      breadcrumb: (path) => `Path ${path}` / `Percorso ${path}`,
      lessonOf: (n, total) => `Lesson ${n} of ${total}` / `Lezione ${n} di ${total}`,
      checkAnswer: 'Check answer' / 'Controlla risposta',
      hintLabel: 'Hint' / 'Suggerimento',
      revealLabel: 'See answer' / 'Vedi la risposta',
      attemptOf: (n, total) => `Attempt ${n} of ${total}` / `Tentativo ${n} di ${total}`,
      correctMessage: 'Correct! ✓' / 'Corretto! ✓',
      wrongInline: 'Not quite. Try again.' / 'Non ancora. Riprova.',
      revealedNotice: 'XP halved because the answer was revealed.' / 'XP dimezzato perché la risposta è stata rivelata.',
    },
    outro: {
      title: 'Lesson complete! 🎉' / 'Lezione completata! 🎉',
      xpEarned: (xp) => `+${xp} XP ⚡` / `+${xp} XP ⚡`,
      nextLessonCta: 'Next lesson →' / 'Prossima lezione →',
      backToPathCta: 'Back to path' / 'Torna al percorso',
      pathCompletedTitle: '🏁 Path completed!' / '🏁 Percorso completato!',
      pathCompletedSub: 'You unlocked the next path.' / 'Hai sbloccato il percorso successivo.',
    },
  },
}
```

---

## Eventi PostHog (predisposti, wiring in round successivo)

```
lesson_started        { lesson_id, path_slug, difficulty }
lesson_theory_completed { lesson_id, time_on_theory_s }
exercise_attempt      { lesson_id, attempt: 1-3, correct: bool }
lesson_completed      { lesson_id, attempts, xp_earned }
path_completed        { path_slug, total_xp }
```

---

## Implementation checklist (per Claude Code)

### Round 3a — Scaffold (questo round)

- [ ] Migration SQL `<timestamp>_lessons_progress.sql` (tabella `user_progress` + 4 campi su `users`)
- [ ] Types in `types/index.ts` (`TheoryBlock`, `LessonContent`, `UserProgress`, `PathProgress`)
- [ ] `lib/xp.ts` con `calculateLessonXp`
- [ ] `lib/lessons/load.ts` — carica JSON da `/content/{lang}/{path}/{order}-{slug}.json`
- [ ] `lib/lessons/validate.ts` — `checkBlank(userInput, accepted)`
- [ ] `lib/lessons/progress.ts` — `getPathProgress`, `getNextLessonInPath`, server actions:
  - `recordAttempt(lessonId, blankIndex, userInput)` → ritorna `{ correct, hintLevel, reveal }`
  - `completeLesson(lessonId, attempts)` → upsert `user_progress` + update `users.total_xp`
- [ ] `lib/i18n/lessons.ts` — copy IT+EN
- [ ] `app/(app)/path/[slug]/page.tsx` — Server Component path overview
- [ ] `app/(app)/lesson/[id]/page.tsx` — Server Component lesson page
- [ ] `components/lessons/LessonShell.tsx` — wrapper
- [ ] `components/lessons/TheoryRenderer.tsx` — render 6 tipi di blocchi
- [ ] `components/lessons/ExerciseFillBlank.tsx` — riuso da `components/promptly/`, adattamento per server actions invece di logica solo client
- [ ] `components/lessons/LessonOutro.tsx` — card recap + CTA
- [ ] `components/lessons/XpToast.tsx` — toast animato
- [ ] `components/lessons/PathProgressBar.tsx`
- [ ] `components/dashboard/PathOverviewCard.tsx`
- [ ] `components/dashboard/ContinueCard.tsx`
- [ ] Dashboard `app/(app)/dashboard/page.tsx` aggiornata: stats reali + ContinueCard + 2 PathOverviewCard
- [ ] **1 lezione di esempio funzionante**: `content/en/mindset/01-what-is-vibe-coding.json` (vedi schema sopra), e una traduzione minima IT
- [ ] 1 illustrazione SVG per la lezione esempio: `assets/lessons/mindset-01.svg`
- [ ] Build + typecheck + lint clean
- [ ] Commit + push + verifica Netlify deploy verde

### Round 3b — Content authoring (round successivo, fuori scope di Round 3a)

- [ ] Scrivere lezioni 2-6 di Path 1 (in EN, poi IT) come JSON
- [ ] Scrivere lezioni 1-8 di Path 2 (in EN, poi IT)
- [ ] Generare 13 illustrazioni SVG aggiuntive
- [ ] Validare ogni lezione con un test manuale
- [ ] Wiring eventi PostHog

---

## Vincoli (uguali a Round 1+2)

- @supabase/ssr consistente
- Strict TypeScript, no `any`
- Microcopy SOLO via `lib/i18n/lessons.ts`
- middleware.ts resta no-op
- Build pulito + commit + push + Netlify verde sono OBBLIGATORI a fine round

---

## Riferimento alla teoria

Le 14 lezioni si basano sul materiale in `vibe-coding-teoria-completa.md`. Mappatura indicativa:

### Path 1 — Mindset (6 lezioni)

| # | Titolo | Sezione fonte |
|---|---|---|
| 1 | What is vibe coding? | §1 (definizione canonica + Karpathy) |
| 2 | You are the architect | §2 (cambio paradigma, product engineer) |
| 3 | Think in outcomes, not steps | §2 (intent vs syntax) + §6 (Intent passo 1) |
| 4 | Break it down | §6 (Spec, scomposizione) |
| 5 | Context is everything | §8 (context engineering) |
| 6 | The vibe coder's checklist | §6 (loop 7 passi sintetizzato) |

### Path 2 — Prompt (8 lezioni)

| # | Titolo | Sezione fonte |
|---|---|---|
| 1 | Anatomy of a great prompt | §7 (struttura prompt) |
| 2 | Give the AI a role | §7 (role priming) |
| 3 | Constraints are your friends | §7 (do/don't) |
| 4 | Describe the output format | §7 (output format) |
| 5 | Bad prompt vs good prompt | §7 (esempi comparison) |
| 6 | Prompt chaining | §7 (chained prompts) |
| 7 | The version problem | §7 (knowledge cutoff) |
| 8 | Prompt patterns library | §7 (5 template riutilizzabili) |

---

*Brief versione 1.0 — quando sei pronto, dai a Claude Code: "Implementa il Round 3a (scaffold lezioni + 1 lezione esempio) seguendo `LESSONS.md`. Conferma il piano prima di toccare codice. Termina sempre il round con build pulito + commit + push + verifica Netlify deploy verde, e riporta tutti e 4 i punti nel riepilogo finale."*

---

## Round 4 — V2 lesson format (planned, 2 May 2026)

Prossimo round di codice (fuori dallo scope del Round 3): wirearci il
formato V2 al renderer.

Checklist orientativa:

- [ ] `types/index.ts`: aggiungere discriminatore `format_version` su `LessonContent`, nuovi tipi `OpenQuestionBlock`, `ArchetypeQuizBlock`, `SectionHeadingBlock`, e `LessonV2Content` con `body` array misto.
- [ ] `lib/lessons/load.ts`: leggere `*.v2.json` quando presente, usare `format_version: 2` per scegliere la pipeline.
- [ ] Nuovo componente `components/lessons/OpenQuestion.tsx`: textarea + bottone submit + render del commento AI ricevuto.
- [ ] Nuovo componente `components/lessons/ArchetypeQuiz.tsx`: stato locale per le risposte, calcolo dominante, tie-breaking via `tie_breaker_priority`, reveal card per l'archetipo + bonus XP opzionale.
- [ ] Nuovo componente `components/lessons/SectionHeading.tsx`.
- [ ] Estendere `TheoryRenderer` o creare `LessonBodyRenderer` che cammina su `body[]` mischiando i tipi V1+V2.
- [ ] Nuova API route: `app/api/comment-answer/route.ts` → riceve `{lessonId, openQuestionId, userAnswer}`, cerca il `system_prompt` nella lezione caricata server-side (no input dal client), chiama OpenAI GPT-4o mini, ritorna 1-2 frasi di commento. Rate-limit 30/giorno/utente in MVP.
- [ ] `.env.example` già aggiornato con `OPENAI_API_KEY` + `OPENAI_MODEL=gpt-4o-mini`. Wirare `lib/ai/openai.ts`.
- [ ] Aggiornare `LessonContent` consumers (`page.tsx`, `LessonShell`) per supportare il branching V1/V2.
- [ ] PostHog: nuovi eventi `open_question_submitted { lesson_id, question_id, answer_chars, comment_received }` e `archetype_revealed { lesson_id, archetype_key }`.
- [ ] Migrare lezione 1 da V1 a V2 cancellando il file V1 una volta che il deploy V2 è stabile per ≥48h.
- [ ] Aggiornare GDPR / privacy con la disclosure "OpenAI US" come nuovo data processor.
