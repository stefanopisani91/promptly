# VIBE CODING — Teoria Completa

> Documento di ricerca per la creazione di un corso interattivo in stile Mimo.
> Materiale destinato a essere trasformato in spiegazioni sintetiche, quiz ed esercizi.
> Struttura progressiva: dai fondamentali per principianti alle pratiche professionali avanzate.

---

## INDICE

1. [Cos'è il vibe coding (origini e definizione canonica)](#1-cosè-il-vibe-coding)
2. [Il cambio di paradigma: dall'inglese come linguaggio di programmazione alla nascita del *product engineer*](#2-il-cambio-di-paradigma)
3. [Lo spettro del vibe coding: dal puro al vibe engineering](#3-lo-spettro-del-vibe-coding)
4. [I tre livelli di astrazione: code completion → conversational → agentic](#4-i-tre-livelli-di-astrazione)
5. [L'ecosistema degli strumenti (cosa scegliere, quando, perché)](#5-lecosistema-degli-strumenti)
6. [Il workflow fondamentale: il loop in 7 passi](#6-il-workflow-fondamentale)
7. [Prompt engineering per il vibe coding](#7-prompt-engineering)
8. [Context engineering: la nuova evoluzione del prompt](#8-context-engineering)
9. [I file di regole: CLAUDE.md, AGENTS.md, .cursorrules](#9-i-file-di-regole)
10. [Spec-Driven Development e Research-Plan-Implement](#10-spec-driven-development)
11. [MCP (Model Context Protocol) e l'apertura agli strumenti esterni](#11-mcp)
12. [Version control e Git per vibe coder](#12-version-control)
13. [Testing, review e debugging in un mondo a velocità AI](#13-testing-review-debugging)
14. [Sicurezza: la responsabilità che non puoi delegare](#14-sicurezza)
15. [Errori comuni e antipattern](#15-errori-comuni)
16. [Deployment: portare in produzione un progetto vibe-coded](#16-deployment)
17. [Vibe coding per profili diversi (founder, PM, designer, dev)](#17-vibe-coding-per-profili-diversi)
18. [Progetti pratici e idee per esercitarsi](#18-progetti-pratici)
19. [Il futuro: vibe engineering, agentic engineering, continuous AI](#19-il-futuro)
20. [Glossario completo](#20-glossario)

---

## 1. COS'È IL VIBE CODING

### La definizione canonica

Il termine **"vibe coding"** è stato coniato da **Andrej Karpathy** — co-fondatore di OpenAI ed ex direttore AI di Tesla — in un post su X (Twitter) il **2 febbraio 2025**.

> *"There's a new kind of coding I call 'vibe coding', where you fully give in to the vibes, embrace exponentials, and forget that the code even exists. It's possible because the LLMs (e.g. Cursor Composer w Sonnet) are getting too good. Also I just talk to Composer with SuperWhisper."*
> — Andrej Karpathy, 2 febbraio 2025

Il post è diventato virale, raggiungendo oltre **4,5 milioni di visualizzazioni** in poche settimane. Nel marzo 2025 Merriam-Webster ha aggiunto "vibe coding" ai termini di tendenza. Nel **novembre 2025 Collins Dictionary lo ha eletto Parola dell'Anno 2025**.

### Come Karpathy descrive concretamente il vibe coding

Nel suo tweet originale, Karpathy descrive sei comportamenti specifici:

1. Parla all'IDE tramite **input vocale** (usa SuperWhisper) invece di digitare.
2. Chiede modifiche colloquiali del tipo *"riduci di metà il padding della sidebar"*.
3. Clicca **"Accept All"** su tutte le modifiche, senza leggere le diff.
4. Quando c'è un errore, **copia-incolla il messaggio** nella chat senza commento.
5. Lascia che la base di codice **cresca oltre la sua piena comprensione**.
6. Quando l'AI non riesce a sistemare un bug, chiede modifiche random finché il problema sparisce.

### La distinzione fondamentale (Simon Willison)

Il programmatore Simon Willison ha formulato la distinzione più chiara, ormai accettata da tutta la comunità:

> *"If an LLM wrote every line of your code, but you've reviewed, tested, and understood it all, that's not vibe coding in my book — that's using an LLM as a typing assistant."*

**In pratica:**
- **Vibe coding puro** = costruire software con un LLM **senza rivedere il codice** che scrive.
- **Programmazione assistita dall'AI** = usare un LLM per scrivere codice che **poi rivedi, testi e capisci**.

Questa distinzione è critica perché determina **quando il vibe coding è appropriato e quando no**.

### Perché è esploso

- I modelli sono diventati abbastanza capaci da produrre codice utilizzabile dalla prima iterazione.
- L'avvento di **agenti di coding** (Claude Code, Codex CLI, Gemini CLI) che pianificano, eseguono e verificano in autonomia.
- Y Combinator nell'inverno 2025 ha riportato che il **25% delle startup del batch aveva codebase per il 95% generate da AI**.
- Nel 2026, **41% di tutto il codice scritto globalmente è AI-generated** e il **92% degli sviluppatori USA** usa quotidianamente strumenti AI.

### La frase precorritrice

Karpathy aveva già anticipato il concetto nel 2023 con la celebre frase:

> *"The hottest new programming language is English."*

Il vibe coding ne è la realizzazione pratica: l'intento espresso in linguaggio naturale che diventa software.

---

## 2. IL CAMBIO DI PARADIGMA

### Da "code writer" a "product engineer"

Il vibe coding non è solo una tecnica: è un **cambio di mindset**.

| Sviluppatore tradizionale | Vibe coder / Product engineer |
|---|---|
| Si concentra sulla **sintassi** | Si concentra sull'**intento** |
| Scrive ogni riga | **Dirige** la generazione |
| "Come scrivo questa funzione?" | "Qual è il modo migliore di risolvere questo problema?" |
| Pensa in termini di codice | Pensa in termini di **prodotto** |
| Conoscenza profonda del linguaggio | **Prompt engineering** + system thinking |
| Ottimizza il codice | Ottimizza il **risultato per l'utente** |

### Le nuove competenze chiave

1. **Pensiero chiaro e specifico** — saper descrivere intenzioni con precisione.
2. **Prompt engineering** — strutturare richieste che generano output di qualità.
3. **Context engineering** — preparare l'ambiente perché l'AI non possa fallire.
4. **System design** — capire come i pezzi si incastrano, anche senza scriverli.
5. **Code review critica** — saper leggere e valutare codice scritto da altri (l'AI).
6. **Iteration mindset** — accettare che il primo output non è mai quello finale.
7. **Misconception spotting** — l'arte di riconoscere risposte plausibilmente sbagliate.

### Il principio di democratizzazione

Karpathy stesso ha sottolineato che il vibe coding **abbassa drasticamente la barriera d'ingresso**. Persone senza laurea in informatica, senza bootcamp alle spalle, possono ora costruire strumenti per automatizzare le proprie attività. È la maggiore democratizzazione del software dall'invenzione del web.

Casi reali documentati nel 2025-2026:
- Un insegnante di scuola elementare rurale ha costruito strumenti didattici personalizzati.
- Un camionista ha creato un'app gestionale per la sua attività.
- Founder non tecnici lanciano MVP completi in pochi giorni.
- Un giornalista del NYT (Kevin Roose) ha creato "software for one" — applicazioni iperpersonalizzate per uso strettamente personale.

### La critica seria: il "comprehension gap"

Andrew Ng e altri hanno osservato che il termine **fuorvia**: gli ingegneri esperti che usano AI non "vibrano", ragionano. E ricerche del 2025-2026 (CodeRabbit, METR, GitClear) hanno documentato:
- Il codice co-scritto con AI ha **1,7x più issue gravi** rispetto a codice umano.
- **2,74x più vulnerabilità di sicurezza**.
- **75% in più di misconfigurazioni**.
- **45% del codice AI-generato ha falle di sicurezza** secondo studi sul tema.
- I dev passano fino al **63% di tempo in più a debuggare** codice AI rispetto al loro.

Il messaggio: **il vibe coding è uno strumento potente, ma in produzione richiede disciplina**.

---

## 3. LO SPETTRO DEL VIBE CODING

Non esiste "il vibe coding" in senso assoluto. Esiste uno **spettro** di pratiche che vanno dal totalmente irresponsabile al rigorosamente professionale.

```
PURO VIBE CODING         AUGMENTED CODING        VIBE ENGINEERING        AGENTIC ENGINEERING
"Forget that the code    (Kent Beck)             (Simon Willison)         (Multi-agent, autonomous)
even exists"
       │                        │                       │                          │
       └─── più velocità ────────────────────────── più rigore ────────────────────┘

       └─── più rischio ────────────────────────── più affidabilità ───────────────┘
```

### Puro vibe coding
- "Forget that the code even exists."
- Accettare l'output senza review.
- Adatto a: prototipi, "throwaway weekend projects", esperimenti personali, "software for one".

### Augmented coding (Kent Beck)
- L'AI scrive, ma **valuti la complessità, leggi i test, mantieni copertura**.
- Stesso sistema di valori del coding manuale: codice pulito che funziona.
- Solo non lo digiti tu.

### Vibe engineering (Simon Willison, ottobre 2025)
- Professionisti esperti che usano LLM **mantenendo piena accountability**.
- Test automatizzati, documentazione, version control rigoroso, code review.
- Spesso girano **più agenti in parallelo**, supervisionando.
- "Una forma molto strana di management."

### Agentic engineering / Continuous AI (2026)
- Sistemi di agenti che operano in modo continuo nel ciclo di sviluppo.
- L'AI non è uno strumento che invochi, ma un'infrastruttura che gira.
- Multi-agent orchestration, sub-agents specializzati, hooks automatici.

### Quando usare quale livello

| Scenario | Approccio appropriato |
|---|---|
| Imparare un concetto, esperimento personale | Puro vibe coding |
| Hackathon, internal tool, demo | Vibe coding o augmented |
| MVP da mostrare a investitori | Augmented coding |
| Prodotto con utenti reali | Vibe engineering minimo |
| Sistema enterprise / fintech / healthcare | Vibe engineering rigoroso o solo IDE assist |
| Codice di sicurezza critica | Mai puro vibe — sempre review umana |

---

## 4. I TRE LIVELLI DI ASTRAZIONE

L'evoluzione storica degli strumenti di AI per il coding può essere letta come un'**ascensione del livello di astrazione**.

### Livello 1 — Code completion (2021-2024)
- Esempi: GitHub Copilot, Tabnine, primo IntelliCode.
- Suggerisce la riga successiva o completa la funzione.
- **Sintassi-level**: l'AI ti aiuta a digitare, tu pensi all'architettura.

### Livello 2 — Conversational (2024-2025)
- Esempi: ChatGPT, Claude.ai, Cursor (chat e Composer), Bolt.new, v0.
- Descrivi una funzione/feature/UI, l'AI genera blocchi interi.
- **Feature-level**: lavori per pezzi, l'AI genera componenti completi.
- Karpathy ha coniato "vibe coding" proprio quando questo livello è diventato fluido.

### Livello 3 — Agentic (2025-2026)
- Esempi: Claude Code, Codex CLI, Gemini CLI, Devin, Cursor Agent Mode, Windsurf Cascade.
- Dai un obiettivo di alto livello ("refactora il sistema di auth a JWT").
- L'agente **pianifica, edita più file, esegue test, interpreta i risultati, itera**.
- **Task-level / system-level**: l'AI gestisce flussi multi-step in autonomia.

### MCP (Model Context Protocol)
È il protocollo standard nato a fine 2024 che permette agli agenti di **accedere a strumenti esterni**: database, browser, GitHub, Jira, Slack. Approfondito al capitolo 11.

### Implicazione didattica
Un buon corso di vibe coding deve introdurre gli studenti progressivamente a tutti e tre i livelli, perché ognuno richiede mindset e tecniche diverse.

---

## 5. L'ECOSISTEMA DEGLI STRUMENTI

Nel 2026 esistono **oltre 138 strumenti** classificabili in **7 categorie principali**. Conoscere queste categorie è più importante che memorizzare i singoli prodotti, che cambiano rapidamente.

### Le 7 categorie

1. **AI-native IDE** — Cursor, Windsurf, Zed
2. **AI code editor extensions** — GitHub Copilot, JetBrains AI, Codeium
3. **Terminal agents** — Claude Code, Codex CLI, Gemini CLI, Aider
4. **Browser-based full-stack builders** — Bolt.new, Lovable, Replit, Firebase Studio
5. **Component generators** — v0 (Vercel), Lovable design mode
6. **Spec-driven IDE** — Kiro, GitHub Spec Kit
7. **Business app builders / no-code AI** — Base44, Softr, Hostinger Horizons, Rocket.new, Taskade Genesis

### Profilo per profilo: cosa scegliere

| Profilo utente | Punto di partenza ideale |
|---|---|
| Mai aperto un terminale | **Lovable**, **Bolt.new**, **Base44** o **Replit** |
| Conosce HTML/CSS, niente Git | **Cursor** o **Windsurf** |
| Sviluppatore esperto, ama VS Code | **Cursor** + GitHub Copilot |
| Sviluppatore esperto, ama il terminale | **Claude Code** + Cursor per editing visivo |
| Team enterprise | Combinazione: Cursor (daily) + Claude Code (refactor) + Copilot (sicurezza) |
| Designer / UI focus | **v0** (per componenti React) o **Lovable** (per app intere) |
| Founder non tecnico | **Lovable** Pro come ingresso, poi salire la "ladder" |

### La "non-engineer upgrade ladder"

```
Lovable / Bolt.new   →   Windsurf / Cursor   →   Claude Code
(no terminale)            (IDE visuale)              (terminale, max potenza)
```

**Regola**: non saltare livelli. Ogni step richiede competenze nuove.

### Confronto rapido dei tre dominant tools del 2026

| Caratteristica | Cursor | Windsurf | Claude Code |
|---|---|---|---|
| Forma | IDE (VS Code fork) | IDE (VS Code fork) | CLI / terminale |
| Filosofia | "AI integrato nel workflow" | "AI partner, blurred boundary" | "AI agente architettonico" |
| Punto di forza | Composer, Tab completion | Cascade Flows, persistent context | Context window 1M token, multi-file refactor |
| Pricing 2026 (base) | $20/mo Pro | $15/mo Pro | $20/mo Pro |
| Best for | Daily coding | Coding collaborativo continuo | Task complessi, refactor enterprise |
| Modelli | Multi-model (Claude, GPT, Gemini) | Multi-model + Arena Mode | Claude Sonnet/Opus |
| File di config | `.cursor/rules/*.mdc` | `.windsurfrules` | `CLAUDE.md` |

### App builders: codice che gestisci tu vs codice gestito

| Tool | Code ownership | Backend | Hosting | Best for |
|---|---|---|---|---|
| **Cursor** | Tu (locale) | Porta tu | Porta tu | Dev professionali |
| **Bolt.new** | Tu (esportabile) | StackBlitz container | Manuale | Prototipi rapidi |
| **Lovable** | Tu (esportabile) | Supabase integrato | Vercel/Netlify | MVP design-first |
| **Replit** | Tu (cloud Replit) | Replit DB / external | Replit deploy | Beginner all-in-one |
| **v0** | Tu (componenti) | — (solo UI) | Vercel | Componenti React |
| **Base44** | Loro | Loro | Loro | Non-tech founder |
| **Firebase Studio** | Tu (esportabile) | Firebase | Firebase Hosting | App con auth complessa |

### Il pattern multi-tool

Nel 2026 il team-best-practice è usare **2-3 strumenti combinati**:
- **80%** del lavoro quotidiano in un AI IDE (Cursor o Windsurf).
- **15%** dei task complessi in un terminale agentic (Claude Code).
- **5%** prototipazione veloce in un browser builder (Bolt o Lovable).

> "A good prompt in a mediocre tool beats a bad prompt in the best tool."
> Il fattore decisivo non è quale strumento usi, ma **quanto bene sai promptarlo**.

---

## 6. IL WORKFLOW FONDAMENTALE

Il vibe coding efficace **non è "apri Cursor e digita"**. Segue un loop strutturato. La struttura è ciò che separa il vibe coding produttivo dal "prompt-and-pray" caotico.

### Il loop in 7 passi

```
INTENT → SPEC → PROMPT → GENERATE → REVIEW → ITERATE → SHIP
   ↑                                                      │
   └──────────────────── re-loop su nuova feature ────────┘
```

### Passo 1 — INTENT (definire l'intenzione)

Prima di scrivere un singolo prompt, rispondi a 4 domande:
1. **Chi è l'utente?** Cosa sta cercando di fare e in che contesto?
2. **Quali sono input e output?** Forme dei dati, contratti API.
3. **Quali sono i vincoli?** Stack tecnologico, performance, integrazioni esistenti.
4. **Quali sono gli edge case?** Stati vuoti, errori, livelli di permesso.

> "Una sessione di vibe coding che inizia con un brief vince categoricamente su una che inizia con un prompt freddo."

### Passo 2 — SPEC (specifica)

Anche minimale, anche di una pagina. Il PRD (Product Requirements Document) o uno spec breve serve come **ancora di contesto** per tutte le sessioni.
Una buona spec contiene:
- Funzionalità della feature (cosa deve fare)
- Logica utente (chi può fare cosa)
- Tech stack
- Criteri di successo
- Edge case noti

### Passo 3 — PROMPT (prompting strutturato)

Il prompt non è un oneshot. È una conversazione strutturata. Vedi capitolo 7 per le tecniche.

### Passo 4 — GENERATE (generazione con plan-first)

**Regola d'oro**: prima di generare codice, **chiedi un piano**.

> "Prima di implementare, descrivimi a parole come strutturerai questa funzionalità: file coinvolti, signature delle funzioni, flusso dei dati. Aspetta la mia approvazione prima di scrivere codice."

Questo passo singolo elimina la maggior parte delle riscritture.

### Passo 5 — REVIEW (revisione)

Per ogni accept:
- **Testa subito**: clicca, esegui, prova edge case.
- **Type check + lint** (se in IDE): `pnpm typecheck && pnpm test && pnpm lint`.
- **Diff lettura**: anche se non leggi tutto, scorri.
- **Commit ogni feature funzionante** (vedi capitolo 12).

### Passo 6 — ITERATE (iterazione mirata)

Quando qualcosa non va:
- Sii specifico: *"Il bottone Submit salta in alto. Pinnalo al fondo, transizione smooth."*
- Limita lo scope: *"Modifica SOLO il componente X, non toccare Y."*
- Usa **negative prompting**: *"Usa React Hook Form, NON Formik. Non aggiungere librerie esterne."*

### Passo 7 — SHIP (rilascio)

Questo passo è ciò che separa il prototipo dal prodotto. Vedi capitolo 16.

### Il principio del piccolo passo

> "Resist the urge to shove your whole project into a single prompt."

Esempio di workflow corretto per una To-do app:
1. *"Crea una homepage con header semplice e placeholder per la lista task."*
2. *"Implementa la lista task con sample items in griglia."*
3. *"Aggiungi categorie per raggruppare i task."*
4. *"Mostra un contatore di task completati in cima."*

Esempio di workflow **sbagliato**:
- *"Crea un'app to-do completa con login, dark mode, categorie, condivisione team, push notifications, integrazione Google Calendar."*

Risultato: caos. L'AI fa scelte arbitrarie su tutto, diventa difficile capire dove iniziano i problemi.

---

## 7. PROMPT ENGINEERING

### I 4 elementi di un prompt efficace per il vibe coding

Ogni prompt produttivo (specialmente per app builders come Lovable, Bolt, Base44) contiene:

1. **Identità** — Cosa stai costruendo? *"Un dashboard analitico"*, *"Un mini-game arcade"*.
2. **Pubblico** — Per chi è? *"Bambini di 5 anni" → bottoni grandi, colori vivi*; *"Trader" → densità dati, velocità*.
3. **Funzionalità** — Cosa fa? Azioni specifiche, non vaghe.
4. **Aesthetic / vibe** — Come deve sembrare e far sentire? *"Cyberpunk", "minimal pastel", "neon street art"*.

Saltare l'estetica = stili default noiosi. Saltare le funzionalità = bel quadro che non funziona.

### Prompt vago vs prompt specifico

❌ **Vago**: *"Build me a CRM for real estate agents."*
Risultato: l'AI indovina lo schema database, l'auth, il design. Probabilmente sbagliato.

✅ **Specifico**: *"Build a CRM for real estate agents. Users: agents (can manage their leads) and managers (can see all leads). Lead has: name, phone, email, status (new/contacted/showing/closed/lost), assigned agent, notes, source. Stack: Next.js + Supabase + Tailwind. Auth: Supabase magic link. Show leads in a kanban by status."*

### Le 8 tecniche di prompting

#### 1. Persona-Problem-Context
> *"Act as a senior Angular developer. Refactor this service to improve separation of concerns and make it easier to test."*

Assegnare un ruolo guida l'AI verso pattern professionali (interfacce, dependency injection, test stub).

#### 2. Constraint anchoring
Definire vincoli espliciti sopra il prompt:
- Tech stack
- Convenzioni (kebab-case, file structure)
- Limiti (max 4 chiamate API, niente librerie a pagamento)
- Cose da NON fare

#### 3. Negative prompting
Caso studio AIM Consulting: dire esplicitamente cosa NON fare riduce gli output incompatibili del **62%**.
> *"Use only React Hook Form; do not use Formik."*
> *"Do not modify the homepage; focus only on the dashboard."*

#### 4. Comparative prompting
> *"Show me 3 different approaches to implement this feature. For each, explain the tradeoffs in maintainability, performance and complexity."*

Utile quando ci sono più soluzioni viabili e devi sceglierne una.

#### 5. Layered / chained prompting
Per feature complesse:
- Layer 1: Schema dati e signature delle funzioni (no implementation)
- Layer 2: *"Spiegami il tuo approccio prima di scrivere codice"*
- Layer 3: Implementazione di un singolo pezzo
- Layer 4: Espansione

#### 6. Context layering
Pre-carica nel prompt:
- Note architetturali
- Commit recenti
- Contratti API
- User stories

In Cursor: usa `@file`, `@docs`, `@Web` per riferire contesto specifico.

#### 7. Self-reflection / audit
Dopo l'output:
> *"Now review this code for any security vulnerabilities or mistakes and fix them."*

Lo studio Databricks 2025 ha mostrato che la **self-reflection è la strategia più efficace** per ridurre il codice insicuro generato da Claude.

#### 8. Reverse meta-prompting
Tecnica di Lovable: dopo aver risolto un problema, chiedi all'AI di:
> *"Riassumi cosa abbiamo fatto e generami un prompt riutilizzabile per fare la stessa cosa in altri progetti."*

Costruisce nel tempo una libreria di prompt collaudati.

### Esempio di prompt strutturato (template)

```markdown
## Context
I'm creating a minimal todo app with a lo-fi, calm aesthetic that helps users focus.

## Objective
Generate a todo list component supporting: add, complete, filter by status, persist to localStorage.

## Vibe direction
Warm, slightly imperfect, intentionally simple — like a paper notebook.
Interactions gentle, no notifications, no bright colors.

## Technical parameters
- Vanilla JS, HTML, CSS (no frameworks)
- Works on mobile and desktop
- Lightweight and fast

## Visual reference
Paper-like background, muted earthy palette, handwriting-inspired font.

## Constraints
- No external dependencies
- No analytics, no tracking
- Avoid sharp transitions
```

### Il prompt come "creative brief"

Pensa al prompt come a un **brief per un designer junior**, non come a una specifica tecnica. Includi:
- Tono ed emozione desiderati
- Contesto culturale
- Riferimenti visivi se possibile
- Cosa rendere "imperfettamente umano" vs "macchina-perfetto"

---

## 8. CONTEXT ENGINEERING

> "Context engineering is the new vibe coding. It's 10x better than prompt engineering and 100x better than vibe coding."

### Cos'è il context engineering

Mentre il **prompt engineering** è l'arte di scrivere il singolo prompt giusto, il **context engineering** è l'arte di **strutturare l'ambiente** così che l'AI **non possa fallire**.

Definizione di Tobi Lutke (CEO Shopify):
> *"L'arte di fornire tutto il contesto perché il task sia plausibilmente risolvibile dal LLM."*

### Cosa include il context engineering

1. **File di regole persistenti** (CLAUDE.md, AGENTS.md, .cursorrules) — capitolo 9.
2. **Spec / PRD / planning files** — capitolo 10.
3. **Examples folder** — codice esemplare che l'AI deve seguire.
4. **Memoria viva** — un file che cattura le decisioni progettuali fatte.
5. **MCP server** — connessioni a fonti dati esterne — capitolo 11.
6. **RAG (Retrieval-Augmented Generation)** — recupero dinamico di contesto.

### Il problema del "context decay"

Durante una sessione lunga, il context window dell'AI si riempie di:
- Output precedenti
- Errori risolti
- Sperimentazioni scartate

Più si riempie, più l'AI **dimentica** le decisioni iniziali e diventa inconsistente.

### Soluzioni

| Problema | Soluzione |
|---|---|
| Sessione lunga, AI inconsistente | `/clear` o `/compact` (Claude Code), nuova chat con re-loading del context file |
| Decisioni dimenticate tra sessioni | File di context vivente (`PROJECT.md`, `DECISIONS.md`) |
| L'AI usa pattern diversi ogni volta | Examples folder + rules file ben scritto |
| L'AI inventa API che non esistono | Linka docs ufficiali nel rules file, o usa MCP per docs live |

### Pattern "Scout and Execute"

Pattern emerso nel 2026 per progetti complessi:

1. **Scout agent**: il suo unico job è esplorare la codebase e produrre un brief di alto livello (file rilevanti, pattern presenti, dipendenze).
2. **Execute agent**: riceve il brief dello Scout e implementa la feature.

Lo Scout non scrive una riga di codice. L'Execute non perde tempo a esplorare. Risultato: meno errori, output più allineato.

---

## 9. I FILE DI REGOLE

Ogni grande tool ha il suo formato per **dare istruzioni persistenti** all'AI.

| Tool | Filename |
|---|---|
| Claude Code | `CLAUDE.md` |
| Codex CLI | `AGENTS.md` |
| Gemini CLI | `GEMINI.md` |
| Cursor | `.cursorrules` o `.cursor/rules/*.mdc` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Windsurf | `.windsurfrules` |
| JetBrains Junie | `.junie/guidelines.md` |
| Standard aperto | `AGENTS.md` |

### Lo standard emergente: AGENTS.md

A fine 2025 è emerso `AGENTS.md` come **standard de facto**, supportato da OpenCode, Zed, Cursor, Codex e altri. Best practice 2026: tenere un solo file canonico (`AGENTS.md`) e creare symlink agli altri formati.

```bash
# Da Claude Code: 
mv CLAUDE.md AGENTS.md && ln -s AGENTS.md CLAUDE.md

# Da Cursor:
mv .cursorrules AGENTS.md && ln -s AGENTS.md .cursorrules
```

### Cosa mettere in un file di regole

**Sì:**
- **Tech stack** (versioni precise: "Next.js 15", non "Next.js")
- **Convenzioni di stile** (kebab-case, type hints obbligatori)
- **Comandi build/test** (così l'AI non tira a indovinare)
- **Architettura ad alto livello** (dove vivono i model, le route, i servizi)
- **Behavioral guardrails** (es. *"Mai eseguire query distruttive senza conferma"*)
- **Pattern da preferire / evitare**

**No:**
- Documentazione completa delle API (linkala invece)
- Istruzioni che il linter già impone (Prettier fa il suo lavoro)
- Contesto della singola task (va nel prompt, non nel file persistente)
- Più di 50 righe (oltre, l'AI ne ignora gran parte)

### La regola delle 50 righe

Ricerca interna di Anthropic (2025): i modelli frontier riescono a seguire ~150-200 istruzioni con consistenza. **Modelli più piccoli, molto meno**. Un file di 200+ righe è quasi peggio di nessun file: l'AI non riesce a prioritizzare.

Best practice: file di rules **<50 righe**, scritte a mano, ognuna giustificata da un problema reale incontrato.

### Esempio di CLAUDE.md ben scritto (TypeScript/Next.js)

```markdown
# Project: Acme Dashboard
Next.js 15 (App Router) + Supabase + Tailwind + shadcn/ui

## Conventions
- TypeScript strict mode, no `any`
- Server Components by default, Client Components only when needed
- Database access via Supabase client in `/lib/db.ts`
- Forms: React Hook Form + Zod schemas

## Commands
- `pnpm dev` — dev server
- `pnpm typecheck && pnpm test && pnpm lint` — required before commit

## Architecture
- `/app` — routes (App Router)
- `/components` — reusable UI
- `/lib` — utilities, db, validators
- `/types` — shared TypeScript types

## Guardrails
- Never run destructive DB operations without confirmation
- Never commit `.env` files
- Always validate user input with Zod before DB writes
```

### Anti-pattern: il file gonfio

L'errore più comune: trattare il file di rules come se fosse documentazione completa del progetto. Risultato: file da 500+ righe che vengono **silenziosamente troncati** (Codex CLI lo fa esplicitamente con `project_doc_max_bytes`).

---

## 10. SPEC-DRIVEN DEVELOPMENT

### Il problema che risolve

Quando i coding agent diventano troppo veloci, il collo di bottiglia diventa **definire cosa costruire**. Spec-driven development (SDD) è la risposta del settore.

### Cos'è

Invece di iniziare con il codice e scrivere docs dopo, **inizi con una specifica strutturata**. La spec diventa la **fonte di verità condivisa** tra te, l'AI e il team.

### Pattern Research-Plan-Implement (RPI)

Workflow in 3 fasi che ha sostituito il "prompt-and-pray":

1. **RESEARCH**: l'AI esplora la codebase, individua pattern, fa emergere assunzioni.
2. **PLAN**: l'AI propone un piano step-by-step. Tu lo rivedi e approvi.
3. **IMPLEMENT**: solo dopo l'approvazione del piano, l'AI scrive codice.

### Strumenti SDD

- **GitHub Spec Kit** (open source) — `/specify`, `/plan`, `/implement` come slash command.
- **Kiro IDE** (AWS, 2026) — IDE nativo spec-driven.
- **OpenSpec** — genera proposal.md, what.md, why.md per ogni feature.
- **PRP (Product Requirements Prompt)** — pattern Cole Medin: INITIAL.md → PRP elaborato → execute.

### Risultati documentati (caso AWS/Amazon, 2026)

- Team Kiro IDE: feature build da **2 settimane a 2 giorni**.
- Team AWS: rearchitecture da 30 dev/18 mesi → **6 dev/76 giorni**.
- Amazon "Add to Delivery": shippato **2 mesi prima** della scadenza.

### Esempio di workflow Spec-Driven

```
1. INITIAL.md (tu scrivi)
   ## FEATURE
   Multi-agent research agent that summarizes papers
   
   ## EXAMPLES TO FOLLOW
   @examples/auth-pattern.js
   @examples/testing-pattern.test.js
   
   ## VALIDATION
   - [ ] Feature works as specified
   - [ ] Tests pass
   - [ ] No linting errors

2. /generate-prp INITIAL.md (Claude Code genera spec dettagliata)

3. /execute-prp PRPs/research-agent.md (Claude Code implementa il piano)
```

### Tre vantaggi della SDD

1. **Riduce overhead cognitivo** — non devi tracciare ogni decisione dell'agente.
2. **Elimina context decay** — la spec persiste tra sessioni e tra agenti diversi.
3. **Migliora intent fidelity** — costringe a definire successo PRIMA della generazione.

### Quando NON usare SDD

- Esperimenti creativi.
- Esplorazioni senza obiettivo definito.
- Personal scripts a uso unico.

In questi casi il vibe coding puro è più appropriato.

---

## 11. MCP (MODEL CONTEXT PROTOCOL)

### Cos'è MCP

**MCP (Model Context Protocol)** è uno standard aperto introdotto da Anthropic alla fine del 2024 che permette agli agenti AI di **comunicare con strumenti e fonti dati esterne**.

Analogia: MCP sta agli agenti come HTTP sta ai browser. È il protocollo comune.

### Perché è una svolta

Prima di MCP: ogni tool aveva la sua API custom per integrare l'AI. Risultato: silos, ogni integrazione da rifare.

Dopo MCP: scrivi un MCP server una volta, lo usi da Claude Code, Cursor, Windsurf, Gemini CLI, ecc.

### Cosa puoi fare con MCP

- Connettere l'AI a un **database** (Postgres, Supabase, MongoDB).
- Dare all'AI accesso a **GitHub Issues / PR / repositories**.
- **Lettura di Jira / Linear** per task tracking.
- **Slack / Discord / email** per comunicazione.
- **File system locale**.
- **Search engine** (Google, Brave Search).
- **Browser automation** (Playwright via MCP).
- **Documentazione live** (es. Context7).

### Esempio: GitHub MCP server in Claude Code

Una volta configurato, Claude Code può:
- Leggere issue aperti del tuo repo
- Vedere PR e diff
- Suggerire fix basati sul codice reale, non su guess
- Aprire PR direttamente

### Il GitHub MCP Registry

Lanciato a settembre 2025, è il "marketplace" centrale per scoprire MCP server. Cerca per categoria, valuta, installa.

### Setup base in Claude Code

```bash
# Aggiungi un MCP server al config
claude mcp add github

# Verifica
claude mcp list
```

In Cursor / Windsurf, configurazione tramite settings JSON.

### Concetto avanzato: Skills

Sia Claude Code che Gemini CLI supportano **Skills** — file `SKILL.md` in `.agent/skills/` o `.claude/skills/` che insegnano workflow specifici all'agente:
- "Database migration skill"
- "Security review skill"
- "Release checklist skill"

Le skill sono **prompt riutilizzabili** caricabili on-demand. Riducono il bloat del file rules principale.

---

## 12. VERSION CONTROL

### Perché il Git è non-negoziabile

> "If you're vibe coding without Git, you're working without a safety net while juggling chainsaws."

Il vibe coding amplifica il rischio Git in due modi:
1. L'AI può fare modifiche **massicce in secondi** — perdi una versione funzionante in un attimo.
2. Spesso **non capisci pienamente** cosa è cambiato — Git è il tuo testimone oggettivo.

### Il workflow Trunk-based per vibe coder

Più semplice di Git Flow, perfetto per vibe coding:
1. `main` contiene sempre il lavoro stabile.
2. Per ogni nuova feature: branch corto da `main`.
3. Dopo aver completato e testato: merge in `main`.
4. Branch corti, merge frequenti (ideale: più volte al giorno).

```bash
git checkout -b feature/user-auth
# ...vibe coding session...
git add .
git commit -m "feat: add login form with Supabase magic link"
git checkout main
git merge feature/user-auth
git push
```

### La regola: commit ogni feature funzionante

> "Commit your code every time you complete a distinct feature."

Ogni commit è un "save point". Se l'AI rompe qualcosa al prompt successivo:
```bash
git stash       # salva lavoro corrente
git checkout HEAD~1   # torna al commit precedente
```

### Convenzione: messaggi di commit semantici

Standard Conventional Commits, validi anche per vibe coding:
- `feat:` nuova feature
- `fix:` bug fix
- `refactor:` cambio struttura senza nuove feature
- `docs:` solo documentazione
- `test:` aggiunta test
- `chore:` task ripetitivi (deps update, lint config)

### .gitignore per vibe coder

```gitignore
# Sempre
node_modules/
.env
.env.local
.env.*.local
*.log
.DS_Store
dist/
build/
.next/
.vercel/
.turbo/

# AI tooling locale (opzionale, scelta team)
.cursor/
.claude/cache/
```

**Mai** committare `.env` con credenziali. Mai committare API key. Sempre usare environment variables.

### Pattern "auto-commit con AI"

Si può istruire Cursor o Claude Code (via rules file) a fare commit incrementali:

```markdown
# Cursor rules
- For new features, automatically create a branch named `feature/<name>`
- Commit incrementally with semantic messages
- Push to GitHub and create a PR via `gh pr create` when done
- Mark PR as: "This PR was generated automatically by Cursor"
```

### Branch + esperimenti

Ogni esperimento "rischioso" merita un branch:
- Refactor grande → `refactor/auth-system`
- Migrazione DB → `migration/add-user-roles`
- Sperimentazione UI → `experiment/dark-mode-v2`

Se va male: `git checkout main` e nulla di rotto.

---

## 13. TESTING, REVIEW E DEBUGGING

### La regola d'oro per la review

Simon Willison:
> "I won't commit any code to my repository if I couldn't explain exactly what it does to somebody else."

Anche se non scrivi tu il codice, devi essere capace di **spiegarlo a un altro**. Se non lo capisci, non è pronto per il commit.

### Testing nel vibe coding

L'AI è **bravissima a generare codice apparentemente corretto** che fallisce in edge case. Per questo:

1. **Edge case manuali**: prima di accettare, prova:
   - Input vuoto, null, stringa molto lunga
   - Numeri negativi dove ci si aspetta positivi
   - Network throttling (DevTools → Slow 3G)
   - Stati auth (loggato/non loggato/permessi insufficienti)

2. **Test automatici**: chiedi all'AI di generarli:
   > "Write unit tests for this function that cover the happy path, empty input, null input, and the boundary conditions."

3. **TDD con AI**:
   - Scrivi/fai scrivere i **test prima**.
   - L'AI implementa fino a far passare i test.
   - Approccio raccomandato da Kent Beck per "augmented coding".

### Debugging efficace

#### Pattern 1: il messaggio di errore completo
- Incolla il **full stack trace**, non un riassunto.
- Aggiungi: comportamento atteso vs comportamento osservato.
- Punta i file rilevanti.

```
I see this error when clicking "Save" on settings page:
[full error stack trace]

Expected: clicking Save updates user profile in Supabase users table 
and shows success toast.

Actual: page crashes with error above.

Relevant files: src/pages/settings.tsx, src/lib/supabase.ts
```

#### Pattern 2: la regola dei 3 tentativi
> "If the AI can't fix it in 2-3 attempts, reset to the last working commit and try a different approach."

Dopo 3 tentativi falliti:
- L'AI sta probabilmente compounding errori.
- Torna all'ultimo stato funzionante.
- Riformula il problema da zero.

#### Pattern 3: spiega prima di fixare
Invece di chiedere subito un fix:
> "Explain this error in plain language. What's the root cause? Then suggest 2-3 different fixes with tradeoffs."

Capire la causa evita patch superficiali.

### Il "complexity ceiling"

A un certo punto in progetti grandi, l'AI inizia a **creare più problemi di quanti ne risolva**. Segno: il context window non riesce a contenere abbastanza codice rilevante per fare modifiche sicure.

Soluzioni:
- Spezza il problema in pezzi più piccoli e specifici.
- Usa strumenti con context window più grande (Claude Code: 1M token).
- Refactora la codebase in moduli più piccoli e isolabili.
- A volte: scrivi il codice manualmente per quel pezzo specifico.

### Code review con AI

Pattern emergente: usare l'AI come **secondo paio di occhi**.

Dopo aver scritto/generato codice:
> "Review this code as if you were a senior engineer doing a PR review. Find issues with: security, performance, maintainability, edge cases, naming. Be specific."

Tool dedicati: **CodeRabbit** (PR review automatica), **Cursor BugBot**, **Greptile**.

### Il pattern self-reflection

Studio Databricks 2025: il prompt più efficace per ridurre vulnerabilità è il **doppio passaggio**:

1. Prima passata: *"Write the function."*
2. Seconda passata: *"Now review this code for security vulnerabilities and fix them."*

Questo pattern riduce significativamente il codice insicuro generato.

---

## 14. SICUREZZA

### La realtà della sicurezza nel vibe coding

Dati 2025-2026:
- **45% del codice AI-generated** ha falle di sicurezza (studi multipli).
- **58% delle vibe-coded app** testate aveva credenziali hardcoded.
- Caso Lovable maggio 2025: **170 su 1645 app** create avevano vulnerabilità che esponevano dati personali.
- Benchmark **SusVibes** dicembre 2025: solo il **10,5% delle soluzioni** generate da SWE-Agent + Claude 4 Sonnet erano sicure (anche se il 61% era funzionalmente corretto).

### Le 7 vulnerabilità più comuni nel codice AI-generated

1. **Hardcoded credentials** — API key, password DB, token nel codice anziché in env vars.
2. **Missing authorization checks** — l'app verifica che l'utente sia loggato, ma non che possa accedere alla risorsa specifica.
3. **SQL injection** — query con string concatenation invece di parametri preparati.
4. **XSS (Cross-Site Scripting)** — input utente renderizzato senza encoding.
5. **Esposizione dati interni** — endpoint API che ritornano più campi del necessario.
6. **Validation insufficiente** — input non validato prima di toccare il DB.
7. **Memory corruption** (linguaggi C/C++/FFI) — buffer overflow, use-after-free.

### Strategie di mitigazione

#### Strategia 1: prompt esplicitamente security-aware
❌ *"Write a file upload function."*
✅ *"Write a secure file upload function that validates file type and size, prevents path traversal, and stores uploads outside the public directory."*

#### Strategia 2: secondo passaggio di review
> *"Now review this code for security vulnerabilities. Check for: hardcoded secrets, missing authorization, SQL injection, XSS, input validation, and proper error handling. Fix any issues found."*

#### Strategia 3: ambiente sicuro by default
- Usa boilerplate consolidati (auth, payments) invece di farti generare auth da zero.
- Database con Row Level Security (Supabase, Postgres RLS) — la sicurezza è nel DB, non nel codice applicativo.
- Environment variables in `.env`, mai nel codice.

#### Strategia 4: tooling di security
- **SAST (Static Analysis)**: Semgrep, Snyk, ZeroPath, Checkmarx — integrato in CI/CD.
- **Dependency scanning**: per librerie vulnerabili che l'AI potrebbe importare.
- **Secret scanning**: GitHub secret scanning per evitare commit accidentali.

#### Strategia 5: rules file con security guardrails

```markdown
## Security guardrails (in CLAUDE.md)
- All user input must be validated with Zod before DB writes
- Never store passwords, API keys, or tokens in code
- Always use parameterized queries; never string concatenation in SQL
- Authorization checks for every protected resource (not just authentication)
- Default to least-privilege for permissions
```

### Il principio: trust ma verify

> "Treat AI-generated code as untrusted by default. Apply the same scrutiny you'd apply to a contractor's first PR."

Specialmente per:
- Authentication flow
- Payment integration
- Personal data handling
- File upload
- Anything that touches money or PII

### Aspetti legali/normativi

In Europa: GDPR. Negli US: HIPAA (sanità), SOC 2. Il vibe coding **non ti esonera** dalle conformità. Una vibe-coded app che gestisce dati sanitari senza encryption a riposo viola la legge esattamente come una hand-coded.

### Shadow IT: il rischio enterprise

Le piattaforme di vibe coding permettono a non-tech di creare app con dati aziendali sensibili **fuori dalla governance IT**. Risultato: superficie d'attacco enorme e invisibile. Le aziende devono definire policy chiare su:
- Quali tool sono approvati
- Quali dati possono toccare
- Chi rivede prima del deploy

---

## 15. ERRORI COMUNI

### I 10 errori più letali del vibe coder principiante

#### 1. Trattare l'AI come Google
"Build me a CRM" → ottieni una schermata generica con dati finti.
**Fix**: scrivi un brief breve (4 domande del capitolo 6) prima di promptare.

#### 2. Tutto in un prompt gigante
"Build me an e-commerce with login, cart, payments, admin, analytics, mobile app."
**Fix**: feature per feature, in piccoli passi.

#### 3. Accept-all senza testare
La pagina compila → "fatto!" → poi l'utente clicca Save e nulla succede.
**Fix**: testa subito ogni cambio. Edge cases. DevTools throttling.

#### 4. Niente Git
La sessione di vibe coding rompe tutto, niente backup.
**Fix**: `git init` PRIMA di promptare. Commit ogni feature funzionante.

#### 5. Il "Prompt Loop"
Chiedi di centrare un div. L'AI fallisce. Riformuli. Aggiunge `!important`. Riformuli. Riscrive con un'altra libreria. Caos.
**Fix**: dopo 3 tentativi, reset al commit precedente e cambia approccio.

#### 6. Ignorare gli edge case
L'AI ottimizza per il happy path. L'utente reale inserisce "" o lascia il form vuoto → crash.
**Fix**: testa attivamente input vuoti, negativi, lunghi, internazionali.

#### 7. Dependency bloat
L'AI suggerisce 5 librerie per fare quello che bastano 3 righe di codice nativo.
**Fix**: negative prompting esplicito, audit periodico delle dipendenze.

#### 8. Ignorare la sicurezza
"Funziona in dev" → in produzione è un colabrodo.
**Fix**: capitolo 14. Sempre.

#### 9. Skill atrophy
Diventi dipendente dall'AI, non capisci più nemmeno il tuo codice.
**Fix**: 20% del tempo coding **senza AI**. Settimanali "no-AI day". Studia il codice generato — chiedi all'AI di spiegarti pezzi che non capisci.

#### 10. Costi esplosivi
Token-based pricing + agenti che girano in loop = bollette inattese.
**Fix**: monitora spending, usa modelli più economici per task semplici, definisci budget mensili.

### L'antipattern del "config file gonfio"

Trasformare CLAUDE.md / .cursorrules in documentazione totale.
Risultato: 200 righe → l'AI ne ignora la metà → output peggiore di averne nessuno.

**Fix**: <50 righe, ogni riga giustificata.

### L'antipattern del "context decay ignored"

Sessione di 4 ore senza `/clear`. L'AI inizia a contraddire decisioni iniziali.
**Fix**: termina sessioni a feature finita. Riapri con context fresco + rules file.

### L'antipattern del "stack che l'AI non conosce"

Scegliere un framework di nicchia o legacy → l'AI inventa API che non esistono.
**Fix**: scegli stack popolari con tanta documentazione (React/Next.js/Tailwind, Python/Django/FastAPI, Node/Express). L'AI è bravissima dove i dati di training abbondano.

### L'antipattern del "deploy diretto in production"

Committi su `main`, deploy automatico, app live → utenti reali colpiti dal bug.
**Fix**: branch staging, PR review (anche solo da te), CI con test automatici.

### Tabella riassuntiva: 4 errori killer

| Errore | Fix |
|---|---|
| Iniziare senza piano | Brief 4-domande prima di promptare |
| Accept senza review | Test ogni accept, lint+typecheck dopo ogni feature |
| Skip Git | `git init` first, commit per feature |
| Ignorare sicurezza | Prompt security-aware, doppio passaggio review |

---

## 16. DEPLOYMENT

### Dal "funziona sul mio Cursor" al "funziona per gli utenti"

Il deployment è dove molti progetti vibe-coded falliscono. Ecco lo stack standard 2026.

### Architettura tipica frontend + backend

```
┌─────────────────┐
│  Browser (utente)│
└────────┬────────┘
         │
┌────────▼────────┐
│  Vercel/Netlify │  ← hosting frontend statico/edge
│  (CDN globale)  │
└────────┬────────┘
         │
┌────────▼────────┐
│ Supabase / Neon │  ← DB + auth + storage
│ (managed Postgres)│
└─────────────────┘
```

### Hosting frontend

| Piattaforma | Migliore per | Free tier |
|---|---|---|
| **Vercel** | Next.js, edge functions | 100GB bandwidth/mo |
| **Netlify** | Static site, JAMstack | 300 build min/mo |
| **Cloudflare Pages** | Edge globale, low latency | 500 build/mo |
| **GitHub Pages** | Static site puro | Illimitato per repo pubblici |
| **Render** | Full-stack, container | Sleep dopo inattività |
| **Railway** | Full-stack, semplice | $5/mo dopo trial |

### Backend / database managed

| Servizio | Specialità |
|---|---|
| **Supabase** | Postgres + auth + storage + realtime + RLS |
| **Neon** | Postgres serverless con branching |
| **PlanetScale** | MySQL serverless |
| **Firebase** | NoSQL + auth + functions (Google) |
| **MongoDB Atlas** | NoSQL document DB |
| **Cloudflare D1** | SQLite serverless edge |

### Workflow standard di deployment

1. **Push su GitHub** (capitolo 12).
2. **Connetti repo a Vercel/Netlify** — auto-detection del framework.
3. **Environment variables** — copia da `.env.local` al dashboard piattaforma.
4. **Custom domain** — opzionale, costa $10-15/anno.
5. **Deploy automatico** — ogni push su `main` deploya.

### Le environment variables: la regola d'oro

❌ MAI nel codice:
```js
const apiKey = "sk-1234567890abcdef"
```

✅ Sempre:
```js
const apiKey = process.env.API_KEY
```

✅ Per variabili client-side (Next.js):
```js
const publicKey = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY
```

### Vibe deploying

Concetto emerso nel 2026 (Google Cloud, Firebase Studio): un solo prompt o click che porta l'app **da idea a produzione live**. Strumenti:
- **Replit Agent**: codice + DB + hosting in un click.
- **Lovable + GitHub + Vercel**: pipeline integrata.
- **Firebase Studio**: stack Google integrato.
- **Bolt.new**: deploy in browser, senza setup.

### Monitoring di base post-deploy

- **Errori in runtime**: Sentry (free tier generoso).
- **Analytics**: Plausible, Vercel Analytics, PostHog.
- **Performance**: Lighthouse CI, Vercel Speed Insights.
- **Uptime**: UptimeRobot (free).

### Quando upgradare dal free tier

Segnali:
- Build minutes esauriti spesso (Netlify 300 min/mo).
- Bandwidth overage frequente.
- Function execution oltre quota.
- Real users (non solo test) iniziano ad arrivare.

Rule of thumb: prima di pagare, fai growth solido (50-100 utenti attivi). Free tier basta per validare.

---

## 17. VIBE CODING PER PROFILI DIVERSI

### Per il founder non tecnico

**Cosa gli serve**:
- Validare idee velocemente.
- Mostrare demo a investor/clienti.
- Costruire MVP per test di mercato.

**Tool consigliati**: Lovable (Pro $25/mo), Base44, Bolt.new.

**Mindset**: tratta gli MVP come **"concept car"**, non vetture di produzione. Servono per imparare, non per scalare.

**Skill da sviluppare**:
- Scrivere PRD chiari.
- Fare user testing veloce.
- Capire quando passare a sviluppatore vero.

**Trappola**: "Non ho bisogno di developer". Falso. Hai bisogno di developer **per scalare**, non per validare.

### Per il product manager

**Cosa gli serve**:
- Prototipare assunzioni in ore invece che settimane.
- Comunicare con engineer mostrando cose, non spiegandole.
- Ridurre il rischio di ingegnerizzare le cose sbagliate.

**Tool consigliati**: Cursor (per imparare un po' di codice), Lovable, v0 (per UI mockup interattivi).

**Skill da sviluppare**:
- Prompt engineering per UI.
- Capire l'80% degli edge case durante prototipazione.
- Prioritizzazione data-driven supportata da prototipi.

**Approccio**: usa il vibe coding per **ridurre il costo della curiosità**, non per evitare engineering.

### Per il designer

**Cosa gli serve**:
- Materializzare design in interfacce reali.
- Iterare con designer e dev senza dipendenza forte.
- Portfolio interattivo di alta qualità.

**Tool consigliati**: v0 (componenti React da prompt o Figma), Lovable (UI-first), Cursor (per refine).

**Skill da sviluppare**:
- Tailwind CSS (il "linguaggio nativo" di v0 e Lovable).
- Component thinking (vs page thinking).
- Sistemi di design coerenti.

**Vantaggio**: i designer che vibe-coderanno bene saranno richiestissimi nel 2026-2027.

### Per lo sviluppatore junior

**Cosa gli serve**:
- Velocizzare task ripetitive (boilerplate, scaffolding).
- Imparare pattern professionali leggendo codice generato.
- Costruire portfolio impressionante.

**Tool consigliati**: Cursor (perfetto per imparare), Claude Code per task complessi.

**Skill da sviluppare**:
- Code reading critico.
- Capire QUANDO accettare e QUANDO no.
- Fondamentali (data structures, algoritmi, system design) — l'AI non sostituisce questi.

**Trappola**: skill atrophy. Soluzione: 20% no-AI coding, settimanali "no-AI day".

### Per lo sviluppatore senior

**Cosa gli serve**:
- 3-10x leverage su task ripetitivi.
- Esplorare nuovi linguaggi/framework velocemente.
- Run multiple agents in parallelo.

**Tool consigliati**: Claude Code + Cursor + GitHub Copilot in combinazione.

**Skill da sviluppare**:
- Prompt engineering avanzato.
- Context engineering.
- Spec-driven development.
- "Strange management" di agenti.

**Vantaggio**: chi padroneggia vibe engineering ora avrà 5-10 anni di vantaggio nei prossimi anni. La curva d'apprendimento è alta ma il payoff enorme.

### Per il dev solo / indie hacker

**Cosa gli serve**:
- Spedire prodotti più veloce della concorrenza.
- Mantenere costi bassi.
- Iterare in giorni, non mesi.

**Tool consigliati**: Cursor + Supabase + Vercel come stack base. Claude Code per task pesanti.

**Skill da sviluppare**:
- End-to-end product thinking.
- Marketing + tech in parallelo.
- Saper dire NO a feature.

**Stat reale 2026**: indie hacker producono **140.000 righe di codice in 15 giorni** — lavoro che prima richiedeva un team intero.

---

## 18. PROGETTI PRATICI

Idee progressive per esercitarsi, dal beginner al pro.

### Livello 1 — Primi passi (1-2 ore ciascuno)

1. **Personal task manager** — add, complete, delete, persist localStorage.
2. **Calculator** — basic + cronologia operazioni.
3. **Pomodoro timer** — 25/5 con notifiche e stats.
4. **Markdown previewer** — split-pane editor + render.
5. **Random quote generator** — fetch da API + share su social.
6. **Color palette generator** — HSL/HEX + esporta come CSS vars.

### Livello 2 — Beginner (mezzo weekend)

7. **Personal expense tracker** — categorie, grafici (Chart.js), export CSV.
8. **Recipe book** — CRUD con upload immagini, filtro per ingrediente.
9. **Habit tracker** — streak, calendario, gamification.
10. **Personal blog** — Next.js + MDX, RSS feed, dark mode.
11. **Link-in-bio** — page personalizzata per creator.
12. **Quiz app** — domande JSON, score, condivisione risultato.

### Livello 3 — Intermedio (weekend)

13. **Newsletter signup landing** — Mailchimp/ConvertKit integration, email confirm.
14. **Booking system** — calendario, slot, conferma email.
15. **Real-time chat** — Supabase Realtime, multiple room.
16. **Image gallery** — upload, lazy load, infinite scroll.
17. **URL shortener** — slug custom, analytics click.
18. **Polling app** — crea poll, vota, vedi risultati live.

### Livello 4 — Avanzato (1-2 settimane)

19. **SaaS landing + auth + dashboard** — Stripe trial, account, billing.
20. **Mini Notion clone** — block-based editor, drag-drop.
21. **Job board** — listings, search, alert email.
22. **AI-powered note app** — semantic search, auto-summarize, tag suggestion.
23. **Multiplayer game (FPS o board)** — WebRTC o Socket.io.
24. **Analytics dashboard** — multi-source data, custom queries.

### Livello 5 — Pro (mese+)

25. **Full SaaS con team accounts** — RBAC, billing per seat, audit log.
26. **Multi-tenant platform** — schema-per-tenant, custom domains.
27. **AI agent marketplace** — agenti pubblicabili, MCP servers.
28. **CRM con pipelines custom** — automazioni, integrazioni Slack/Email.
29. **Replica funzionale di un prodotto noto** — Linear-like, Cal.com-like, Notion-like.
30. **AI co-pilot per un dominio specifico** (legale, medicale, financial).

### Tipologie di progetto particolarmente educative

- **"Software for one"** — un'app che usi solo tu, iperpersonalizzata.
- **Internal tool** — automazione di un processo aziendale ripetitivo.
- **Replica di un'app esistente** — costringe a system design.
- **Game** — costringe a logica complessa e UX immediata.

### Esempio: prompt iniziale per un progetto Livello 2

```
Build a personal expense tracker as a single-page web app.

Stack: vanilla HTML + JS + Tailwind via CDN. No build step. 
Persistence: localStorage. No backend.

Features:
- Add expense: amount (number), category (dropdown: food, transport, 
  shopping, bills, other), description (text), date (defaults to today).
- List expenses: most recent first, with delete button.
- Filter by category and date range.
- Stats card: total this month, average daily, breakdown by category 
  (small bar chart).
- Export to CSV button.

Design: clean and minimal. Use Tailwind defaults. 
Mobile-first responsive. Dark mode toggle (persists in localStorage).

Edge cases:
- Empty state with friendly message and "Add your first expense" CTA.
- Validation: amount must be positive number, description required.
- Confirm dialog before delete.

Output as a single index.html file with everything inline.
```

---

## 19. IL FUTURO

### Le tre frontiere del 2026-2027

#### 1. Vibe engineering (Simon Willison, ottobre 2025)

> "Per sfruttare davvero questi nuovi strumenti, devi operare al massimo del tuo livello: ricercare approcci, decidere architettura ad alto livello, scrivere specifiche, definire criteri di successo, progettare loop agentici, pianificare QA, gestire un esercito crescente di strani stagisti digitali che bareranno se gliene dai l'opportunità — e passare un sacco di tempo in code review."

Caratteristiche:
- Test automatizzati come prerequisito.
- Più agenti in parallelo, supervisionati.
- Senior engineer che fa "strange management" di workforce digitale.

#### 2. Agentic engineering (febbraio 2026)

Termine che sta sostituendo "vibe engineering" nel discorso comune.
- Agenti che pianificano, decidono, eseguono e si auto-verificano.
- Multi-agent orchestration come pattern standard.
- Tool come Vibe Kanban, Continue Hub per coordinare squad di agenti.

#### 3. Continuous AI

Il paradigma in cui l'AI **opera continuamente** nell'intero ciclo di vita del software:
- Triage automatico di bug Sentry.
- Patching Snyk vulnerabilities.
- Code review automatica su ogni PR (CodeRabbit, BugBot).
- Refactoring continuo in background (background agents Cursor).

L'AI non è più un tool che invochi: è un'infrastruttura che gira.

### Tendenze da seguire

| Trend | Implicazione |
|---|---|
| Context window in crescita (1M+ token) | Refactor di interi progetti in una sessione |
| MCP come standard universale | Tool integration → prima cittadina |
| Agent teams (sub-agent specializzati) | Squad di AI con ruoli distinti |
| Spec-first development | "Programmer" diventa "spec writer" |
| Long-running tasks autonomi | Devin-style: dai un job, torni dopo ore |
| Cross-platform native generation | Web → iOS/Android nativo da un solo codebase |
| Privacy-first local models | Gemma, Llama locale per dati sensibili |
| Verifica formale assistita da AI | Proof obligations generate e verificate da agenti |

### Le 4 abilità più richieste nei prossimi 5 anni

1. **Saper definire successo** — criteri chiari prima del codice.
2. **Saper riconoscere errori plausibili** — l'output che sembra giusto ma è subtilmente sbagliato.
3. **System design** — pensare l'architettura, lasciare l'implementazione all'AI.
4. **"Strange management"** — coordinare agenti come fossero junior dev.

### Cosa NON sostituirà l'AI

- **Product mindset** — sapere cosa costruire, non solo come.
- **Empathy / user research** — capire utenti veri.
- **Strategic decision making** — quando dire NO a una feature.
- **Architectural judgment** — scelte di lungo termine.
- **Ethical reasoning** — bias, privacy, fairness.

> "Il bottleneck non è più 'puoi costruirlo' ma 'sai cosa costruire'."

### La critica seria di lungo termine

Studi 2026 ("Vibe Coding Kills Open Source") sollevano preoccupazioni:
- Riduzione user engagement con maintainer open source.
- Erosione di skill fondamentali in nuovi dev ("comprehension gap").
- Rischio sistemico di codice non capito da nessuno in produzione.
- Tecnical debt invisibile che esploderà tra anni.

Il vibe coding è uno strumento. Come ogni strumento potente, **richiede saggezza per essere usato bene**.

---

## 20. GLOSSARIO

**Agent / Coding agent**: programma AI che esegue task multi-step in autonomia (read files, edit code, run tests, iterate). Esempi: Claude Code, Codex CLI, Devin.

**Agent Mode**: modalità in IDE come Cursor o Windsurf in cui l'AI esegue task multi-file con un singolo prompt.

**Agentic engineering**: pratica disciplinata di costruire software con agenti AI come collaboratori senior (vs vibe coding).

**AGENTS.md**: standard aperto per file di istruzioni persistenti per agenti AI. Equivalente di CLAUDE.md per multi-tool.

**Augmented coding (Kent Beck)**: usare AI per scrivere codice mantenendo i valori di tidy code, test coverage, complessità gestita.

**Cascade (Windsurf)**: feature di Windsurf che permette agenti AI di scrivere, testare, debuggare e refactorare in più file con minima approvazione.

**Chat-Oriented Programming (CHOP)**: termine accademico per programmare via conversazione iterativa con LLM.

**CLAUDE.md**: file in root del progetto che Claude Code legge ogni sessione per istruzioni persistenti.

**Code completion**: livello base di AI assistance — suggerimento riga successiva (es. GitHub Copilot classico).

**Composer (Cursor)**: feature di Cursor per editing multi-file da prompt singolo.

**Constraint anchoring**: tecnica di prompting che definisce vincoli espliciti (stack, no-list, requirement).

**Context decay**: degrado della qualità output durante sessioni lunghe perché il context window si riempie.

**Context engineering**: pratica di strutturare l'ambiente (rules, examples, MCP) perché l'AI non possa fallire.

**Context window**: quantità di token che un modello può "vedere" in una singola richiesta. Claude Opus 4.7: ~200k-1M.

**Continuous AI**: paradigma in cui l'AI gira continuamente nel ciclo di sviluppo, non solo on-demand.

**.cursorrules / .cursor/rules/*.mdc**: file di configurazione di Cursor per istruzioni persistenti.

**Diff**: differenza tra due versioni di un file. "Reading the diffs" = revisionare cosa è cambiato.

**Edge case**: scenario al limite (input vuoto, network lento, valori estremi) che spesso causa bug se non gestito.

**Flow / Cascade Flow (Windsurf)**: meccanismo che mantiene contesto persistente di cosa hai fatto durante una sessione.

**Harness**: il "wrapping" di un modello AI in un sistema (Cursor, Claude Code) — determina molto della qualità output, anche più del modello stesso.

**Layered prompting**: tecnica che spezza una richiesta in livelli progressivi (skeleton → approach → implementation).

**LLM (Large Language Model)**: modello linguistico tipo GPT-5, Claude Opus 4.7, Gemini 3.

**MCP (Model Context Protocol)**: standard aperto per connettere agenti AI a tool esterni (DB, GitHub, Slack, browser).

**MCP server**: implementazione concreta di un servizio accessibile via MCP. Es. github-mcp, postgres-mcp.

**MVP (Minimum Viable Product)**: prodotto minimo per validare un'idea con utenti reali.

**Negative prompting**: tecnica di dire esplicitamente cosa NON fare. Riduce output incompatibili del 62% (case study).

**Plan Mode**: feature in Claude Code (e altri) che fa generare un piano prima del codice, da approvare manualmente.

**PRD (Product Requirements Document)**: documento che definisce cosa va costruito e perché. Anche minimale, è utile.

**Product engineer**: nuovo ruolo emerso nel 2025-2026: ingegnere che pensa più al prodotto che al codice, sfruttando AI per l'implementazione.

**Prompt**: input testuale dato all'AI per generare output.

**Prompt engineering**: arte di scrivere prompt efficaci.

**PRP (Product Requirements Prompt)**: pattern Cole Medin — prompt strutturato che diventa una spec dettagliata.

**Rules file**: file di istruzioni persistenti caricato a ogni sessione (CLAUDE.md, AGENTS.md, ecc.).

**Self-reflection prompting**: tecnica del doppio passaggio — prima genera, poi rivedi/correggi.

**Skill (Anthropic Skills)**: file SKILL.md in `.claude/skills/` che insegnano workflow specifici.

**Spec-Driven Development (SDD)**: pratica di partire da una specifica strutturata prima di generare codice.

**Spec Kit (GitHub)**: toolkit open source per spec-driven development.

**Stack**: combinazione di tecnologie usate in un progetto (es. "Next.js + Supabase + Tailwind + Vercel").

**Sub-agent**: agente AI specializzato in un task (security review, test generation), invocato dall'agente principale.

**Trunk-based workflow**: pattern Git con `main` come trunk e branch corti per feature.

**Vibe**: in vibe coding = il tono, lo stile, l'estetica del software (oltre alla funzionalità).

**Vibe coding**: termine di Karpathy — costruire software descrivendo intent in linguaggio naturale, accettando l'output AI con minima review.

**Vibe deploying**: deploy in produzione con un click/prompt da una piattaforma di vibe coding.

**Vibe engineering (Simon Willison)**: vibe coding fatto bene — con review, test, accountability completa.

**Vibe-coded app**: applicazione costruita in modo prevalente con vibe coding.

---

## APPENDICE A — TIMELINE DEL VIBE CODING

| Data | Evento |
|---|---|
| 2023 | Karpathy: *"The hottest new programming language is English"* |
| Nov 2024 | Anthropic introduce MCP |
| Feb 2 2025 | Karpathy conia "vibe coding" su X |
| Feb 2025 | Claude Code rilasciato |
| Mar 2025 | Merriam-Webster: "vibe coding" come termine di tendenza |
| Mar 2025 | Y Combinator: 25% delle startup W25 con codebase 95% AI |
| Apr 2025 | OpenAI rilascia Codex CLI |
| Mag 2025 | Lovable security incident: 170/1645 app con vulnerabilità |
| Giu 2025 | Gemini CLI rilasciato |
| Lug 2025 | Cognition AI acquisisce Windsurf |
| Set 2025 | GitHub MCP Registry lanciato |
| Ott 7 2025 | Simon Willison: "Vibe engineering" |
| Nov 2025 | Collins Dictionary: vibe coding = Word of the Year 2025 |
| Dic 2025 | SusVibes benchmark: solo 10,5% di app vibe-coded sicure |
| Dic 2025 | CodeRabbit: AI code ha 1,7x più issue gravi |
| Gen 2026 | "Vibe Coding Kills Open Source" (paper accademico) |
| Feb 2026 | Cursor 3.0, Windsurf Wave 13, Claude Opus 4.7 |
| Feb 2026 | "Agentic engineering" sostituisce "vibe engineering" nel discorso |
| Apr 2026 | 41% di tutto il codice globale è AI-generated, 92% dev USA usa AI quotidianamente |

---

## APPENDICE B — RISORSE PER APPROFONDIRE

### Letture fondamentali

- **Andrej Karpathy** — *The Original Tweet* (Feb 2 2025) e Software 2.0 thesis.
- **Simon Willison** — `simonwillison.net/tags/vibe-coding/` (>80 esperimenti documentati).
- **Simon Willison** — *Vibe Engineering* (Oct 7 2025).
- **Kent Beck** — *Augmented Coding* framework, BPlusTree3 project.
- **Tobi Lutke** — Tweet/posts sul context engineering.

### Documentazione ufficiale

- Anthropic — Claude Code Best Practices.
- Google Cloud — *What is Vibe Coding* guide.
- GitHub — Spec Kit + MCP Registry.

### GitHub repository imperdibili

- `coleam00/context-engineering-intro` — pattern PRP.
- `datawhalechina/easy-vibe` — corso open source 2026.
- `cpjet64/vibecoding` — prompt engineering guide.
- `humanlayer.dev` — guide su CLAUDE.md.

### Tool da provare in ordine

1. **Lovable** o **Bolt.new** (per prima esperienza, browser-only).
2. **Cursor** (per IDE familiare, VS Code base).
3. **Claude Code** (per terminale, max potenza).
4. **v0** (per UI generation).
5. **Replit** (all-in-one cloud).

### Comunità

- r/vibecoding (Reddit).
- VibeKode conference.
- Discord di Cursor, Claude, Replit.
- HackerNews thread su vibe coding (sempre attivi).

---

## APPENDICE C — QUICK START CHECKLIST

Per il principiante assoluto che vuole partire **oggi**:

- [ ] Crea account GitHub.
- [ ] Installa Git localmente (o usa GitHub Desktop).
- [ ] Scegli un tool: **Bolt.new** se vuoi browser-only, **Cursor** se vuoi IDE.
- [ ] Pensa a un progetto piccolo, personale, utile a te (non un'app generica).
- [ ] Scrivi un brief di 10 righe (le 4 domande del cap. 6).
- [ ] Genera la prima versione.
- [ ] **Commit subito** appena funziona.
- [ ] Itera UNA feature per volta.
- [ ] Dopo ogni feature: testa edge case + commit.
- [ ] Quando hai 3-5 feature solide: deploy su Vercel/Netlify.
- [ ] Mostra a 3 persone, ascolta feedback, itera.

> Il segreto non è il tool. È il **brief chiaro + iterazione disciplinata + commit frequenti**.

---

*Fine del documento di teoria. Pronto per essere strutturato in moduli, esercizi e quiz per l'app.*
