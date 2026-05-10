# CLAUDE.md — Promptly: contesto operativo

> File di riferimento aggiornato. Leggilo PRIMA di toccare qualsiasi altro file della repo.
>
> Sostituisce nei fatti `PROMPTLY.md` come single source of truth. I `.md` storici (PROMPTLY, LESSONS, LESSON-GUIDELINES, AUTH, DASHBOARD_V2, LANDING) sono mantenuti per cronologia ma sono parzialmente o totalmente stale — vedi `§ Mappa documenti` in fondo.
>
> Versione 1.0 — 10 May 2026 (lessons V3 — card-step + Spark mascot).

---

## Per umani che aprono la repo per la prima volta

Promptly è una webapp che insegna **vibe coding** — la pratica di costruire software a parole, non a codice. Stefano (il founder + autore unico) l'ha pensata come un corso strutturato e gamificato dove ogni concetto si tocca con mano, non si legge soltanto. La mascotte si chiama **Spark** ed è un personaggio vero: parla in prima persona, dolce ma diretta, mai paternalistica, mai motivazionale-da-LinkedIn. Spark non è un wrapper di ChatGPT, è una persona con regole di voce (vedi `lib/ai/spark-system-prompt.ts`).

Il sito è bilingue (IT/EN), responsive (mobile-first), gira su Next.js 14 + Supabase + Netlify. È pubblico su `https://learnpromptly.app/`. La verità della repo non sta in un singolo .md monolitico — sta nei TypeScript types (`types/index.ts`), nei contenuti (`/content/<lang>/<path>/<file>.v3.json`) e nei componenti (`components/lessons/v3/`). Questo file ti orienta.

Il prodotto ha attraversato tre formati di lezione (V1 fill-in-the-blank → V2 open-question + GPT-4o mini → V3 card-step + Spark mascot). Oggi V3 è lo standard attivo per i nuovi contenuti. V1 e V2 coesistono temporaneamente per le lezioni non ancora migrate.

---

## Per AI/dev: stato del progetto in 30 secondi

| Asse | Stato attuale (10 May 2026) |
|---|---|
| Hosting | `https://learnpromptly.app/` su Netlify, deploy auto da `main` |
| Stack | Next.js 14 (App Router) + Supabase (Postgres + Auth) + Tailwind + shadcn/ui + Stripe non wired |
| Tipi e schema | TypeScript strict, no `any`. Tutti i types in [types/index.ts](types/index.ts) (1030 righe) |
| Lezioni live | Path 1 V3 (6) + Path 2 V1 (8) — entrambi visibili agli utenti |
| AI provider attivi | OpenAI GPT-4o mini (open_question V2 + Lucia landing demo + alcuni evaluator V3); Anthropic Claude Haiku 4.5 (Spark chat + alcuni evaluator V3) |
| Dashboard | Mappa visiva interattiva (`LearningMap`) — non più la lista V1 |
| Onboarding | 12 step (Welcome → … → Promises → Transition) — non più 3 |
| Pro tier | Stripe NON wired, Pro non raggiungibile da utente. Quota Spark per-tier presente in code, attiverà quando Stripe è online |

---

## Vision e business model

**Tagline:** *"Learn to build with words, not code."* (IT: *"Impara a costruire con le parole, non con il codice."*)

**Cos'è davvero Promptly:** ogni guida sul vibe coding online è un articolo da leggere. Promptly è il primo **corso strutturato e interattivo** che ti fa praticare. Niente video lezioni, niente blog post lunghi: ogni lezione termina con un esercizio "quick win" valutato dall'AI, e ogni concetto si applica subito.

**Target:** beginner non-tech (marketer, designer, freelancer, curiosi) → junior developer che vuole accelerare con AI. Funziona per entrambi perché insegna **pensiero e comunicazione**, non sintassi.

**Freemium model (pianificato, Stripe non wired):**

| Tier | Accesso | Prezzo |
|---|---|---|
| **Free** | Path 1 (Mindset, 6 lez) + Path 2 (Prompt, 8 lez) | €0 |
| **Pro** | Path 3 + Path 4 + Path 5 + AI prompt evaluation + completion certificate | €6.99/mese o €29 una tantum |

Path 3-5 + Pro tier sono **discussione aperta, nessuna timeline**. Quando si attiva, lo Stripe webhook → `users.subscription_tier`.

---

## Stato lezioni — cosa esiste, in che formato

```
content/
├── en/
│   ├── mindset/        # Path 1 — V3 (.v3.json) per tutte le 6
│   └── prompt/         # Path 2 — V1 (.json fill_blank) per tutte le 8
└── it/                 # mirror IT
```

**Path 1 — Mindset (V3 attivo)**, 6 lezioni:
1. `mindset-01` — L'AI esegue. Tu dirigi. *(introduzione, archetipi, Lucia quick-win)*
2. `mindset-02` — Il giusto setup *(CLAUDE.md, IDE AI, claudemd_editor quick-win)*
3. `mindset-03` — Il contesto vale più del prompt *(4 livelli di contesto, context_prompt_editor quick-win)*
4. `mindset-04` — I vincoli ti salvano la vita *(3 tipi di vincoli, constraints_editor quick-win)*
5. `mindset-05` — Quando l'AI sbaglia, sbagli tu *(4 tipi di errore, broken_session_debugger quick-win)*
6. `mindset-06` — Il workflow ti farà risparmiare 20 ore al mese *(4 fasi del workflow, prompt_architecture quick-win)*

**Path 2 — Prompt (V1 fill-in-the-blank)**, 8 lezioni: 01-anatomy → 08-patterns-library. Visibili in produzione. **Prossima priorità: riscrittura in V3.**

**Path 3-5** non esistono come contenuto, solo segnaposti su mappa.

### Dispatch dei formati

`lib/lessons/load.ts` carica per ogni lesson id il file con il `format_version` più alto disponibile. La pagina `/lesson/[id]` poi dispatcha in base al `format_version`:

- `format_version` assente → V1 → renderer `TheoryRenderer` + `ExerciseFillBlank`
- `format_version === 2` → V2 → `LessonV2View`
- `format_version === 3` → V3 → `LessonV3View` (vedi sotto)

I file V1 e V2 vivono accanto ai V3 (es. `01-what-is-vibe-coding.json` + `01-what-is-vibe-coding.v3.json`) — il loader sceglie il più nuovo. Questa è la strategia di rollout: scrivi il `.v3.json`, il vecchio si auto-pensiona alla prima visita.

---

## Schema lezioni V3 (formato attivo)

V3 è un **array di step** card-by-card invece di un body scrollabile. L'utente naviga step-by-step come una conversazione con Spark, non legge un articolo.

```typescript
{
  id: "mindset-06",
  format_version: 3,
  path_slug: "mindset",
  order: 6,
  title: string,                // titolo principale lezione
  map_title?: string,           // label corto per la mappa (≤30 char)
  subtitle?: string,            // sottotitolo opzionale
  difficulty: "beginner" | "intermediate" | "advanced",
  estimated_minutes: number,
  base_xp: number,
  difficulty_bonus_xp: number,
  icon?: string,                // /brand/lessons/<id>.svg
  cliffhanger?: string,         // mostrato dopo completamento, anticipa lezione successiva
  steps: LessonV3Step[]
}
```

**Step types** (definiti in `types/index.ts`):

| Type | Cosa fa | Renderer |
|---|---|---|
| `text` | Paragrafi di prosa narrativa di Spark, supporta markdown bold + glossary markup + numbered list auto-rendering | `TextStep` |
| `principle` | Card "manifesto" con headline + emphasis + caption | `PrincipleStep` |
| `choice` | Domanda multiple-choice, può ramificare il prossimo `text` step via `paragraphs_by_choice` | `ChoiceStep` |
| `input` | Risposta aperta dell'utente, commentata da Spark in 2-3 frasi (GPT-4o mini) | `InputStep` |
| `interactive` | Quick-win widget pesante (uno per lezione). Vedi sotto | `InteractiveStep` (dispatcher) |
| `reward` | Pop-up "+150 XP" o reveal archetipo con bonus | `RewardStep` |
| `error_taxonomy` | Lista di N tipi di errore con cura associata (specifico lez 5) | `ErrorTaxonomyBlocks` |
| `phase_mapping` | Lista di fasi con sub-elenco di azioni narrative (specifico lez 6) | `PhaseMappingBlocks` |

Ogni step può avere `vignettes: Vignette[]` — pensieri di Spark che orbitano attorno alla mascotte (chip cliccabili che espandono in popup).

### Quick-win widget (uno per lezione)

Sono i blocchi `interactive` con `widget: "<key>"`. Ogni lezione di Path 1 V3 ne ha esattamente uno, alla fine, vissuto come "ho costruito qualcosa di mio":

| Lez | Widget | API route | Cosa produce |
|---|---|---|---|
| 1 | `lucia_prompt_loop` | `/api/landing-evaluate` | Fix dei 3 bug del sito di Lucia |
| 2 | `claudemd_editor` | `/api/lesson-claudemd-evaluate` | CLAUDE.md scaricabile |
| 3 | `context_prompt_editor` | `/api/lesson-context-evaluate` | Prompt context-rich scaricabile |
| 4 | `constraints_editor` | `/api/lesson-constraints-evaluate` | I 3 vincoli del progetto |
| 5 | `broken_session_debugger` | `/api/lesson-debug-evaluate` | Messaggio di stop che salva una sessione |
| 6 | `prompt_architecture` | `/api/lesson-architecture-prompt` | Prompt giornaliero CONTESTO→VINCOLI→TASK→VERIFICA, scaricabile come .md |

Le regole NON negoziabili sui quick-win sono in `LESSON-GUIDELINES.md` §V3 (persistenza testo tra tentativi, lock anti-doppio-submit, persistenza reazione AI tra rientri, sblocco textarea su rientro, bias clause su `project_description`).

---

## User journey end-to-end

```
LANDING (/it o /en)
  ├── Hero + mockup app + CTA "Inizia gratis"
  ├── Mini-demo Lucia (giocabile senza signup, 3 tentativi)
  ├── Sezioni: problema, soluzione, curriculum, social proof, FAQ
  └── CTA finale "Inizia gratis"
        ↓
AUTH (/auth)
  ├── Magic link (email) o Google OAuth
  └── /auth/callback → check profilo
        ↓
ONBOARDING (/onboarding) — 12 step interattivi
  Step 1   Welcome (Spark si presenta)
  Step 2   Nome
  Step 3   Experience level (mai_sentito / letto_non_provato / saltuario / quotidiano)
  Step 4   Intent (perché sei qui)
  Step 5   Project (preciso / vago / esplorando) + descrizione
  Step 6   Tools (multi-select IDE + LLM usati)
  Step 7   Preferred tool (single select tra quelli scelti)
  Step 8   Time (mini=2/trivial=5/easy=10/pro=15 min al giorno)
  Step 9   Motivation (come Spark può aiutarti meglio)
  Step 10  Recap (Spark riassume quello che ha capito)
  Step 11  Promises (impegni reciproci utente/Spark)
  Step 12  Transition (ingresso animato in dashboard)
        ↓
DASHBOARD (/dashboard) — `LearningMap` mappa visuale verticale
  ├── Top bar: avatar + livello XP + streak + total XP + invite
  ├── Mappa scrollabile: 5 path principali + bonus paths come ⭐ stelle laterali
  ├── Card "Continua dove eri rimasto"
  ├── DailyGoalCard + StreakHeatmap + recent lessons + Spark companion
        ↓
PATH OVERVIEW (/path/[slug])
  └── Lista lezioni con stato (completed/current/locked)
        ↓
LESSON (/lesson/[id])
  ├── V3: LessonV3View → SparkHeader + step cards + Footer (Indietro/Avanti)
  ├── Step-by-step navigation, autosave per step in user_progress.step_state
  ├── XP credito al completamento (con xpDelta su replay)
  └── Cliffhanger card finale + ritorno al path overview
        ↓
SETTINGS (/settings/profile)
  └── Avatar / lingua / daily goal / notifiche / billing (placeholder)
```

Pagine extra:
- `/admin/users` (account_type='dev' o 'beta' può accedere, gating server-side)
- `/[lang]/privacy`, `/[lang]/terms`, `/[lang]/cookie` (provisional, da rifare con legale prima del lancio pubblico)

---

## Sistemi trasversali

### Spark (mascotte conversazionale)

**Voice canon:** [`lib/ai/spark-system-prompt.ts`](lib/ai/spark-system-prompt.ts) (~6000 token persona, prompt-cached con Anthropic). Spark è dolce ma diretta, parla in prima persona, mai paternalistica, **mai** "geniale!"/"bravissimo!", niente emoji, niente motivational-da-LinkedIn.

**Chat libera:** componenti `SparkHeader` + `AskSparkBubble` + `SparkChat`. Quote: 5 messaggi/lezione + 20/giorno per Free; 20/lez + 80/giorno per Pro (gating attivo lato code, non raggiungibile finché Stripe non è wired). Storage: `user_progress.spark_chat_count` per-lezione + `spark_usage_daily` table per daily.

**Vignette:** ogni step V3 può avere fino a 3 chip orbitanti attorno a Spark (`Vignette[]`). Click → popup espanso con la frase intera. Solo Italian curly quotes via Unicode (`«»`), mai virgolette doppie ASCII.

### Glossario Vivo (termini cliccabili)

22 termini live in [`lib/glossary/glossary.ts`](lib/glossary/glossary.ts), copertura cross-Path 1. Markup nei contenuti: `[[term:diff]]diff[[/term]]`. Render: `RichText` parsa il markup + processa `**bold**` markdown inline; il termine diventa `<GlossaryTerm>` con popover che mostra la definizione di Spark + bottone "approfondisci" che apre la chat con un draft pre-compilato.

Convenzione: la prima occorrenza cross-app del termine è cliccabile (visivamente "highlighter"), le successive sono attenuate ma sempre cliccabili. Tracking dei "seen" via `user_profiles.glossary_seen` text[].

### XP, livelli, streak, daily goal

- **XP**: cosmetico (non sblocca contenuto). Formula in [`lib/xp.ts`](lib/xp.ts). Display: navbar + LevelUpModal + completion card.
- **Livelli**: derivati da XP totale via [`lib/levels.ts`](lib/levels.ts). Robot avatar evolve di forma a milestone.
- **Streak**: 1 freeze/settimana ISO che si auto-applica al primo missed day. Storage in `users.current_streak` + `users.freeze_*` + `daily_activity` + `streak_events`. Logic in [`lib/streak.ts`](lib/streak.ts).
- **Daily goal**: 4 valori (mini=2 / trivial=5 / easy=10 / pro=15 min). Determina pienezza del DailyGoalRing, copy reminder, quando uno streak day "conta".

### Mappa visiva (LearningMap)

Spec di design in `DASHBOARD_V2.md`, implementata in [`components/promptly/map/`](components/promptly/map/). 5 zone biome (villaggio/foresta/urbana/industriale/spazio per Path 1-5), nodi cerchio cliccabili per ogni lezione, robot cursor sull'ultima lezione completata, bonus paths come stelle laterali (oggi: visibili ma quasi tutti locked).

### Bonus paths

Definiti in [`lib/bonus-paths.ts`](lib/bonus-paths.ts) — 8 percorsi laterali (Auth, Pagamenti, AI Memory, ecc.) con condizioni di sblocco (XP threshold, achievement_path, ecc.). **Stato: visibili sulla LearningMap come stelle ⭐, contenuto delle lezioni bonus non scritto.** I types ci sono, le lezioni no.

### Notifiche (push + email)

- **Push** via Web Push (PWA install). Subscriptions in `users.push_subscription`.
- **Email** via Resend. Templates in [`lib/notifications/email-templates/`](lib/notifications/email-templates/). Welcome email completata; reminder streak ⏳ pending.
- **Cron** Vercel/Netlify ogni 15 min — `/api/notifications/cron` (planned).

### Analytics

PostHog (EU instance) — wrapper [`lib/analytics/posthog.ts`](lib/analytics/posthog.ts). Eventi standard: `signup_*`, `lesson_started/completed`, `streak_*`, `paywall_viewed`, ecc. Vedi PROMPTLY.md §Analytics per il taxonomy completo (ancora valido).

---

## Design system in sintesi

**Filosofia:** "Focused Academy" — Linear meets Duolingo. Calmo, professionale, con momenti di celebrazione misurati.

**Palette tokens** (CSS vars in `app/globals.css`):
- Brand: `--primary` `#E8703F` (orange), `--primary-hover` `#C8521F`
- Canvas: `--background` `#FAFAFA`, `--surface` `#FFFFFF`, `--border` `#E5E5E5`
- Text: `--text-primary` `#0A0A0A`, `--text-secondary` `#525252`, `--text-muted` `#A3A3A3`
- Gamification: `--xp-gold` `#EAB308`, `--streak-fire` `#DC2626`, `--streak-freeze` `#38BDF8`
- Pro: `--pro-accent` `#7C3AED`
- Tool view (IDE/terminal scenes only — Lucia demo): vedi PROMPTLY.md §Tool view

**Type:**
- Headings: Plus Jakarta Sans 600-700
- Body/UI: Inter 400 / 500 medium emphasis
- Code/prompt: JetBrains Mono
- Wordmark "PROMPTLY": Plus Jakarta Sans 700 (mai 800/900)

**Componenti rilevanti:**
- `StepCard` ha 3 width: default (`max-w-2xl`), `medium` (`max-w-4xl`, lez 6 step 13), `wide` (`max-w-5xl`, widget side-by-side)
- shadcn/ui base in `components/ui/` — **non modificare direttamente**

---

## Struttura cartelle (essenziale)

```
app/
├── (marketing)/[lang]/         # Landing pubblica + privacy/terms/cookie
├── (auth)/auth/                # Magic link + Google OAuth
├── (auth)/onboarding/          # 12 step profilazione
├── (app)/dashboard/            # LearningMap
├── (app)/path/[slug]/          # Path overview
├── (app)/lesson/[id]/          # Pagina lezione (V1/V2/V3 dispatch)
├── (app)/settings/profile/     # Account + lingua + goal + notifiche
├── (app)/admin/users/          # Pannello admin (account_type gated)
└── api/
    ├── comment-answer/             # V2 open_question (GPT-4o mini)
    ├── landing-evaluate/           # Lucia demo + lez 1 quick-win
    ├── spark-chat/                 # Chat libera con Spark (Haiku 4.5)
    ├── lesson-claudemd-evaluate/   # Quick-win lez 2
    ├── lesson-context-evaluate/    # Quick-win lez 3
    ├── lesson-constraints-evaluate/ # Quick-win lez 4
    ├── lesson-debug-evaluate/      # Quick-win lez 5
    ├── lesson-architecture-prompt/ # Quick-win lez 6
    └── qa-login/                   # GITIGNORED — dev-only QA bypass

components/
├── ui/                         # shadcn (NON modificare)
├── marketing/                  # Landing components
├── auth/                       # Auth + login
├── onboarding/profiling/       # 12 step onboarding
├── dashboard/                  # ContinueCard, DailyGoalCard, ecc.
├── promptly/                   # Cross-app: map, level badge, robot avatar, referral
├── glossary/                   # Glossario Vivo
└── lessons/
    ├── (V1 legacy)             # ExerciseFillBlank, TheoryRenderer, LessonShell
    ├── LessonV2View.tsx        # V2 (open_question + archetype_quiz)
    └── v3/
        ├── LessonV3View.tsx    # Top-level V3 renderer
        ├── SparkHeader.tsx     # Sticky top bar con vignette + Spark + step counter
        ├── StepCard.tsx        # Wrapper card per ogni step (default/medium/wide)
        ├── VignetteCloud.tsx   # Pensieri orbitanti di Spark
        └── steps/              # 14 componenti step (TextStep, ChoiceStep, ...)

lib/
├── ai/                         # Anthropic + OpenAI clients + Spark system prompts
├── glossary/                   # Dictionary + markup parser
├── lessons/                    # Loader + version detection + V3 evaluators
├── landing-demo/               # Lucia (sito + console + tipi + system prompt)
├── supabase/                   # Client + queries (TUTTE le query DB qui)
├── notifications/              # Email templates Resend + push (planned)
├── i18n/                       # IT/EN strings per ogni surface
├── analytics/                  # PostHog wrapper
├── xp.ts                       # XP formula
├── streak.ts                   # Streak + freeze logic
├── levels.ts                   # XP → level mapping
├── bonus-paths.ts              # Bonus paths config + unlock conditions
├── daily-goal.ts               # Daily goal helpers
└── map/data.ts                 # LearningMap data builder

content/<lang>/<path>/          # Static lesson JSON (V1/V2/V3 coexisting)
public/brand/                   # Logo, lesson icons, OG image
assets/                         # SVG sources non-served
types/index.ts                  # TUTTI i tipi (1030 righe — è la verità)
```

---

## Regole d'oro per Claude Code (non negoziabili)

1. **NEVER** hardcode UI strings nei componenti. Usa `lib/i18n/`.
2. **NEVER** scrivere DB queries dentro componenti. Tutte le query Supabase vivono in `lib/supabase/queries.ts`.
3. **NEVER** modificare file in `components/ui/` (shadcn base).
4. **NEVER** chiamare Anthropic / OpenAI / Stripe direttamente nei componenti. Usa `lib/ai/` e `lib/stripe/` (quando esisterà).
5. **NEVER** usare `any` in TypeScript. Strict mode, niente eccezioni.
6. **ALWAYS** definire types in `types/index.ts` prima di usarli.
7. **ALWAYS** usare CSS variables del design system — niente hex hardcoded.
8. **ALWAYS** server-side check su `subscription_tier` prima di servire contenuto Pro (non fidarsi del client).
9. **ALWAYS** validare il `format_version` prima di trattare un lesson content come V1/V2/V3.
10. **Lesson content** vive in `/content`, **NON** nel database. Progresso utente, streak, XP, subscription **vivono** nel database.
11. **XP logic** sta solo in `lib/xp.ts`. **Streak logic** sta solo in `lib/streak.ts`.
12. **System prompts V2 `open_question`** sono per-lezione, dentro la lesson JSON. Niente default globale, mai sostituire silenziosamente.
13. **Quick-win widget V3**: persistenza testo tra tentativi obbligatoria, lock sincrono anti-doppio-submit obbligatorio. Vedi `LESSON-GUIDELINES.md` §V3.
14. **Stripe webhook** è la source of truth per `subscription_tier`. Mai aggiornare da redirect client-side. (Quando esisterà.)
15. **PostHog events** vanno via `lib/analytics/posthog.ts`. Niente `posthog.capture` inline.
16. **Spark voice**: Italian curly quotes (`«»`), niente emoji decorative, niente "bravissimo"/"geniale"/"fantastico", mai promesse di risultati magici.

---

## Mappa documenti del repo

| File | Stato | Da consultare per… |
|---|---|---|
| **CLAUDE.md** *(questo file)* | ✅ Attuale | Tutto. Punto di partenza unico. |
| `BACKLOG.md` | ✅ Attuale | Voci urgenti + backlog post-launch features |
| `SECURITY-BACKLOG.md` | ✅ Attuale | Igiene operativa secrets + auth |
| `LESSON-GUIDELINES.md` | ⚠️ Parzialmente stale | Regole V3 quick-win (in cima, attuali). Schema V1/V2 (stale). Workflow autoraggio (attuale). |
| `Glossario_Vivo_Blueprint.md` | ⚠️ Implementato | Spec storica della feature. Verità di runtime in `lib/glossary/`. |
| `Behavioral_Testing_Agent_Brief_v1.1.md` | ✅ Attuale | Operativo per testing agent (Playwright MCP) |
| `LANDING.md` | ⚠️ Parzialmente stale | Layout + sezioni landing (mostly current). Routing/components reference (verifica con codice). |
| `PROMPTLY.md` | 🚫 STALE | Reference storica della vision. Dati tecnici stale (V1/V2, daily_goal 3 valori, onboarding 3 step). |
| `LESSONS.md` | 🚫 STALE | Spec V1, già marcata superseded. |
| `DASHBOARD_V2.md` | 🚫 STALE (memorial) | Spec design del map dashboard. Ora implementata in code. |
| `AUTH.md` | 🚫 STALE | Onboarding 3 step (oggi 12). Auth flow ancora ok in linea generale. |
| `GUIDA-DOMINIO.md` | 🔒 Gitignored | Note personali Stefano, non in git |

---

## Pattern di lavoro consolidati

- **Commit unico per blocco di lavoro coerente**, non commit-per-fix-mini. Push manuale, mai automatico.
- **Build clean obbligatorio** prima di push: `npx tsc --noEmit && npm run build`
- **JSON validation** dopo edit di lesson content: `node -e "JSON.parse(require('fs').readFileSync('content/it/mindset/06-the-workflow.v3.json','utf8'))"`
- **Bilingue:** ogni cambio testo in IT richiede mirror in EN, salvo decisioni esplicite di drift
- **Mobile-first:** test su iPhone Safari + iPhone SE schermo piccolo, in più desktop
- **Hot reload + Netlify deploy auto** da `main` — webhook a volte salta, in quel caso `Trigger deploy → Clear cache and deploy site` dal pannello

---

*Aggiorna questo file quando: cambia il formato lezioni, cambia lo stack, vengono aggiunti nuovi sistemi trasversali, cambiano le regole d'oro. Lo storico delle decisioni grosse vive nei commit + nel BACKLOG; questo è il "cosa è vero ADESSO".*
