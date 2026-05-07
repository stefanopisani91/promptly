# 🤖 Report Test Agentico Promptly — Profilo B

**Data:** 2026-05-07 20:45–21:00 (UTC+2)
**Profilo:** B — Sara, ci sta provando (IT, working_on_it, idea precisa "app abitudini quotidiane", Cursor + Claude Code, preferito Cursor, 30 min/giorno)
**Device emulato:** Tablet 768×1024 (iPad-like) per onboarding e gran parte di Lezione 2; switch a iPhone 13 (390×844) durante step 13 per riverificare B1
**Scenari eseguiti:** 1 (onboarding completo, branching IDE) + 3 (Lezione 2 fino al primo verdetto del grader)
**Durata sessione:** ~15 min
**Account:** `qa-test-B@promptly.test` (login via `/api/qa-login`)
**Commit testato:** stato di lavoro post-fix B1/G1/G2/L1 (rispetto al report Profilo A del 2026-05-07 19:55)

---

## 📊 Sintesi esecutiva

Sessione dedicata a (a) verificare i 4 fix shippati dopo il report Profilo A e (b) eseguire un end-to-end di Profilo B (tablet, idea precisa, due tool selezionati). **Tutti i 4 fix sono confermati a regola d'arte.** Nessun nuovo bug bloccante. Personalizzazione AI eccellente: le 3 promesse step 11 e le varianti Lezione 2 step 5/8 citano correttamente `working_on_it`, "Tracce/abitudini", Cursor, e i 30 min/giorno.

Il grader CLAUDE.md ha risposto con un giudizio **mediano 65/100** (3 sezioni piene su 4) coerente con l'input — Spark identifica esattamente la sezione mancante senza sbavature. Zero errori console riconducibili al codice oggetto del round (1 errore di hydration su landing `AlternatingDemoButton` pre-esistente, fuori scope).

---

## 🔴 Bug bloccanti

### B1 — Sticky CTA bar intercetta i click sull'accordion CLAUDE.md (mobile) — ✅ **VERIFIED FIXED**

- **Cosa è cambiato:** Lo wrapper `.lesson-cta-bar` ora ha `pointer-events-none md:pointer-events-auto`, e l'inner row delle CTA ha `pointer-events-auto`. Risultato: sotto `md:` il *gradient* del wrapper non intercetta più i click sotto di sé, mentre il pulsante "Avanti" / "Indietro" continuano a essere cliccabili.
- **Verifica eseguita:** Su iPhone 13 (390×844) ho scrollato volutamente la *Sezione 2 (Stack)* dell'accordion in modo che il suo bounding rect (y=759.87, h=84) cadesse dentro l'area della CTA bar (y=756, h=88). Click reale Playwright su trigger Sezione 2 → `aria-expanded` passa a `true`, Sezione 1 si chiude. Stesso risultato per Sezione 3. **Nessun errore "subtree intercepts pointer events".**
- **Computed styles confermati:**
  ```
  .lesson-cta-bar         pointer-events: none   (mobile)
  .lesson-cta-bar > div   pointer-events: auto   (inner CTA row)
  ```
- **Screenshot:** `qa-reports/profilo-b-lesson2-step13-mobile-before-click.png`
- **Stato:** Fix shippato. Funziona. Profilo A non era più riproducibile.

---

## 🟡 Incoerenze grafiche

### G1 — Page title duplica "Promptly" — ✅ **VERIFIED FIXED**

- **Verifica eseguita:** Lettura `document.title` su 5 route diverse. Risultati:

  | Route | Title osservato |
  |---|---|
  | `/it` (landing) | `Vibe Coding: corso interattivo gratis · Promptly` |
  | `/auth` | `Accedi · Promptly` |
  | `/onboarding` | `Iniziamo · Promptly` |
  | `/dashboard` | `Dashboard · Promptly` |
  | `/lesson/mindset-01` | `L'AI esegue. Tu dirigi. · Promptly` |
  | `/lesson/mindset-02` | `Il giusto setup · Promptly` |

  **Nessuna duplicazione.** Il root layout `template: "%s · Promptly"` ora aggiunge correttamente il suffisso una sola volta.
- **Stato:** Fix shippato. Funziona su tutte le route critiche.

### G2 — Default selection biased su Step 8 (daily_goal) — ✅ **VERIFIED FIXED**

- **Verifica eseguita:** Allo step 8 (subito dopo skip del 7 con "non ho mai usato niente"), interrogato lo stato dei radio:
  ```
  radiosState: [
    { value: 'trivial', checked: false },
    { value: 'easy',    checked: false },
    { value: 'pro',     checked: false }
  ]
  continueDisabled: true
  ```
  Click su `pro` (30 min) → `continueDisabled: false`. Validazione gating funziona.
- **Screenshot:** `qa-reports/profilo-b-step08-no-preselect.png`
- **Stato:** Fix shippato. `daily_goal` non più preselezionato; "Continua" disabilitato fino a scelta esplicita.

### G3 — (nuova osservazione, bassa priorità) Preselect "Nessuno mi ha conquistato davvero" allo step 7 (preferred_tool)

- **Cosa succede:** Allo step 7 (mostrato dopo che Sara ha selezionato Cursor + Claude Code allo step 6), il radio **"Nessuno mi ha conquistato davvero"** arriva con `[checked]` di default. L'utente che non legge attentamente proseguirebbe con `preferred_tool=null`, perdendo il segnale principale del branching.
- **Impatto:** Coerente con la stessa filosofia di G2 — meglio nessuna preselezione che bias verso il "neutro". G2 è stato sistemato per `daily_goal`, ma **lo stesso pattern resta su `preferred_tool`**. Proposta: applicare la stessa logica anche qui (no preselect + Continua disabilitato fino a scelta).
- **Priorità:** Bassa. Discutibile se sia bias (qui il "Nessuno…" è semantica neutra esplicita, non una via di mezzo). Da decidere lato prodotto.

---

## 🟠 Incoerenze logiche

### L1 — Step counter mantiene "X DI 12" anche con branching che salta uno step — ✅ **VERIFIED FIXED**

- **Verifica eseguita:** Sequenza Profilo B
  1. Allo step 6, click su "🚫 Non ho mai usato niente di tutto questo" + Continua → counter `6 DI 11` → **`7 DI 11`** (avanzamento continuo, totale rinormalizzato).
  2. Tornata indietro, ho selezionato Cursor + Claude Code → counter immediatamente passa a **`6 DI 12`** (totale ricalcolato dinamicamente perché ora step 7 è atteso nel path).
  3. Continua → `7 DI 12` (preferred_tool, mostrato) → `8 DI 12` (daily_goal) → `9 DI 12` (motivation) → `10 DI 12` (recap) → `11 DI 12` (promesse) → `12 DI 12` (final). Tutti step continui, nessun salto.
- **Stato:** Fix shippato. Logica `currentVisible / totalVisible` funziona sia in avanti, sia "all'indietro" quando l'utente cambia idea sul branching trigger.

---

## 🎭 Violazioni brand (Spark)

### Nessuna violazione rilevata.

Spark resta in personaggio in tutti i contesti testati:

- **Onboarding step 1:** "Ciao. Mi chiamo Spark." — diretta, due frasi.
- **Step 7 (preferred_tool, intro):** "Ok, vedo che hai già messo le mani su qualcosa. Tra quelli che hai selezionato, quale ti è sembrato il più tuo? Quello con cui ti trovavi bene." — attiva la branching logic con conferma del segnale "lavora già".
- **Step 10 (recap):** *"Bene, Sara. Ho letto. Riassumo per essere sicura di averti capito: Sei uno che ci sta già lavorando, hai un'idea precisa su 'Un'app per gestire le abitudini quotidiane con reminder e statistiche settimanali', ti senti a casa con Cursor, e puoi darmi 30 minuti al giorno. E dietro tutto questo c'è 'Voglio costruire un prodotto vero da solo invece di dipendere sempre da sviluppatori esterni…'"* — 5 frasi, cita verbatim ogni datapoint.
- **Step 11 (3 promesse) — eccellenti:** vedi F1 sotto.
- **Lezione 2 step 13 (verdict 65/100):** *"Quasi. Hai descritto bene il progetto e lo stack è concreto, ma la sezione 'Come voglio lavorare con l'AI' è vuota — dimmi come vuoi che ti aiuti, se vuoi che pianifichi prima, che ti mostri i diff, che tipo di feedback cerchi."* — 2 frasi, identifica precisamente la sezione mancante, no praise inflation, no emoji, suggerimento concreto.

---

## ✅ Cosa funziona bene

### F1 — Personalizzazione AI promesse (step 11) — **eccellente**

Le 3 promesse generate citano TUTTI i datapoint Profilo B:
- **P1:** *"Ti insegno a usare **Cursor** in modo che il codice che generi sia davvero tuo, non una scatola nera. Con **30 minuti al giorno**, in un mese sai costruire **l'app di gestione abitudini** da solo."* → richiama `preferred_tool` + `daily_goal=pro` + `project_description`.
- **P2:** *"**Claude Code** farà il lavoro pesante, ma tu impari a chiedere bene. Quando capirai come strutturare un prompt per **reminder e statistiche settimanali**, potrai farlo con qualsiasi AI."* → richiama secondo tool selezionato + parole chiave letterali del project_description.
- **P3:** *"**Sara**, quello che vuoi è **smettere di dipendere da sviluppatori esterni**. Questa app la costruisci tu. Non sarà veloce come pagare qualcuno, ma sarà tua — e la prossima ancora più veloce. Ti aspetto."* → nome + parafrasi fedele della motivazione utente.

Specificità altissima. Tono coerente. Differenziazione netta tra P1 (metodo), P2 (skill trasferibile), P3 (motivazione personale).

### F2 — Branching condizionale onboarding + counter dinamico

Ho verificato il behavior **da entrambi i lati**:
- Selezione "Non ho mai usato niente" → step 7 saltato, totale = 11.
- Cambio idea (back + Cursor + Claude Code) → totale immediatamente ricalcolato a 12, step 7 ricompare, counter consistent (`6 DI 12` → `7 DI 12` → `8 DI 12`).

### F3 — Personalizzazione Lezione 2 (step 5 + step 8)

- **Step 5 (Cos'è un IDE AI):** Profilo B `experience_level=working_on_it` riceve la variante breve in 2 paragrafi: *"Tu lo sai già cos'è un IDE. Quello che cambia con l'AI è che non parla a vuoto — vede tutto il contesto del progetto. Niente più copia-incolla. È l'unica vera differenza, ed è enorme."*
  Nettamente diversa dalla variante beginner di Profilo A che parte da *"Senti. L'IDE è il posto dove scrivi codice. Non è una novità — esiste dagli anni '60."*
- **Step 8 (CLAUDE.md hook):** Con `preferred_tool=Cursor`, Spark cita esplicitamente Cursor:
  > *"Cursor ha lo stesso problema di tutti gli altri IDE AI: dimentica chi sei tra una conversazione e l'altra. C'è un trucco per risolverlo. In Cursor si chiama `.cursorrules`. In altri tool ha nomi diversi — CLAUDE.md, AGENTS.md, windsurfrules. Ma il principio è lo stesso."*

  Profilo A (senza preferred_tool) riceveva la variante DEFAULT che non nominava un tool. La logica `pickStep5Variant` / `pickStep8Variant` in `personalize.ts` è validata.

### F4 — Step 13 (CLAUDE.md editor) end-to-end

- Selezione progetto → header dell'editor cambia a "CLAUDE.md — App tracker abitudini".
- **Placeholder dinamici per "abitudini" verificati:**
  - Sezione 2: "Es: un'app web con database per salvare le mie abitudini, e grafici per visualizzare i progressi."
  - Sezione 3: "Es: non rompere la logica delle streak quando aggiungi cose nuove. Tieni i nomi delle abitudini in lowercase."
- Single-open accordion: cliccando sezione 2 si chiude la 1 (verificato via `aria-expanded`).
- Counter unificato: 0 → 300 → 592 → 892 / 1200 char.
- Maxlength per sezione: ~300 char (rispettato dall'editor).
- Badge "✓ compilata" appare correttamente per ogni sezione ≥10 char.
- Submit gate: abilitato sopra soglia minima.
- API `/api/lesson-claudemd-evaluate` risponde in <30s.
- Tentativi counter: 1/3 → 2/3 dopo invio.
- **Verdetto Anthropic Haiku 4.5 (1 invio):** Score breakdown coerente con l'input.
  - Clarity 22, Specificity 23, Rules 20, Workflow 0 → **Σ 65/100**
  - Section workflow vuota intenzionalmente → workflow 0 ✅ corretto.
  - Reply Spark identifica con precisione la sezione mancante → ✅ valutazione affidabile.

### F5 — Zero errori console attribuibili al round

Una sola entry [ERROR] in tutta la sessione: hydration mismatch su `AlternatingDemoButton` (componente landing con `Math.random()` per posizioni stelline animate). Pre-esistente, non riconducibile a onboarding/lezione, non introdotto dai fix di questo round.

### F6 — QA login endpoint riusato senza attriti

`POST /api/qa-login` con header `x-qa-secret` ha settato il cookie correttamente al primo colpo (status 200, user_id ritornato).

---

## 🎯 Raccomandazioni

1. **[OK, già shippato]** B1, G1, G2, L1 — tutti confermati funzionanti. Nessuna azione richiesta.

2. **[PRIORITÀ BASSA] G3 — preselect su step 7 (preferred_tool).** Stesso pattern di G2 ma su un'altra domanda. Decidere lato prodotto se "Nessuno mi ha conquistato davvero" deve restare preselezionato (è una scelta semantica esplicita, non un valore mediano) o se va rimosso per coerenza con la nuova filosofia "no defaults" su step di profilazione.

3. **[OSSERVAZIONE] Maxlength 300 char/sezione su step 13.** Il textarea della sezione 1 ha tagliato a metà la mia descrizione di 440 char ("…streak attuale, percentual" — letteralmente troncato a "percentual"). Un utente reale che scrive con cura potrebbe non rendersene conto. Suggerimento: counter visibile per sezione (oltre al totale 1200), oppure aumentare a 400/sezione, oppure mostrare un toast "limite raggiunto".

4. **[OSSERVAZIONE — fuori scope round]** Hydration mismatch su `AlternatingDemoButton` (landing). `Math.random()` in render → server/client divergono. Da sistemare con `useEffect` + state, o con valori deterministici.

5. **[NICE-TO-HAVE]** Lo `.cursorrules` placeholder/hook step 8 menziona correttamente Cursor; ma su mobile la lunghezza del paragrafo si srotola in righe corte. Visivamente accettabile.

---

## 📎 Allegati

Screenshot salvati in `qa-reports/`:
- `profilo-b-step01-intro.png` — onboarding step 1 (tablet)
- `profilo-b-step08-no-preselect.png` — step 8 daily_goal con NESSUN radio preselezionato (G2)
- `profilo-b-step11-promises.png` — 3 promesse AI personalizzate Sara/Cursor/abitudini (full page)
- `profilo-b-step12-onboarding-done.png` — finale onboarding "Adesso comincia il viaggio vero, Sara"
- `profilo-b-lesson2-step01.png` — Lezione 2 step 1 su tablet
- `profilo-b-lesson2-step05-personalized.png` — variante working_on_it dello step 5 IDE
- `profilo-b-lesson2-step08-cursor.png` — variante preferred_tool=Cursor con menzione `.cursorrules`
- `profilo-b-lesson2-step13-editor-tablet.png` — editor CLAUDE.md su tablet 768px
- `profilo-b-lesson2-step13-mobile-before-click.png` — viewport 390×844 con accordion in regione CTA bar (test B1)
- `profilo-b-lesson2-step13-quality-input.png` — 3 sezioni piene, 892/1200 char, prima dell'invio
- `profilo-b-lesson2-step13-spark-reply.png` — risposta grader: 65/100, Workflow 0, identifica sezione mancante

---

## 🔧 Note tecniche

- **Pattern di test "B1 stress":** scrollare l'accordion in modo che la sezione cada *dentro* il bounding rect della CTA bar (`y` overlap ~3px) per verificare che il pointer-events bypass funzioni davvero. Click reale Playwright (non `element.click()` JS) → se passa, il fix è genuino. Confermato.
- **Counter dinamico path:** L'algoritmo `currentVisible/totalVisible` è ricalcolato in tempo reale: tornare indietro e cambiare `tools_used` aggiorna il totale all'istante (non solo al passo successivo). Buona UX.
- **Grader budget rispettato:** 1 invio CLAUDE.md, score 65/100. Non ho ri-submittato per non sprecare il budget Anthropic.
- **Set di profili B vs A consolidato:** A (beginner / vague / no tools / mobile) e B (working_on_it / precise / Cursor+Claude Code / tablet) coprono tutti i branch principali. Mancherebbe solo profilo "advanced" + selezione di un tool no-IDE (es. ChatGPT solo) per coprire il caso dove `tools_used.length > 0` ma `tools_ide_only.length == 0` → step 7 dovrebbe ancora skippare.

— *Report generato da Claude Code in modalità behavioral testing agent. Verifica dei 4 fix B1/G1/G2/L1 + scenario E2E Profilo B.*
