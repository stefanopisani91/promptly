# CLAUDE.md — Promptly

Sintesi operativa del progetto. Pensata per chi (persona o agente) apre la repo e deve orientarsi in fretta: cos'è il prodotto, com'è fatto il codice, dove vivono le cose, come si lavora.

Tienilo aggiornato quando cambia lo stack, il formato delle lezioni o le convenzioni. Per i dettagli storici di una singola feature, vedi i documenti elencati in fondo.

---

## Il prodotto

Promptly insegna il **vibe coding**: costruire software descrivendo a parole cosa si vuole, lasciando che l'AI scriva il codice. Non una raccolta di tutorial — un corso strutturato e gamificato dove ogni concetto si pratica subito con un esercizio valutato dall'AI.

- **Tagline:** *"Learn to build with words, not code."* / *"Impara a costruire con le parole, non con il codice."*
- **Pubblico:** dal principiante non-tech (marketer, designer, freelancer, curiosi) al junior developer che vuole accelerare con l'AI. Insegna pensiero e comunicazione, non sintassi.
- **Mascotte: Spark** — un mentore conversazionale con regole di voce precise (vedi `lib/ai/spark-system-prompt.ts`): parla in prima persona, calda ma diretta, niente toni paternalistici, niente "bravissimo/geniale", niente motivazionale-da-LinkedIn, niente emoji decorative. Usa le virgolette caporali italiane (`«»`).
- **Bilingue** IT/EN, mobile-first, in produzione su `https://learnpromptly.app/` (Netlify, deploy automatico da `main`).
- **Modello freemium (pianificato, Stripe non ancora integrato):** Free = Path 1 + Path 2 (quando Path 2 sarà sbloccato — vedi sotto). Pro (€6,99/mese o €29 una tantum) = Path 3-5 + valutazione AI estesa + certificato. Finché Stripe non è wired, il Pro non è raggiungibile da utente; la quota Spark per-tier esiste nel codice ma è inattiva.

---

## Stato attuale (maggio 2026)

| | |
|---|---|
| **Path 1 — Mindset** | 6 lezioni in formato **V3** (`*.v3.json`). Live, accessibile agli utenti. |
| **Path 2 — Prompt** | 8 lezioni in formato **V1** (`fill_blank`), presenti su disco ma **bloccate fino al lancio (1 giugno 2026)**: sulla mappa appaiono con un lock "in arrivo", e `/lesson/[id]` reindirizza i deep-link a `/dashboard?locked=path2`. Lo slug `"prompt"` è in `COMING_SOON_PATHS` (`lib/map/data.ts`). Le V1 verranno riscritte in V3 prima dello sblocco. |
| **Path 3-5 e bonus path** | Solo segnaposti sulla mappa. Nessun contenuto scritto. |
| **Dashboard** | Mappa visiva interattiva (`LearningMap`), non più una lista di card. |
| **Onboarding** | 12 step di profilazione (Welcome → Name → Experience → Intent → Project → Tools → PreferredTool → Time → Motivation → Recap → Promises → Transition). |
| **Pagamenti** | Stripe non integrato. |

---

## Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript strict (no `any`).
- **UI:** Tailwind + shadcn/ui (`components/ui/` è la base shadcn — non modificarla direttamente). Animazioni: CSS keyframes in `app/globals.css` come default; `framer-motion`, `lottie-react`, `canvas-confetti` dove serve; `@dnd-kit` per il drag-and-drop (widget lezione 6).
- **Backend:** Supabase (Postgres + Auth). `middleware.ts` fa solo il refresh della sessione.
- **AI:** Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) per la chat di Spark e per gli evaluator delle lezioni V3 2-6 — client in `lib/ai/anthropic.ts`, system prompt prompt-cached. OpenAI `gpt-4o-mini` per la demo Lucia / quick-win lezione 1 e per il commento V2 `open_question` — client in `lib/ai/openai.ts`. (`docs/archive/PROMPTLY.md` cita anche DeepSeek per i futuri Path 3-5: non è ancora wired.)
- **Email:** Resend (`lib/notifications/email-templates/`). Welcome email attiva dal dominio verificato `send.learnpromptly.app` (sender `welcome@`, replyTo `stepcloud3@icloud.com`); reminder streak pianificato.
- **Notifiche push:** Web Push (PWA install). Cron di reminder pianificato.
- **Analytics:** PostHog (istanza EU) via il wrapper `lib/analytics/posthog.ts`. **Gated sul consenso iubenda categoria 4 (Misurazione)**: `initPostHog()` parte solo dopo "Accetta tutto" / "Accetta Misurazione" dal banner cookie; su revoca dal pannello preferenze chiama `posthog.opt_out_capturing()` + `reset()`. `PostHogProvider` montato **in ciascuno dei 3 route group** (`app/(marketing)/[lang]/layout.tsx`, `app/(auth)/layout.tsx`, `app/(app)/layout.tsx`), ognuno dentro `<Suspense>`: la guardia `initialized` in `lib/analytics/posthog.ts` rende `initPostHog()` idempotente, quindi i tre mount convivono senza doppia inizializzazione. Il polling del consenso è uguale ovunque → copre marketing + auth + app senza buchi. Il wrapper `track()` controlla esplicitamente l'opt-out via `posthog.has_opted_out_capturing()` prima di ogni `capture()`, in aggiunta alla gating interna del SDK posthog-js. Doppia cintura: applicativa + SDK. Pattern voluto per chiarezza in audit GDPR. Se in futuro si toglie il proxy o si tocca la logica di consenso, ricordarsi che la fonte di verità è il cookie `_iub_cs-*` letto direttamente (non `_iub.cs.api.isConsentGiven()`, che ritorna `false` anche pre-scelta). **Reverse-proxy attivo**: il SDK punta a `/ingest` (non a `eu.i.posthog.com`); i 3 rewrites in `next.config.mjs` (`/ingest/static/*` → `eu-assets`, `/ingest/decide`, `/ingest/:path*` → `eu.i.posthog.com`) inoltrano le richieste mascherandole come traffico del nostro dominio, così filtri DNS aziendali tipo FortiGuard non le bloccano. Due flag non-ovvi in `posthog.init()`: `person_profiles: "always"` per ignorare il `defaultIdentifiedOnly: true` server-side (Promptly non chiama mai `identify()`, quindi senza override gli eventi anonymous del funnel landing vengono droppati), e `disable_compression: true` perché il rewrite Netlify corrompe i body binari gzip → PostHog rispondeva 400 "invalid GZIP data". Per future regressioni c'è `scripts/test-posthog-full-trace.mjs` — l'header del file documenta uso e limiti. Storia completa dei 3 fix in [BACKLOG.md → Urgente 0.1](BACKLOG.md).
- **Legal / Cookie banner:** iubenda (account `learnpromptly.app`, piano Advanced). Banner cookie integrato in `app/layout.tsx` via `<Script>` (Web Component `<tb-banner-wrapper>` con shadow DOM, brandizzato Promptly dalla dashboard iubenda). Link Privacy / Cookie / T&C nel footer marketing tramite `components/legal/IubendaLegalLinks.tsx` come overlay sopra il sito (no redirect). Policy ID: `64451899` (IT) e `23626902` (EN). Per modificare lo style del banner usa CSS variables dalla dashboard iubenda, non CSS locale (shadow DOM).
- **GDPR self-service nel profilo** (`/settings/profile`, pannello "Privacy & Dati" sotto "Le promesse di Spark"): (a) link "Gestisci preferenze cookie" → riapre il pannello iubenda (art. 7 — revoca facile come dare consenso); (b) "Elimina account" → modal con typed-email confirmation → `POST /api/account/delete` → `auth.admin.deleteUser` via service role + CASCADE su tutte le tabelle user-bound + log compliance in `public.account_deletions_log` (art. 17 diritto all'oblio). Rate-limit 5 chiamate/ora per IP in `lib/rate-limits/ip-rate-limiter.ts`.
- **Hosting:** Netlify, deploy automatico da `main` (se il webhook salta: pannello Netlify → Trigger deploy → Clear cache and deploy site).

---

## Comandi

```bash
npm run dev          # dev server
npm run build        # build di produzione (il prebuild esegue check-spark-tokens)
npm run lint         # next lint
npm run check-spark  # conta i token del system prompt di Spark
npx tsc --noEmit     # type-check
```

- Prima di un push: `npx tsc --noEmit && npm run build` devono essere puliti.
- Dopo aver modificato una lesson JSON: validala, es. `node -e "JSON.parse(require('fs').readFileSync('content/it/mindset/06-the-workflow.v3.json','utf8'))"`.
- Ogni cambio di testo in IT va rispecchiato in EN (salvo decisioni esplicite di drift).
- Commit per blocco di lavoro coerente, non micro-commit. Push manuale.
- Script di supporto in `scripts/`: `check-spark-tokens.ts`, `calibrate-motivation-compress.ts`, `spark-coherence-test.mjs`, `spark-raw-call.mjs`.

---

## Struttura del progetto

```
app/
├── (marketing)/[lang]/   # Landing pubblica (en|it) + login/signup alternativi + privacy/terms/cookie
├── (auth)/auth/          # Magic link + Google OAuth (+ callback, check-email, expired)
├── (auth)/onboarding/    # 12 step di profilazione
├── (app)/dashboard/      # LearningMap
├── (app)/path/[slug]/    # Overview di un path
├── (app)/lesson/[id]/    # Pagina lezione — dispatch V1/V2/V3 in base a format_version
├── (app)/settings/       # Account, lingua, daily goal, notifiche, billing (placeholder)
├── (app)/admin/users/    # Pannello admin (gated server-side su account_type)
└── api/
    ├── spark-chat/                  # Chat libera con Spark (Haiku)
    ├── comment-answer/              # Commento V2 open_question (gpt-4o-mini)
    ├── landing-evaluate/            # Demo Lucia + quick-win lezione 1 (gpt-4o-mini)
    ├── lesson-claudemd-evaluate/    # Quick-win lezione 2 (Haiku)
    ├── lesson-context-evaluate/     # Quick-win lezione 3 (Haiku)
    ├── lesson-constraints-evaluate/ # Quick-win lezione 4 (Haiku)
    ├── lesson-debug-evaluate/       # Quick-win lezione 5 (Haiku)
    ├── lesson-architecture-prompt/  # Quick-win lezione 6 (Haiku)
    └── qa-login/                    # Bypass QA dev-only (gitignored secret)

components/
├── ui/                   # shadcn base — non modificare
├── marketing/            # Landing (redesign editoriale maggio 2026): PromptlyWordmark, HeroSection,
│                         #   IphoneCarousel, MethodSection, MeetSparkSection, ToolsSection,
│                         #   CurriculumPreview, FAQSection, ClosingCTA, MarketingHeader/Footer,
│                         #   InteractiveExerciseDemo, lucia/, JsonLd*, ecc.
├── auth/  onboarding/profiling/steps/  settings/
├── dashboard/            # ContinueCard, DailyGoalCard, StreakHeatmap, SparkCompanionCard, ProfileMenu, ecc.
├── promptly/             # Cross-app: RobotAvatar, LevelBadge, LevelUpModal, ReferralCard, XPLevelBar
│   └── map/              # LearningMap, MapSection, MapNode, MapPathLine, MapRobotCursor, BiomeBackground, ecc.
├── glossary/             # GlossaryTerm, GlossaryPopover, GlossaryProvider, RichText
└── lessons/
    ├── (V1 legacy)       # LessonShell, TheoryRenderer, ExerciseFillBlank, OpenQuestion, ArchetypeQuiz, ...
    ├── LessonV2View.tsx
    └── v3/
        ├── LessonV3View.tsx   # Renderer top-level V3
        ├── SparkHeader.tsx    # Top bar sticky: vignette + Spark + contatore step
        ├── StepCard.tsx       # Wrapper card (larghezze: default max-w-2xl / medium max-w-4xl / wide max-w-5xl)
        ├── VignetteCloud.tsx  # Pensieri di Spark orbitanti
        ├── SparkChat.tsx  AskSparkBubble.tsx
        └── steps/             # TextStep, PrincipleStep, ChoiceStep, InputStep, InteractiveStep (dispatcher),
                               #   RewardStep, OptionCardSelector, SectionAccordion, ErrorTaxonomyBlocks,
                               #   PhaseMappingBlocks, ClaudemdEditor, ConstraintsEditor, ContextPromptEditor,
                               #   PromptArchitecture, DatabaseDisasterMockup, BrokenSessionDebugger

lib/
├── ai/            # anthropic.ts, openai.ts, spark-system-prompt.ts, promises.ts
├── lessons/       # load.ts (version detection), display.ts, validate.ts, progress.ts, paths.ts; v3/ evaluator
├── landing-demo/  # Demo Lucia: sito diegetico + console + tipi + system prompt + rate-limit
├── supabase/      # client.ts, server.ts, queries.ts (tutte le query DB), service.ts, types.ts
├── glossary/      # glossary.ts (dizionario), markup.ts (parser [[term:...]])
├── i18n/          # Stringhe IT/EN per ogni surface (auth, lessons, map, profiling, landing-it/en, ...)
├── notifications/ # Template email Resend + push
├── onboarding/    # project.ts, compress-project.ts, compress-motivation.ts, tools.ts
├── map/           # data.ts (dati LearningMap), layout.ts
├── rate-limits/   # Quota per account_type
├── analytics/posthog.ts
└── xp.ts  streak.ts  levels.ts  daily-goal.ts  bonus-paths.ts  unlock.ts  referral.ts  avatar.ts  confetti.ts  site.ts

content/<lang>/<path>/   # Lesson JSON statici (V1/V2/V3 convivono nella stessa cartella)
public/brand/            # Logo, icone lezioni (lessons/<id>.svg), OG image, brand/mobile/ (screenshot carosello)
types/index.ts           # Tutti i tipi TypeScript (~1000 righe — è il riferimento sui contratti dati)
```

---

## Formato delle lezioni

`lib/lessons/load.ts` carica, per ogni lesson id, il file con il `format_version` più alto disponibile. La pagina `/lesson/[id]` sceglie il renderer in base a quel valore (vedi le type guard `isLessonV2Content` / `isLessonV3Content` in `types/index.ts`):

- nessun `format_version` → **V1** → `TheoryRenderer` + `ExerciseFillBlank` (`fill_blank` con hint progressivi, validazione client-side)
- `format_version === 2` → **V2** → `LessonV2View` (`body` misto: prosa + `open_question` con commento gpt-4o-mini + `archetype_quiz` statico). Il `system_prompt` di ogni `open_question` è per-lezione, dentro il JSON — niente default globale.
- `format_version === 3` → **V3** → `LessonV3View` (formato attivo per i nuovi contenuti)

I file delle diverse versioni convivono (es. `01-what-is-vibe-coding.json` accanto a `.v2.json` e `.v3.json`): è la strategia di migrazione — si scrive la nuova versione e la vecchia si auto-pensiona alla prima visita. Non cancellare i file V1 finché la lezione non è migrata. Il contenuto vive in `/content`, **non** nel DB; nel DB vivono solo progresso utente, XP, streak, subscription.

### Lezioni V3

Una lezione V3 è un array di **step** mostrati card-by-card, vissuti come una conversazione con Spark invece che come un articolo. Tipi di step (definiti in `types/index.ts`, renderer in `components/lessons/v3/steps/`):

| Step | Cosa fa |
|---|---|
| `text` | Prosa narrativa di Spark; supporta `**bold**`, markup glossario, liste numerate |
| `principle` | Card "manifesto": headline + emphasis + caption |
| `choice` | Domanda a scelta multipla; può ramificare il `text` successivo |
| `input` | Risposta aperta dell'utente, commentata da Spark in 2-3 frasi |
| `interactive` | Il "quick-win" widget — uno per lezione (vedi sotto) |
| `reward` | Pop-up "+XP" o reveal archetipo |
| `error_taxonomy` | Lista di tipi di errore con cura associata (lezione 5) |
| `phase_mapping` | Lista di fasi con azioni (lezione 6) |

Ogni step può avere `vignettes`: fino a 3 chip orbitanti attorno a Spark che si espandono in popup. Larghezza della card via `StepCard` (default / `medium` / `wide`).

### Quick-win widget (uno per lezione)

Sono gli step `interactive`, alla fine di ogni lezione di Path 1, vissuti come "ho costruito qualcosa di mio":

| Lez | Widget | Route API | Produce |
|---|---|---|---|
| 1 | `lucia_prompt_loop` | `/api/landing-evaluate` | Fix dei 3 bug del sito di Lucia |
| 2 | `claudemd_editor` | `/api/lesson-claudemd-evaluate` | CLAUDE.md scaricabile |
| 3 | `context_prompt_editor` | `/api/lesson-context-evaluate` | Prompt context-rich scaricabile |
| 4 | `constraints_editor` | `/api/lesson-constraints-evaluate` | I 3 vincoli del progetto |
| 5 | `broken_session_debugger` | `/api/lesson-debug-evaluate` | Messaggio di stop che salva una sessione |
| 6 | `prompt_architecture` | `/api/lesson-architecture-prompt` | Prompt CONTESTO→VINCOLI→TASK→VERIFICA scaricabile |

Regole di comportamento dei widget (da rispettare per ogni widget nuovo — dettagli in `LESSON-GUIDELINES.md` § V3):

1. **Persistenza del testo tra tentativi.** Mai svuotare la textarea dopo un submit (no `setDraft("")` nel `finally`). Cascata: `sessionStorage` (chiave `<widget>:<userId>:<stepId>`) → stato persistito dal parent → vuoto. Più textarea = persistenza indipendente.
2. **Lock sincrono anti-doppio-submit.** Un `useRef(false)` controllato *prima* dello state `evaluating`, rilasciato nel `finally` — altrimenti tre click rapidi bruciano tre tentativi.
3. **Persistenza della reazione di Spark al rientro.** Lo `stepState` salva `lastReaction` (e `lastEvaluation` se ci sono barre dimensione); al mount si idrata da lì, niente ricostruzione band-based.
4. **Textarea riapribile al rientro.** Gate `!won && !exhausted` — un risultato persistito non blocca i tentativi residui. `won` deve riflettere la *vera* vittoria (es. Lucia: 3 bug menzionati **e** score ≥ soglia), con un'unica fonte di verità per la soglia.
5. **Clausola anti-bias su `project_description`.** Ogni system prompt valutatore che riceve `project_description` deve dichiarare che è solo contesto di sfondo e che non va premiata la ricchezza/lunghezza del progetto — valutare solo l'artefatto secondo i criteri.

---

## Sistemi trasversali

- **Spark — chat libera.** `SparkHeader` + `AskSparkBubble` + `SparkChat`. Quote per-tier nel codice (Free: 5 messaggi/lezione, 20/giorno; Pro più alte) ma non attive finché Stripe non è wired. Storage: `user_progress.spark_chat_count` per-lezione + tabella `spark_usage_daily`. Voce canonica in `lib/ai/spark-system-prompt.ts`.
- **Glossario Vivo.** Termini cliccabili definiti in `lib/glossary/glossary.ts`. Markup nei contenuti: `[[term:diff]]diff[[/term]]`; `RichText` parsa il markup e il `**bold**` inline. Il termine apre un popover con la definizione (voce di Spark) + bottone che apre la chat con un draft precompilato. Prima occorrenza cross-app evidenziata, le successive attenuate ma sempre cliccabili. "Seen" in `user_profiles.glossary_seen` (text[]).
- **XP, livelli, streak, daily goal.** XP **cosmetico e a senso unico** — sbloccano titoli e avatar, mai contenuti; nessuna azione "restituisce" XP in un loop chiuso (sbloccare una bonus path costa XP ma non ne dà indietro). La logica XP è **distribuita su 5 punti**, non concentrata in un file: (1) `lib/xp.ts` ha la formula di completamento lezione + la **penalità reveal** (XP dimezzati se l'utente si è fatto rivelare la risposta dopo 3 tentativi falliti); (2) i 6 widget V3 in `components/lessons/v3/steps/` (`ClaudemdEditor`, `ConstraintsEditor`, `BrokenSessionDebugger`, `BlockPicker`, `PromptArchitecture`, `InteractiveStep` per Lucia) hanno ciascuno una funzione `xpForResult()` che legge gli importi dal JSON della lezione (`xp_by_case`) e applica un **bonus first-try hardcoded nel widget** (spread 50-130 XP fra i widget — non normalizzato); (3) `lib/lessons/v3/LessonV3View.tsx` somma l'XP totale di lezione (base + difficulty + quick-win + eventuale archetype bonus); (4) `lib/supabase/queries.ts` gestisce gli XP del **referral** (referrer +300 per conversione, cap 10; referee +50 per conversione; +25 una tantum all'attivazione del link) e applica il **delta-anti-farm** in `upsertLessonCompletion()` — rifare una lezione già completata aggiunge solo l'eventuale differenza in positivo, mai negativo; (5) `lib/levels.ts` definisce le 7 soglie (0 / 500 / 1.200 / 2.500 / 4.000 / 6.000 / 10.000 XP) e il robot avatar DiceBear `bottts` con seed fisso per livello che evolve a ogni milestone. Streak con 1 freeze/settimana ISO auto-applicato al primo giorno saltato — `lib/streak.ts` (storage in `users.current_streak` + `daily_activity` + `streak_events`); **non rilascia XP**, ma vale come condizione per sbloccare alcune bonus path. Daily goal: 4 valori `mini` / `trivial` / `easy` / `pro` mappati a 5 / 10 / 15 / 30 min in `lib/daily-goal.ts`; **non rilascia XP**.
- **LearningMap.** Mappa verticale in `components/promptly/map/` (dati in `lib/map/`): 5 zone bioma per Path 1-5, nodi cliccabili per lezione, robot cursor sull'ultima lezione completata, bonus path come stelle laterali (oggi quasi tutte locked).
- **Bonus path.** 8 percorsi laterali in `lib/bonus-paths.ts` con condizioni di sblocco (soglia XP, achievement_path, streak, referral, AND composito — logica in `lib/unlock.ts`). Visibili sulla mappa; contenuto delle lezioni non scritto.
- **Referral.** Codice univoco per utente (`lib/referral.ts`), link `…/signup?ref=…`, XP al referrer e bonus al referee alla conversione, sblocca una bonus path. La conversione è tracciabile, lo share no.
- **Notifiche.** Push via Web Push (subscription in `users.push_subscription`), email via Resend dal dominio verificato `send.learnpromptly.app`. Welcome email attiva; reminder streak pianificato (cron).
- **Analytics.** Solo via `lib/analytics/posthog.ts`. Eventi standard: `signup_*`, `lesson_started/completed`, `streak_*`, `paywall_viewed`, `landing_*`, `map_*`, `level_up`, `referral_*`, ecc.

---

## Design system

Filosofia "Focused Academy": calmo e professionale, con momenti di celebrazione misurati. Linear più che Duolingo.

- **Colori:** tutti i colori sono CSS variables in `app/globals.css` — niente hex hardcoded. Brand `--primary` `#e8703f` (arancione, hover `#c8521f`). Canvas app `--background` `#fafafa`, `--surface` `#ffffff`; canvas marketing `--marketing-bg` `#FBF6F0` (cream caldo). Gamification: `--xp-gold` `#eab308`, `--streak-fire` `#dc2626`, `--streak-freeze` `#38bdf8`. Pro: `--pro-accent` `#7c3aed`.
- **Tool view (eccezione):** le scene che rappresentano un editor/IDE/terminale (oggi la demo Lucia) usano il dialetto "tool view" — token `--tool-*` (canvas dark, accento lime), `--macos-*` per i pallini chrome. Scoped *solo* a quelle scene; vietato come decorazione su marketing/app/lezioni. Dentro la tool view l'arancione brand = "voce dell'utente", il lime = "voce dello strumento".
- **Tipografia:** heading Plus Jakarta Sans 600-700; body/UI Inter; codice/prompt JetBrains Mono; wordmark "PROMPTLY" in Plus Jakarta Sans 700 (mai 800/900).
- **Animazioni:** CSS keyframes in `globals.css`, transform + opacity, tutte con fallback `prefers-reduced-motion`.

---

## Convenzioni di codice

- Niente stringhe UI hardcoded nei componenti: usa `lib/i18n/`.
- Tutte le query Supabase in `lib/supabase/queries.ts`, mai inline nei componenti.
- Niente chiamate dirette ad Anthropic / OpenAI / Stripe nei componenti: passa da `lib/ai/` (e `lib/stripe/` quando esisterà).
- TypeScript strict, niente `any`. Definisci i tipi in `types/index.ts` prima di usarli.
- Niente colori hex nei componenti: usa le CSS variables del design system.
- Logica streak solo in `lib/streak.ts`. La logica XP è invece **distribuita** (vedi § Sistemi trasversali → "XP, livelli, streak, daily goal" per la mappa completa dei 5 punti): se aggiungi una nuova fonte di XP, aggiornare contestualmente quella sezione e rispettare il principio cosmetico/a-senso-unico.
- I `system_prompt` delle `open_question` V2 sono per-lezione, dentro il JSON: niente default globale, e se manca il campo si fallisce esplicitamente.
- Non modificare `components/ui/` (base shadcn).
- Eventi PostHog solo via `lib/analytics/posthog.ts`.
- Quando Stripe esisterà: il webhook è la source of truth per `subscription_tier`; mai aggiornarlo da redirect client-side; check server-side prima di servire contenuto Pro.
- Voce di Spark: virgolette caporali (`«»`), niente emoji decorative, niente "bravissimo/geniale/fantastico", niente promesse di risultati magici.
- Mobile-first: testa su iPhone Safari (incluso schermo piccolo tipo SE) oltre al desktop.

---

## Altri documenti della repo

In root (attuali):

| File | A cosa serve |
|---|---|
| `BACKLOG.md` | Voci urgenti aperte (es. correlare le reazioni di Spark ai punteggi reali; ruotare i secret finiti in git history) + backlog post-launch. |
| `SECURITY-BACKLOG.md` | Igiene operativa di secrets e auth (rotazione chiavi, scoping `OPENAI_API_KEY`, rate-limit per-utente su `/api/comment-answer`, ecc.). |
| `LESSON-GUIDELINES.md` | Regole quick-win V3 (sezione iniziale — attuali) + decisioni di stile + workflow per scrivere lezioni. Lo schema V1/V2 più in basso è storico. |
| `Behavioral_Testing_Agent_Brief_v1.1.md` | Brief per l'agente di testing comportamentale (Playwright MCP): profili utente, scenari, formato report. |
| `GUIDA-DOMINIO.md` | Note personali di Stefano, gitignored. |

In `docs/archive/` (spec storiche — utili per il contesto di design e la cronologia delle decisioni, **non** per lo stato attuale; vedi `docs/archive/README.md`):

| File | Cosa contiene di ancora utile |
|---|---|
| `PROMPTLY.md` | Vision, business model freemium, razionale del design system (palette, "tool view"), taxonomy degli eventi PostHog. |
| `LANDING.md` | Brief landing di aprile 2026 + nota sul redesign editoriale di maggio 2026 (target, tono, pricing nascosto, bilinguismo, performance restano validi). |
| `DASHBOARD_V2.md` | Design della mappa visiva: zone bioma, sistema livelli/robot, catalogo e sblocco delle bonus path, referral. |

---

*Aggiorna questo file quando cambia il formato delle lezioni, lo stack, i sistemi trasversali o le convenzioni. Lo storico delle decisioni grosse vive nei commit e in `BACKLOG.md`; qui sta "cosa è vero adesso".*
