# 🤖 Report Test Agentico Promptly

**Data:** 2026-05-07 19:55–20:25 (UTC+2)
**Profilo:** A — Marco, principiante curioso (IT, beginner, vague project, no tools, 5-10 min/day)
**Device emulato:** iPhone 13 (390×844)
**Scenari eseguiti:** 1 (onboarding completo) + 3 (Lezione 2 con quick win, fino a primo verdetto)
**Durata sessione:** ~30 min (incluso troubleshooting auth bypass)
**Account:** `qa-test-A@promptly.test`
**Commit testato:** `acc9416` — `feat(lesson-2): mindset-02 V3`

---

## 📊 Sintesi esecutiva

Sessione lanciata sul commit appena pushato in produzione (Lezione 2). **Nessun bug bloccante**, ma **un bug critico mobile** che impatta l'usabilità dello step 13 (la feature appena shippata): la sticky CTA bar inferiore intercetta i click sull'accordion CLAUDE.md, rendendo difficile aprire le sezioni 2/3/4 su touch device. Workaround agentico via JS, ma un utente reale resta bloccato.

Personalizzazione e branching condizionale dell'onboarding **funzionano correttamente**. Le 3 promesse AI-generated citano dati specifici dell'utente (nome, motivazione testuale, progetto, livello). Lezione 2 personalizza Step 5 e Step 8 in base a `experience_level` e (assenza di) `preferred_tool`. Reactive text al Step 7 funziona. Anthropic Haiku 4.5 grader produce feedback "vague" preciso e in personaggio.

---

## 🔴 Bug bloccanti

### B1 — Sticky CTA bar intercetta i click sull'accordion CLAUDE.md (mobile)

- **Cosa è successo:** Su iPhone 13 (390×844), tentando di aprire le sezioni 2, 3, 4 dell'accordion CLAUDE.md (step 13 della Lezione 2), Playwright ha riportato `<div class="lesson-cta-bar ...">…</div> subtree intercepts pointer events`. Anche dopo `scrolling into view`, il click non passa al trigger dell'accordion perché la barra fissa in basso (`fixed bottom-0` con `pt-8` + gradient backdrop sotto md:) copre la zona di clic dei trigger inferiori.
- **Quando:** Scenario 3, step 13 (claudemd_editor), sezioni 2/3/4 dell'accordion.
- **Riproducibilità:** Sempre, su qualsiasi viewport sotto `md:` (640px). Su desktop la `lesson-cta-bar` è `sticky` (non `fixed`) e il problema non si presenta.
- **Impatto utente:** **Alto.** L'utente non può completare il quick win senza ricorrere a workaround (scrollare freneticamente, ruotare il device). Su un widget che è il cuore della lezione 2, questo equivale a "feature non utilizzabile su mobile".
- **Screenshot:** `qa-reports/lesson2-bug-cta-overlaps-accordion.png`
- **Suggerimento fix:** Tre opzioni in ordine di preferenza:
  1. Aggiungere `padding-bottom: 6rem` (o `pb-24`) sul container del wrapper `quickwin-editor` quando il viewport è `<md:`, così che le sezioni inferiori non finiscano sotto la CTA bar.
  2. Modificare il gradient della CTA bar per non intercettare pointer events fuori dal box visibile (`pointer-events: none` sul gradient + `pointer-events: auto` sul contenuto).
  3. Cambiare la CTA bar a `sticky` anche su mobile (richiede ridefinire la layout strategy della pagina lezione).

---

## 🟡 Incoerenze grafiche

### G1 — Page title duplica "Promptly"

- **Pagina/componente:** Tutte le pagine della lesson route e l'auth.
- **Problema:** I `<title>` letti dal browser sono nel pattern `"<contenuto> — Promptly · Promptly"`:
  - `Iniziamo — Promptly · Promptly` (onboarding)
  - `Accedi a Promptly · Promptly` (auth)
  - `Il giusto setup — Promptly · Promptly` (lesson 2)
  - `L'AI esegue. Tu dirigi. — Promptly · Promptly` (lesson 1)
- **Impatto:** SEO/UX minore (tab title verboso). Probabile causa: doppio template applicato (uno nella `generateMetadata` della route + il `default`/`title.template` del root layout).
- **Screenshot:** non rilevante (testuale)
- **Confronto:** dovrebbe essere `Il giusto setup · Promptly` o simili.

### G2 — Default selection biased su Step 8 (daily time)

- **Pagina/componente:** Onboarding, step 8 ("Quanto tempo riesci a darmi al giorno?")
- **Problema:** L'opzione "15-20 min — un appuntamento giornaliero" arriva **già pre-selezionata** (`[checked]`). L'utente che non legge attentamente conferma silenziosamente quella scelta. Per Profilo A che vuole "5-10 min" ho dovuto cliccare esplicitamente per cambiare.
- **Impatto:** Bias dei dati raccolti — i `daily_goal` rischiano di concentrarsi sull'opzione media non perché preferita ma perché preselezionata.
- **Suggerimento:** O nessuna pre-selezione (radio gruppo aperto), oppure pre-selezione esplicitata da Spark ("Di solito le persone scelgono 15-20 min — vai pure se è il tuo caso, altrimenti cambia.").

---

## 🟠 Incoerenze logiche

### L1 — Step counter mantiene "X DI 12" anche con branching che salta uno step

- **Cosa avrebbe dovuto succedere:** Per un utente che non seleziona nessun IDE tool al passo 6, lo step 7 (preferred-tool follow-up) viene correttamente skippato. Il counter dovrebbe riflettere il path effettivo: `7 DI 11` invece di passare da `6 DI 12` a `8 DI 12`.
- **Cosa è successo:** Click su "Non ho mai usato niente" allo step 6 → counter passa da `6 DI 12` direttamente a `8 DI 12`. Il totale resta 12 ma il numero salta — discontinuità visibile.
- **Dove:** Onboarding, transizione step 6 → 8 per Profilo A.
- **Causa probabile:** Il counter usa `currentStepIndex` su un array di step "globale" invece di calcolare la posizione nel path effettivo dell'utente. Il branching nasconde lo step 7 ma il counter non viene rinormalizzato.
- **Impatto:** Confusione cognitiva minima (il salto è solo +2 invece di +1, può sembrare un bug agli utenti attenti). Non bloccante, ma vale fixarlo.
- **Suggerimento fix:** Calcolare `total = visibleSteps.length` per quel profilo, e `current = visibleSteps.indexOf(thisStep) + 1`.

---

## 🎭 Violazioni brand (Spark)

### Nessuna violazione rilevata in questa sessione.

Spark è rimasta in personaggio in tutti i contesti testati:

- **Onboarding step 1:** "Ciao. Mi chiamo Spark." — diretta, non saccente.
- **Onboarding step 10 (recap):** Cita verbatim il `project_description` ("qualcosa per organizzare meglio le mie idee") e la motivazione dell'utente. Massimo 4 frasi, niente esclamazioni.
- **Onboarding step 11 (3 promesse):** Ognuna sotto le 4 frasi. Nominativa ("Marco"). Cita dati specifici. Nessuna formula motivazionale-da-LinkedIn.
- **Lezione 2 step 13 (vague verdict):** *"Aspetta. Qui manca tutto: che tipo di prodotti, quanti, come paghi, quale database, come organizzi il carrello. E poi non hai scritto niente su regole e workflow. Ricomincia da zero e sii concreto."* — 3 frasi precise, identifica i pezzi mancanti, no praise, no emoji.

Tono coerente tra onboarding e lezione.

---

## ✅ Cosa funziona bene

### F1 — Personalizzazione AI promesse (step 11 onboarding) — **eccellente**

Le 3 promesse generate citano TUTTI i dati raccolti durante l'onboarding:
- **P1:** "In **5-10 minuti al giorno**, ti insegno [...] sai costruire **quella app per le tue idee** da solo." → richiama `daily_goal=trivial` + `project_description`
- **P2:** "**Partiamo da zero**, [...] Non ti servirà installare niente" → richiama `experience_level=beginner` + `tools_used=[]`
- **P3:** "**Marco**, sei qui perché **vuoi capire se l'AI fa per te prima di impegnarti davvero**." → richiama nome + motivazione testuale verbatim

Questa è esattamente la qualità che il brief richiedeva ("Le promesse personalizzate richiamano davvero i dati raccolti, NOMI specifici di tool, motivazioni").

### F2 — Branching condizionale onboarding

Il salto dello step 7 (preferred-tool follow-up) è correttamente innescato dalla selezione "Non ho mai usato niente" allo step 6. Logicamente: ✅ corretto. Visualmente (counter): ⚠️ vedi L1.

### F3 — Personalizzazione Lezione 2 (step 5 + step 8)

- **Step 5 (Cos'è un IDE AI):** Profilo A `experience_level=beginner` riceve la variante lunga in 3 paragrafi che parte da "Senti. L'IDE è il posto dove scrivi codice. Non è una novità — esiste dagli anni '60."
- **Step 8 (CLAUDE.md hook):** Profilo A senza `preferred_tool` riceve la variante DEFAULT che cita "CLAUDE.md, AGENTS.md, o cursor rules" senza nominare un tool specifico.

La logica `pickStep5Variant` / `pickStep8Variant` in `personalize.ts` è validata end-to-end.

### F4 — Reactive text step 7 (`paragraphs_by_choice`)

Click su "Non ho ancora provato a fare codice con AI" allo step 6 → step 7 mostra la variante `never_tried`: "Ok. Sei in posizione vantaggiosa: non hai vizi da disimparare." — esattamente quanto previsto dalla feature `paragraphs_by_choice` shippata in questo round.

### F5 — Step 13 — accordion + dynamic placeholders + grader

- Accordion single-open funziona: cliccando section 2, section 1 si chiude (verificato via `aria-expanded`).
- Dynamic placeholders per E-commerce visibili: section 2 ha "Es: una piattaforma che permette pagamen…", section 3 ha "Es: non modificare la pagina checkout…".
- Counter unificato: "38 / 1200 caratteri totali" calcolato sui contenuti utente trimmed (esclusi gli header `## …`).
- Badge "✓ compilata" appare correttamente quando section ha ≥ 10 char di contenuto.
- Submit gate: disabilitato sotto 30 char totali, abilitato a 38.
- API `/api/lesson-claudemd-evaluate` risponde in <8s con valutazione completa.
- Spark reply (vague case): "Aspetta. Qui manca tutto: che tipo di prodotti, quanti, come paghi, quale database, come organizzi il carrello. E poi non hai scritto niente su regole e workflow. Ricomincia da zero e sii concreto." — feedback specifico e azionabile, in personaggio.
- Tentativi counter incrementato 1/3 → 2/3 dopo invio.

### F6 — Zero errori console durante l'intera sessione

`browser_console_messages level=error` ritorna 0 messaggi su 30 minuti di navigazione (onboarding 12 step + 13 step di Lezione 2 + interazioni varie).

### F7 — QA login endpoint (Path B)

`/api/qa-login` (creato in questa sessione per sbloccare i test agentici) funziona come previsto: NODE_ENV guard + secret header + email allowlist `@promptly.test`. Risposta 200 con cookie `sb-*-auth-token` correttamente settato server-side.

---

## 🎯 Raccomandazioni prioritarie

1. **[PRIORITÀ ALTA] Fix B1 — sticky CTA bar overlap su mobile.** È un blocker reale per l'utilizzo della Lezione 2 da telefono. Soluzione preferita: `padding-bottom: 6rem` sul container `quickwin-editor` sotto `md:`. Tempo stimato: 10 min.

2. **[PRIORITÀ MEDIA] Fix L1 — step counter normalizzato sul path effettivo.** Discontinuità visiva quando branching salta uno step. Soluzione: calcolare il counter sui visible steps, non sull'array totale. Tempo stimato: 30 min.

3. **[PRIORITÀ MEDIA] Fix G1 — page title duplica "Promptly".** Probabilmente nel root layout c'è un `template: "%s · Promptly"` che si combina con un title già contenente "Promptly". Cleanup metadata. Tempo stimato: 15 min.

4. **[PRIORITÀ BASSA] G2 — rimuovere preselezione daily_goal.** Per evitare bias nei dati di onboarding. Tempo stimato: 5 min.

5. **[PRIORITÀ BASSA] Verifica auto-focus su step 13.** Il primo textarea risulta `[active]` al mount; il codice di `SectionAccordion` ha un `didMountRef` che dovrebbe prevenirlo. Da verificare se è focus reale (problematico — yank focus + apre tastiera virtuale su mobile) o solo "first focusable".

---

## 📎 Allegati

Screenshot salvati in `qa-reports/`:
- `profilo-a-step01-intro.png` — onboarding step 1
- `profilo-a-step11-promises.png` — 3 promesse AI personalizzate (full page)
- `profilo-a-step12-onboarding-done.png` — finale onboarding
- `lesson2-step01.png` — Lezione 2 step 1
- `lesson2-step13-editor-initial.png` — accordion CLAUDE.md vuoto, mobile
- `lesson2-bug-cta-overlaps-accordion.png` — bug B1 visibile
- `lesson2-step13-vague-input.png` — input vago compilato
- `lesson2-step13-vague-spark-reply.png` — reply Spark + score bars

---

## 🔧 Note tecniche per la prossima sessione

- **Auth blocker risolto** con endpoint `/api/qa-login` (NODE_ENV guard + secret + email allowlist). Pattern utilizzabile per tutti i futuri agent run senza toccare la config Supabase.
- Pattern di click sui radio: usare il LABEL (non l'input `sr-only`) per evitare pointer-events interception. Esempio:
  ```js
  await page.getByText('🌱Mai provato. Sono qui per').click();
  ```
- Per il bug B1 sul mobile, l'agente ha dovuto bypassare con `element.click()` via JS. Da non confondere con l'esperienza utente reale: per un utente touch reale, NON c'è workaround — il bug è bloccante.

— *Report generato da Claude Code in modalità behavioral testing agent. Scenario tarato per il commit `acc9416` (Lezione 2 V3 + reusable widgets + anti-abuse).*
