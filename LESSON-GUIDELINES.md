# LESSON-GUIDELINES.md

> Guida operativa alla scrittura delle lezioni di Path 1 e Path 2.
> File **autosufficiente**: aprilo in una chat nuova e hai tutto il contesto per continuare il lavoro senza dover leggere conversazioni precedenti.
>
> Da leggere insieme a:
> - `LESSONS.md` — spec tecnica del sistema lezioni (schema, routing, types)
> - `vibe-coding-teoria-completa.md` — fonte teorica primaria
> - `PROMPTLY.md` — single source of truth del progetto
>
> Versione 2.0 — 2 May 2026.

---

## 🔥 V3 — Regole NON NEGOZIABILI sui quick win (9 May 2026)

Queste regole valgono per **tutti** i widget interattivi V3 (i quattro
"quick win" delle lezioni 1, 2, 3, 4 — Lucia / Claudemd / Context /
Constraints — e ogni futuro widget che chieda all'utente di scrivere
testo per essere valutato dall'AI).

### 1. ⚠️ PERSISTENZA DEL TESTO TRA TENTATIVI — REGOLA MASTER

> **Il testo che l'utente ha inserito al primo tentativo NON DEVE
> ESSERE CANCELLATO dopo il submit.** L'utente deve poterlo correggere
> e re-inviarlo, non riscriverlo da capo.

**Perché conta:**
- Il quick win dura 3 tentativi. Se cancelliamo il testo dopo ogni
  submit, l'utente che ha scritto un prompt mediocre deve riscriverlo
  da zero per migliorarlo. È demotivante e cancella la lezione
  pedagogica del "ho già fatto la metà del lavoro, mi manca solo
  questo pezzo".
- Tra il primo submit e il secondo, Spark dà un feedback specifico
  ("ti manca il livello CODICE", "il vincolo di processo è debole",
  ecc.). Quel feedback ha senso SOLO se l'utente vede ancora il suo
  testo originale e può aggiungere/modificare. Cancellare il testo
  rende il feedback orfano.

**Regola tecnica (per chi scrive widget nuovi):**
- Il `useState` della textarea/editor **non viene resettato** nel
  blocco `finally` del submit handler. Mai `setDraft("")` o equivalente.
- La persistenza si estende anche oltre la sessione: usa
  `sessionStorage` con chiave `<widget>:<userId>:<stepId>` per
  proteggere il testo da refresh/navigazione, e idrata da
  `state?.editorText` (passato dal parent attraverso lo `stepState`)
  al mount per i ritorni cross-session. Tre layer in cascata:
  sessionStorage → persistedState → empty.
- Se il widget ha più textarea (es. Constraints con i 3 vincoli o
  Claudemd con le 4 sezioni), ognuna persiste indipendentemente.
  L'autosave a sessionStorage scrive l'oggetto intero ad ogni
  keystroke (debounced via `useEffect`).

**Stato attuale (9 May 2026):**
- ✅ Lucia (lez 1): fix applicato — `setDraft("")` rimosso dal finally
- ✅ Claudemd (lez 2): già conforme, sessionStorage + state hydration
- ✅ Context (lez 3): già conforme, idem
- ✅ Constraints (lez 4): già conforme, idem

### 2. Lock anti-doppio-submit (sincrono)

Lo state React `evaluating` aggiorna in modo asincrono. Tre click
rapidi sul bottone "Invia" possono passare il guard
`if (evaluating || ...) return` tutti e tre prima che
`setEvaluating(true)` propaghi → tre tentativi bruciati in un colpo
solo (bug osservato sul widget Lucia il 9 May 2026).

**Regola tecnica:**
- Aggiungi un `submitInFlightRef = useRef(false)` come **lock
  sincrono** parallelo allo state.
- Il guard del submit deve controllare il ref PRIMA dello state:
  ```ts
  if (submitInFlightRef.current) return;
  if (evaluating || ...) return;
  submitInFlightRef.current = true;
  setEvaluating(true);
  ```
- Rilascia il ref nel `finally`:
  ```ts
  } finally {
    setEvaluating(false);
    submitInFlightRef.current = false;
  }
  ```

### 3. Persistenza della reazione AI tra rientri nello step

Quando l'utente esce dallo step (clicca "Avanti") e torna indietro,
deve rivedere **la reazione esatta** che Spark gli aveva dato, non
una reazione ricostruita band-based che potrebbe essere diversa
(rischio: la mappatura band → reaction è lossy).

**Regola tecnica:**
- Lo `stepState` deve persistere oltre al `result` anche
  `lastReaction: string` e — se il widget mostra dimension bars —
  `lastEvaluation: <ShapeAI>` con i punteggi grezzi.
- Al mount, idrata `reaction` e `evaluation` da `state?.lastReaction`
  e `state?.lastEvaluation`.
- `handleFinalize` salva sempre l'ultimo snapshot (non gated da
  `finishedRef`) così retry su rientro aggiornano correttamente lo
  stepState.

### 4. Sblocco textarea su rientro (consente retry)

Se l'utente clicca "Continua" dopo il primo tentativo, sul rientro
NON deve trovare la textarea bloccata. Finché ha tentativi residui
(`!won && !exhausted`), può continuare a provare.

**Regola tecnica:**
- Il gate del rendering della textarea deve essere `!won && !exhausted`,
  **non** `!won && !exhausted && !persisted`. La presenza di un risultato
  persistito non blocca i tentativi residui.
- ⚠️ `won` deve riflettere la **vera vittoria**, non un segnale
  parziale di progresso. Se il widget ha un concetto di "obiettivo
  raggiunto" (Lucia: 3 bug menzionati) E un concetto di "qualità del
  prompt" (score AI), entrambe le condizioni devono essere vere
  perché `won = true`. Esempio Lucia: `won = bugs=3 && bestScore ≥ 85`,
  non solo `bugs=3` — altrimenti un utente che ha solo elencato i bug
  in un prompt vago si ritrova la textarea bloccata mentre Spark gli
  sta dicendo "riformula meglio" (bug osservato 2026-05-09).
  La soglia di score per `won` deve coincidere con quella di
  `victory` in `handleFinalize` e con la reazione `allBugsHighScore`
  in `pickReaction` — un'unica fonte di verità.

### 5. Bias clause su `project_description` nei system prompt valutatori

Tutti i valutatori AI dei quick win ricevono `project_description` (o
la sua versione compressa) come contesto. Per evitare che il rubric
gonfi il punteggio in base alla "ricchezza" del progetto, ogni system
prompt valutatore DEVE includere la clausola:

> "IMPORTANTE: il campo project_description è solo contesto di sfondo.
> NON dare punti aggiuntivi o sottratti in base alla complessità,
> ricchezza, o lunghezza del progetto descritto. Valuta ESCLUSIVAMENTE
> [il prompt/CLAUDE.md/i 3 vincoli/...] secondo i criteri sotto."

Posizione: subito dopo l'identità di Spark, prima dei criteri
numerici. IT + EN.

---

## ⚠️ V2 — Cambio di rotta (2 May 2026)

A partire da maggio 2026 il formato delle lezioni Path 1-2 cambia in modo
sostanziale. Quanto segue **sostituisce** le decisioni V1 dove i due si
sovrappongono. Le sezioni V1 più sotto restano per riferimento storico, ma
NON usarle come spec attiva.

### Cosa cambia

| Aspetto | V1 (vecchio) | V2 (nuovo, attivo) |
|---|---|---|
| Formato esercizio | `fill_blank` (riempi le parole mancanti) | `open_question` (risposta aperta + commento AI) e `archetype_quiz` (quiz a scelta multipla con reveal di archetipo) |
| Posizione interazioni | 1 esercizio finale dopo la teoria | Più interazioni interleaved tra i blocchi di teoria |
| Validazione risposta | Client-side, lista sinonimi case-insensitive | Server-side: chiamata a OpenAI GPT-4o mini per restituire un commento testuale (no scoring, no gating) |
| Workflow autoriale | AI propone bozza → utente reviewa | Utente scrive bozza → AI reviewa, propone migliorie, traduce |
| Chiave API | `DEEPSEEK_API_KEY` (solo Pro/v2) | Aggiunta `OPENAI_API_KEY` + `OPENAI_MODEL=gpt-4o-mini` in `.env.example` (DeepSeek resta riservata a Path 3-5 quando arriveranno) |
| System prompt AI | n/a | **Per-lezione**: ogni blocco `open_question` porta il proprio campo `system_prompt`, versionato col contenuto |

### Convenzione "system prompt per lezione"

**Regola dura:** non esiste un system prompt globale di default per le
risposte aperte. Ogni `open_question` dentro una lezione ha il **suo**
campo `system_prompt`, scritto dall'autore della lezione e versionato
nello stesso JSON. Questo perché:

1. Il commento AI deve aderire al tono e al contesto specifico della lezione (la prima lezione è di benvenuto, l'ottava è tecnica — non vogliamo lo stesso prompt).
2. Modificando il prompt si modifica solo quella lezione, senza side-effect.
3. Il contenuto e il comportamento dell'AI sono diff-abili insieme nel git log.

Se vediamo emergere pattern stabili li estrarremo in un helper, ma per ora:
**un `system_prompt` per ogni `open_question`, dentro il JSON della lezione**.

### Stato del rollout V2

- ⏳ Lezione 1 (`mindset-01`) è la prima lezione scritta in formato V2. Salvata accanto al JSON V1 come `01-what-is-vibe-coding.v2.json` (vedi `§3.b`). Il renderer V2 non esiste ancora — fino al wiring, la produzione continua a servire il file V1.
- ⏳ Renderer + componenti `OpenQuestion.tsx` + `ArchetypeQuiz.tsx` + API route per GPT-4o mini = round di codice separato, fuori dallo scope dell'autoraggio contenuti.
- ⏳ Le altre lezioni (mindset 02-06, prompt 01-08) restano V1 finché non vengono riscritte in V2 una a una.

### Workflow (invertito rispetto a V1)

V1 prevedeva: AI propone bozza → utente reviewa.
V2 prevede: **Utente scrive bozza → AI reviewa, propone migliorie a punti, traduce in inglese e salva i due JSON V2.**

Vedi §5 aggiornato per il flow operativo.

---

## 1. Stato attuale

### ✅ Lezioni V1 completate (formato `fill_blank` — in produzione finché non sostituite da V2)

| ID | Titolo IT | EN | IT | Note |
|---|---|---|---|---|
| mindset-01 | Cos'è il vibe coding | ✅ | ✅ | V1 in produzione · V2 in lavorazione (`01-what-is-vibe-coding.v2.json`) |
| mindset-02 | Sei tu l'architetto | ✅ | ✅ | Citazione Willison |
| mindset-03 | Pensa in risultati, non in passi | ✅ | ✅ | Apertura con caso concreto (login Google) |
| mindset-04 | Scomponi il problema | ✅ | ✅ | Citazione Descartes — fixture di stile V1 |

### ⏳ Da rifare in V2 (priorità alta, una alla volta)

Tutte e 14 le lezioni Path 1 + Path 2 vanno riscritte in formato V2
(open_question + archetype_quiz dove serve). Si procede una lezione per
volta: l'utente scrive la bozza in chat, l'AI reviewa e traduce.

**Path 1 — Mindset:**

| ID | Titolo IT | Stato V2 | Fonte |
|---|---|---|---|
| mindset-01 | Il villaggio. Da dove tutto comincia | 🚧 in lavorazione (file v2) | §1 |
| mindset-02 | Sei tu l'architetto | ⏳ pending | §2 |
| mindset-03 | Pensa in risultati, non in passi | ⏳ pending | §2 + §6 |
| mindset-04 | Scomponi il problema | ⏳ pending | §6 |
| mindset-05 | Il contesto è tutto | ⏳ pending | §8 |
| mindset-06 | La checklist del vibe coder | ⏳ pending | §6 |

**Path 2 — Prompt:**

| ID | Titolo IT | Difficoltà | Stato V2 | Fonte |
|---|---|---|---|---|
| prompt-01 | Anatomia di un buon prompt | beginner | ⏳ pending | §7 |
| prompt-02 | Dai un ruolo all'AI | beginner | ⏳ pending | §7 |
| prompt-03 | I vincoli sono tuoi amici | beginner | ⏳ pending | §7 |
| prompt-04 | Descrivi il formato dell'output | intermediate | ⏳ pending | §7 |
| prompt-05 | Prompt cattivo vs prompt buono | intermediate | ⏳ pending | §7 |
| prompt-06 | Concatenare i prompt | intermediate | ⏳ pending | §7 |
| prompt-07 | Il problema della versione | intermediate | ⏳ pending | §7 |
| prompt-08 | Libreria di pattern | intermediate | ⏳ pending | §7 |

> ⚠️ I file V1 in produzione (formato `fill_blank`) restano live finché non
> arriva il renderer V2 e il primo file V2 non viene wired. Non cancellarli.
> Le V2 vivono accanto come `<order>-<slug>.v2.json` (vedi §3).

---

## 2. Decisioni di stile (NON deviare)

### 2.1 Lunghezza
- Teoria totale: **300-500 parole** (sweet spot 350-450).
- Le lezioni vecchie erano sui 130-180 parole — troppo corte.
- Lunghezza si misura sommando il `text` di ogni blocco (paragraph + callout + content di comparison + prompt+output di simulated_output + text+attribution di quote).

### 2.2 Tono
- **Conversazionale**, dai del "tu" (in IT: tu / tuo / ti). In EN: you / your.
- Caldo, diretto, accessibile. **Non saccente.** **Non manuale tecnico.**
- Frasi brevi e dirette. Voce attiva.
- Bandire: "bisognerebbe", "sarebbe opportuno", "si consiglia di".

### 2.3 Struttura tipica (in ordine)
1. **Apertura** — citazione (preferibile quando ne hai una azzeccata) OPPURE caso concreto/esempio diretto.
2. **Concetto** — 1-2 paragraph che spiegano il principio.
3. **Esempio/dimostrazione** — comparison_table o simulated_output (preferibilmente uno dei due, o entrambi).
4. **Sfumatura/eccezione** — paragraph che mostra "quando NON applicare la regola" (evita di sembrare assoluti).
5. **Callout di chiusura** — la regola pratica memorizzabile.

### 2.3b Teaser verso argomenti futuri (OBBLIGATORIO quando il collegamento è logico e succulento)

Quando il concetto trattato ha una naturale estensione in una lezione futura — o si collega a un argomento avanzato che il learner incontrerà più avanti (es. agenti AI, prompt chaining, context engineering, pattern library) — **inserisci obbligatoriamente un breve paragrafo di 2-3 righe** che:
- Anticipa il collegamento con curiosità, senza svelare tutto.
- Usa frasi come: *"Ne riparleremo quando affronteremo…"*, *"Questo concetto diventa ancora più potente quando…"*, *"C'è una versione avanzata di questo principio che si chiama…"*.
- È posizionato naturalmente nel flusso — di solito dopo l'esempio o prima del callout di chiusura.

**Esempi di collegamento logico e succulento:**
- Dai un ruolo all'AI → anticipa gli agenti AI (ogni agente ha un ruolo fisso nel sistema)
- I vincoli → anticipa il negative prompting e i file di regole persistenti
- Concatenare i prompt → anticipa i workflow multi-agente
- Il formato dell'output → anticipa i structured output e le API

**Non forzare** il teaser se il collegamento è debole o artificioso. Solo quando è genuinamente interessante per il learner.

### 2.4 Numero di blocchi
- **7-9 blocchi** per lezione.
- Mai più di 2 paragraph di seguito (rischio "muro di testo").
- Sempre alternare: paragraph → callout/comparison/simulated_output → paragraph → ecc.

### 2.5 Tipi di blocchi disponibili

**V1 (statici, ancora validi anche in V2):**

```typescript
{ type: "paragraph", text: string }
{ type: "callout", variant: "key" | "warning" | "tip", text: string }
{ type: "example", label: string, text: string }            // raro, preferire simulated_output
{ type: "simulated_output", prompt: string, output: string } // terminal-style, dialogo con AI
{ type: "comparison_table", bad: { label, content }, good: { label, content } }
{ type: "quote", text: string, attribution: string }
```

**V2 (nuovi blocchi, attivi nel formato V2):**

```typescript
// Titolo di sezione interno alla lezione (sopra un blocco di teoria).
// Permette di spezzare lezioni più lunghe in sotto-cap. Sottotitolo opzionale.
{ type: "section_heading", text: string, subtitle?: string }

// Domanda a risposta aperta. La risposta dell'utente viene mandata a
// GPT-4o mini insieme al campo system_prompt → l'AI restituisce un commento.
// Niente scoring, niente gating: è puro engagement / personalizzazione.
{
  type: "open_question",
  id: string,                       // unico nella lezione (es. "intro-motivation")
  prompt: string,                   // la domanda mostrata all'utente
  helper_text?: string,             // riga grigia sotto la domanda, opzionale
  placeholder?: string,             // placeholder dell'input
  max_chars?: number,               // limite hard, default 500
  system_prompt: string             // OBBLIGATORIO — vedi §11
}

// Quiz a scelta multipla con reveal di un archetipo (logica statica, no AI).
// Calcola l'archetipo dominante sommando le scelte. Pareggi risolti via
// tie_breaker_priority. Reveal accompagnato da bonus XP opzionale.
{
  type: "archetype_quiz",
  id: string,                       // es. "vibe-coder-archetype"
  intro_text?: string,              // breve intro mostrata sopra le domande
  instructions?: string,            // es. "Rispondi d'istinto, 30 secondi"
  reveal_xp_bonus?: number,         // opzionale, default 0
  questions: Array<{
    id: string,
    prompt: string,
    options: Array<{
      key: string,                  // "a" | "b" | "c" | "d" — locale alla domanda
      label: string,                // testo mostrato all'utente
      archetype_key: string         // chiave dell'archetipo a cui dà punti
    }>
  }>,
  tie_breaker_priority: string[],   // ordine di archetype_key in caso di pareggio
  archetypes: Array<{
    key: string,
    title: string,                  // es. "Il Costruttore Ostinato"
    description: string             // 2-4 frasi, tono coerente con la lezione
  }>
}
```

**Regola d'oro V2:** la teoria e le interazioni si **interleaveano**. Non
c'è più "prima la teoria, poi l'esercizio". Le `open_question` e gli
`archetype_quiz` sono mescolati con i `paragraph`, `callout`, `quote`, ecc.
nell'array `body` (vedi schema in §3.b).

### 2.6 Emoticon — solo nei callout e nei label di comparison_table

| Emoticon | Significato | Uso |
|---|---|---|
| ⚠️ | warning, attenzione | callout warning |
| 🔑 | regola fondamentale | callout key |
| 💡 | tip pratico | callout tip |
| 🎯 | in pratica, action item | callout key |
| 📌 | nota importante | callout tip |
| 🚧 | cattivo / da evitare | comparison label bad |
| 🏛️ | buono / professionale | comparison label good |
| ❌ | no | comparison label bad |
| ✅ | sì | comparison label good |
| 🚫 | divieto | comparison label bad |
| 🔁 | ciclo / loop | comparison label bad (es. doom loop) |

**MAI**: emoji decorative casuali tipo 🎉 🚀 ⭐ 🌟 ⚡ 🔥 senza un significato preciso. Mai due emoticon nella stessa frase.

### 2.7 Citazioni esperti

Politica: usate **parsimoniosamente**, max 1 per lezione, e non in tutte le lezioni.

**Citazioni già usate** (non riusare lo stesso autore in altre lezioni dello stesso path se possibile):
- mindset-01: **Karpathy** — "The hottest new programming language is English" (2023)
- mindset-02: **Simon Willison** — sul typing assistant
- mindset-04: **René Descartes** — "Suddividi ogni difficoltà..." (1637)

**Pool di citazioni utilizzabili** per le lezioni rimaste (verificare attribuzione prima di usare):
- **Andrej Karpathy** — varie altre frasi sul vibe coding (2025)
- **Kent Beck** — sul "augmented coding"
- **Andrew Ng** — sul "comprehension gap"
- **Edsger Dijkstra** — "The art of programming is the art of organizing complexity"
- **Donald Knuth** — "Premature optimization is the root of all evil"
- **Brian Kernighan** — "Debugging is twice as hard as writing the code"
- **Antoine de Saint-Exupéry** — "Perfection is achieved when there is nothing left to take away" (per la lezione su scomposizione/semplicità — NB: già usato Descartes per lez 4, evitare ridondanza)

NON citare nomi non chiaramente attribuibili. Niente "qualcuno ha detto che..." senza fonte.

### 2.8 Esempi
- Sempre **concreti**. Mai "consider an algorithm that...".
- Strumenti reali del 2026: Cursor, Claude Code, Supabase, Next.js, Bolt.new, Lovable, Vercel, Resend, ecc.
- Personaggi quando aiutano (es. "Marco vuole costruire una landing per il suo bar"), ma non forzarli.

### 2.9 Metafore
- OK in introduzione (lezione 1, 2, primi blocchi di lezioni).
- Dopo l'introduzione: **meno metafore, più esempi pratici**.
- Mai più di 1 metafora forte per lezione (es. architetto = OK; architetto + auto guida autonoma + casa = troppo).

### 2.10 Eccezioni / sfumature
- **Sempre** includere un paragraph di "eccezione" verso il fondo della teoria.
- Evita di sembrare assoluti / dogmatici.
- Esempio: "C'è un'eccezione importante: quando i passi contano davvero..."

### 2.11 Comparison table
- Usare ovunque ci sia un "bad vs good" naturale.
- Label con emoticon: 🚫/✅, ❌/✅, 🚧/🏛️, 🔁/✨.
- `content` multilinea con `\n`.
- Massimo 5 righe per lato.

---

## 3. Schema JSON di una lezione

### 3.a — Schema V1 (legacy, fill_blank — usato dai file in produzione)

**Path file:** `/content/<lang>/<path-slug>/<order>-<slug>.json`

Esempi:
- `/content/it/mindset/04-break-it-down.json`
- `/content/en/mindset/04-break-it-down.json`

### Schema V1 completo

```json
{
  "id": "mindset-04",
  "path_slug": "mindset",
  "order": 4,
  "title": "Scomponi il problema",
  "difficulty": "beginner",
  "estimated_minutes": 5,
  "base_xp": 100,
  "difficulty_bonus_xp": 0,
  "icon": "/brand/lessons/mindset-04.svg",
  "theory": [
    { "type": "quote", "text": "...", "attribution": "..." },
    { "type": "paragraph", "text": "..." },
    { "type": "callout", "variant": "warning", "text": "⚠️ ..." },
    { "type": "paragraph", "text": "..." },
    { "type": "comparison_table",
      "bad":  { "label": "❌ ...", "content": "..." },
      "good": { "label": "✅ ...", "content": "..." }
    },
    { "type": "simulated_output", "prompt": "...", "output": "..." },
    { "type": "paragraph", "text": "..." },
    { "type": "callout", "variant": "key", "text": "🔑 ..." }
  ],
  "exercise": {
    "format": "fill_blank",
    "prompt_template": "... [BLANK] ... [BLANK] ...",
    "blanks": [
      {
        "index": 0,
        "correct_answers": [
          "answer1", "synonym1", "synonym2"
        ],
        "hint_1": "Vague hint, fa una domanda.",
        "hint_2": "More specific hint.",
        "explanation": "La risposta è 'X' (o 'Y'). [Perché.]"
      }
    ]
  },
  "outro": {
    "recap": "1-2 frasi riassuntive.",
    "next_prompt": "1 frase che teasera la prossima lezione."
  }
}
```

### Campi e regole

| Campo | Valore |
|---|---|
| `id` | `<path-slug>-<order zero-padded>` (es. `mindset-04`, `prompt-01`) |
| `path_slug` | `"mindset"` o `"prompt"` |
| `order` | numero progressivo, intero |
| `title` | Italiano nel file IT, English nel file EN |
| `difficulty` | `"beginner"` per Path 1 + Path 2 lez 1-3, `"intermediate"` per Path 2 lez 4-8 |
| `estimated_minutes` | sempre `5` per ora |
| `base_xp` | beginner=100, intermediate=150 |
| `difficulty_bonus_xp` | beginner=0, intermediate=50 |
| `icon` | `/brand/lessons/<id>.svg` (file SVG già esistenti, non creare) |
| `theory` | array di blocchi (vedi tipi sopra) |
| `exercise.format` | sempre `"fill_blank"` |
| `exercise.prompt_template` | testo con `[BLANK]` come placeholder, uno per ogni blank |
| `exercise.blanks[].index` | 0-based, ordinato |
| `outro.recap` | sintetico, 1-2 frasi |
| `outro.next_prompt` | tease della prossima lezione |

---

### 3.b — Schema V2 (attivo, open_question + archetype_quiz)

**Path file:** `/content/<lang>/<path-slug>/<order>-<slug>.v2.json`

Il suffisso `.v2.json` distingue i file V2 dai V1, che restano live finché
il renderer V2 non è pronto. I due file convivono nella stessa cartella.

**Esempio (estratto, il file completo è il riferimento):**

```json
{
  "id": "mindset-01",
  "format_version": 2,
  "path_slug": "mindset",
  "order": 1,
  "title": "Il villaggio. Da dove tutto comincia.",
  "map_title": "Cos'è il vibe coding?",
  "subtitle": "Il primo segreto del vibe coding non è un prompt. È come pensi.",
  "difficulty": "beginner",
  "estimated_minutes": 5,
  "base_xp": 100,
  "difficulty_bonus_xp": 0,
  "icon": "/brand/lessons/mindset-01.svg",
  "body": [
    { "type": "paragraph", "text": "..." },
    { "type": "section_heading", "text": "Cos'è il vibe coding (per davvero)" },
    { "type": "paragraph", "text": "..." },
    {
      "type": "open_question",
      "id": "first-motivation",
      "prompt": "Dimmi in poche parole: cosa ti spinge a voler programmare?",
      "helper_text": "Non c'è risposta giusta. Sii sincero.",
      "placeholder": "Scrivi qui la tua risposta...",
      "max_chars": 500,
      "system_prompt": "Sei l'assistente di Promptly... (vedi §11)"
    },
    { "type": "section_heading", "text": "Il primo segreto" },
    { "type": "paragraph", "text": "..." },
    { "type": "callout", "variant": "key", "text": "🔑 ..." },
    {
      "type": "archetype_quiz",
      "id": "vibe-coder-archetype",
      "intro_text": "Voglio capire che tipo di vibe coder sei...",
      "instructions": "Rispondi d'istinto. Cinque domande, un minuto.",
      "reveal_xp_bonus": 150,
      "questions": [
        {
          "id": "q1",
          "prompt": "Quando ti blocchi su qualcosa che non sai fare, di solito tu...",
          "options": [
            { "key": "a", "label": "Apro venti tab cercando la risposta", "archetype_key": "analitico" },
            { "key": "b", "label": "Chiedo aiuto subito a qualcuno che ne sa", "archetype_key": "visionario" },
            { "key": "c", "label": "Provo e riprovo finché qualcosa non funziona", "archetype_key": "costruttore" },
            { "key": "d", "label": "Mollo e cambio approccio", "archetype_key": "pragmatico" }
          ]
        }
      ],
      "tie_breaker_priority": ["pragmatico", "costruttore", "analitico", "visionario"],
      "archetypes": [
        { "key": "costruttore", "title": "Il Costruttore Ostinato", "description": "..." },
        { "key": "visionario",  "title": "Il Visionario",          "description": "..." },
        { "key": "pragmatico",  "title": "Il Pragmatico",          "description": "..." },
        { "key": "analitico",   "title": "L'Analitico",            "description": "..." }
      ]
    },
    {
      "type": "open_question",
      "id": "deep-motivation",
      "prompt": "Perché vuoi imparare a programmare invece di affidarti a un professionista?",
      "system_prompt": "..."
    }
  ],
  "outro": {
    "recap": "...",
    "next_prompt": "..."
  }
}
```

### Campi V2 — regole

| Campo | Valore |
|---|---|
| `format_version` | sempre `2` (numero, non stringa). Discriminator del renderer. |
| `id` | `<path-slug>-<order zero-padded>` (uguale a V1) |
| `path_slug` | `"mindset"` o `"prompt"` |
| `order` | numero progressivo, intero |
| `title` | titolo principale, può essere più espressivo che in V1 (es. metaforico). Mostrato in cima alla pagina lezione. |
| `map_title` | OPZIONALE. Etichetta corta e topic-focused (es. `"Cos'è il vibe coding?"`) usata in TUTTI i contesti di navigazione: nodi della mappa interattiva, navigator prev/next, lista lezioni del path overview, "Continua dove eri rimasto" e "Recent lessons" della dashboard. Quando assente, navigation cade su `title`. Linea guida: tieni `title` espressivo (anche lungo) e `map_title` ≤30 caratteri. |
| `subtitle` | OPZIONALE, sotto-titolo della lezione (mostrato sotto al titolo nell'header della pagina lezione) |
| `difficulty`, `estimated_minutes`, `base_xp`, `difficulty_bonus_xp`, `icon` | uguali a V1 |
| `body` | array che mescola blocchi statici (V1) e interattivi (V2) in **document order** |
| `body[*].id` su open_question / archetype_quiz | unico dentro la lezione, kebab-case |
| `body[*].system_prompt` su open_question | OBBLIGATORIO. Vedi §11 |
| `outro.recap`, `outro.next_prompt` | uguali a V1 |

### Cosa NON va in V2

- ❌ Niente più campo `theory` o `exercise` al top-level: tutto è in `body`.
- ❌ Niente `fill_blank` né `correct_answers` né `hint_1/2/explanation`. Se una lezione V2 vuole un esercizio "più strutturato" della open_question, oggi non c'è — vediamo se serve dopo le prime 3-4 lezioni V2.
- ❌ Niente system prompt globale. Per ogni `open_question`, il suo `system_prompt`. Vedi §11.

---

## 4. Sinonimi nelle `correct_answers`

> **Solo per V1.** In V2 non esistono `correct_answers` perché la
> validazione è sostituita dal commento AI di GPT-4o mini.

**Regola: 15-20 sinonimi per blank**, in vari registri.

Per ogni blank, includere:
1. La parola "ovvia" (es. `"architetto"`)
2. Stesso con/senza articolo (es. `"l'architetto"`, `"un architetto"`)
3. Sinonimi diretti (es. `"designer"`, `"il designer"`)
4. Sinonimi laterali (es. `"decisore"`, `"regista"`, `"guida"`)
5. Forme inglesi se entrate nel lessico tech (es. `"goal"`, `"outcome"`)

Validazione lato app (`lib/lessons/validate.ts`):
- Trim spazi inizio/fine
- Lowercase
- Match esatto contro la lista

Quindi NON serve duplicare maiuscole/minuscole nella lista, basta avere la forma normalizzata.

---

## 5. Workflow operativo (V2 — invertito rispetto a V1)

### 5.1 Bozza in chat (italiano) — la scrive **l'utente**
L'utente scrive la bozza completa della lezione in italiano, formattata in
chat con i blocchi nominati come nello schema V2 (`paragraph`,
`section_heading`, `open_question`, `archetype_quiz`, ecc.). Per gli
`open_question` indica:
- la `prompt` mostrata al lettore,
- l'`helper_text` opzionale,
- il `placeholder` opzionale,
- una bozza del `system_prompt` (anche solo a parole — l'AI lo affina).

Per gli `archetype_quiz` indica la lista di domande, opzioni, mapping
delle opzioni agli archetipi, e la priorità di tie-breaking.

### 5.2 Review AI (con proposte numerate)
L'AI:
1. Legge la bozza con cura.
2. Identifica problemi concreti: incongruenze, lunghezze, cliché, regole forzate, sovrapposizioni con lezioni precedenti, etc.
3. Risponde con **proposte numerate** (1, 2, 3...), ognuna autocontenuta, indicando se è una micro-correzione o un cambio di sostanza.
4. NON modifica nulla finché l'utente non risponde quali proposte accettare.

### 5.3 Iterazione
L'utente risponde con la lista delle proposte da accettare, modificare o
scartare. L'AI integra solo quelle approvate, ripropone i pezzi cambiati,
chiede conferma finale. Una manciata di giri al massimo.

### 5.4 Salva quando OK (file V2 paralleli)
1. AI scrive il file IT V2 in `/content/it/<path>/<order>-<slug>.v2.json`. Il file V1 originale **non viene cancellato** finché il renderer V2 non è in produzione.
2. AI traduce in inglese mantenendo registro e tono, salva in `/content/en/<path>/<order>-<slug>.v2.json`.
3. Per gli `open_question`, il `system_prompt` viene tradotto coerentemente: stesso tono e stessi vincoli, in inglese. Vedi §11.

### 5.5 Validazione
AI esegue veloce sanity check su entrambi i file V2:
```bash
node -e "JSON.parse(require('fs').readFileSync('content/it/<path>/<file>.v2.json','utf8'));console.log('IT v2 ✓')"
node -e "JSON.parse(require('fs').readFileSync('content/en/<path>/<file>.v2.json','utf8'));console.log('EN v2 ✓')"
```

E word count del body (somma `text` di paragraph + content vari, esclusi system_prompt):
```bash
node -e "
const j=JSON.parse(require('fs').readFileSync('content/it/<path>/<file>.v2.json','utf8'));
const w=j.body.map(b=>(b.text||b.content||b.prompt||(b.questions?b.questions.map(q=>q.prompt+' '+q.options.map(o=>o.label).join(' ')).join(' '):'')||'').split(/\\s+/).filter(Boolean).length).reduce((a,b)=>a+b,0);
console.log('IT body:',w,'words');
"
```

Sanity check minimi V2:
- Tutti gli `open_question` hanno un `system_prompt` non vuoto.
- Tutti gli `id` (lezione, open_question, archetype_quiz, question) sono unici dove richiesto.
- `tie_breaker_priority` contiene esattamente le `archetype_key` definite in `archetypes`.
- Ogni `option.archetype_key` esiste tra le `archetypes`.

### 5.6 NON committare singole lezioni
Tutto resta in locale finché non finiamo tutto Path 1+2, poi un singolo commit + push finale.

### 5.7 Cosa NON fare
- NON commitare ogni lezione singola. Commit unico quando si chiude un blocco di lavoro coerente (es. tutte le V2 di Path 1).
- NON cancellare i file V1 in produzione finché il renderer V2 non è live e wired alle V2.
- NON modificare codice di rendering, schema TypeScript, `lib/` mentre si scrivono contenuti. Quello è scope del round "renderer V2".
- NON aggiungere lezioni fuori dalla lista (Path 1: 6 lez, Path 2: 8 lez).
- NON creare nuovi SVG (sono già pronti in `/public/brand/lessons/` e `/assets/lessons/`).
- NON inventare archetype_key, archetipi o tie-breaking al volo: se servono, propongono e si concordano.

---

## 6. Errori da evitare (lezioni dalle prime versioni)

### ❌ Regola finale forzata
**Cattivo:** "Se nel prompt usi 'e' più di una volta, scomponilo." → forzata.
**Buono:** "Se il prompt sta descrivendo più di UNA funzionalità, scomponilo."

### ❌ Troppe metafore
**Cattivo:** prima versione di mindset-02 aveva "trappola del passeggero" + "casa senza chiavi" + "auto guida autonoma" + "muratore vs architetto" + "regista vs spettatore" → troppo.
**Buono:** massimo 1 metafora forte per lezione.

### ❌ Lezioni troppo brevi
**Cattivo:** le 13 lezioni di Claude Code automatico erano 130-180 parole → triviali.
**Buono:** 350-500 parole con blocchi vari (vedi mindset-04 come fixture).

### ❌ Pochi sinonimi nelle blank
**Cattivo:** `correct_answers: ["architetto", "designer", "direttore"]` → troppo restrittivo.
**Buono:** 15-20 sinonimi, varianti con/senza articolo, registri diversi (vedi mindset-04).

### ❌ Aperture deboli
**Cattivo:** "Hai imparato che..." / "In questa lezione vedremo..." → troppo "manuale".
**Buono:** apri con citazione, esempio diretto, o paragraph forte che incuriosisce.

### ❌ Mancanza di sfumatura
**Cattivo:** lezione che presenta una regola come assoluta senza eccezioni.
**Buono:** sempre un paragraph di "eccezione" prima del callout di chiusura.

---

## 7. Fixture di riferimento

**File:** `/content/it/mindset/04-break-it-down.json`

Caratteristiche:
- 9 blocchi
- 447 parole IT (477 EN)
- Apertura con citazione di Descartes
- Esempio concreto (app condivisione foto)
- Comparison table affilata (5 righe per lato)
- Simulated output che mostra l'AI che scompone autonomamente
- Sfumatura/eccezione esplicita
- Callout finale memorizzabile
- 16-20 sinonimi per ogni blank
- Hint progressivi ben calibrati
- Outro che teasera la prossima

Apri quel file ogni volta che inizi una lezione nuova: è la "barra" da rispettare.

---

## 8. Stato finale e prossimi passi

### Quando Path 1 è completo (lez 5 + 6 rifatte)
Rivedere in chat tutte le 6 lezioni IT in fila per coerenza di tono.

### Quando Path 2 è completo (8 lezioni)
Rivedere in chat le 8 lezioni IT in fila.

### Commit unico finale
Quando tutte e 14 le lezioni (Path 1 + Path 2) sono pronte in entrambe le lingue:

```bash
cd /Users/stefanopisani/DEV/01_Progetti/PROMPTLY
npx tsc --noEmit                    # deve essere clean
npm run build                       # deve essere clean
git add content/
git commit -m "feat(content): rewrite all Path 1+2 lessons with refined editorial standard"
git push origin main
```

Poi verifica deploy verde su Netlify.

---

## 9. Prompt di kickoff per nuova chat (V2)

Da copiare/incollare all'inizio di una chat nuova:

```
Sto continuando il lavoro sulle lezioni di Promptly in formato V2.
Apri LESSON-GUIDELINES.md nel workspace e leggilo INTERAMENTE,
specialmente il banner ⚠️ V2 in cima e le sezioni 2.5, 3.b, 5, 11.
Apri anche /content/it/mindset/01-what-is-vibe-coding.v2.json come
fixture V2.

Workflow approvato (invertito rispetto a V1):
1. IO scrivo la bozza della lezione in italiano in chat, blocchi
   nominati come nello schema V2 (paragraph, section_heading,
   open_question, archetype_quiz, ...).
2. TU revisioni con proposte numerate, senza modificare nulla.
3. Io confermo quali proposte accettare.
4. Tu integri, salvi /content/it/<path>/<file>.v2.json e traduci /
   salvi /content/en/<path>/<file>.v2.json.
5. Validazione (parse + word count + sanity check V2).
6. NON committare. Commit unico quando finisce il blocco di lavoro.

Stato V2:
- mindset-01 ✅ scritta (file v2 in repo)
- da fare: tutto il resto

Iniziamo dalla lezione <id>.
Ricorda: niente regole forzate, niente metafore eccessive, ogni
open_question deve avere il suo system_prompt (vedi §11),
archetype_quiz richiede tie_breaker_priority esplicito.
```

---

## 10. File di riferimento nel workspace

| File | Cosa contiene |
|---|---|
| `LESSON-GUIDELINES.md` (questo file) | Guida operativa al workflow di scrittura |
| `LESSONS.md` | Spec tecnica del sistema lezioni (schema, types, routing) |
| `vibe-coding-teoria-completa.md` | Fonte teorica primaria (20 sezioni) |
| `PROMPTLY.md` | Single source of truth del progetto (vision, design, hosting) |
| `BACKLOG.md` | Backlog post-launch (refresh lezioni è la voce 4) |
| `/content/it/mindset/01-what-is-vibe-coding.v2.json` | **Fixture V2** — apri sempre prima di iniziare una nuova lezione V2 |
| `/content/en/mindset/01-what-is-vibe-coding.v2.json` | Fixture V2 EN |
| `/content/it/mindset/04-break-it-down.json` | Fixture stilistica V1 (per registro / tono di scrittura) |
| `/content/<lang>/<path>/<order>-<slug>.json` | File V1 in produzione (NON cancellare finché renderer V2 non live) |
| `/content/<lang>/<path>/<order>-<slug>.v2.json` | File V2 paralleli (in lavorazione) |
| `/public/brand/lessons/<id>.svg` | Icone già pronte, non toccare |
| `.env.example` | Variabili d'ambiente: `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-4o-mini` |

---

## 11. Convenzione `system_prompt` per `open_question`

Ogni `open_question` ha **il suo** `system_prompt` versionato dentro il
JSON della lezione. Niente prompt globale di default. Il prompt deve
seguire questa struttura minima:

1. **Identità + contesto** — "Sei l'assistente di Promptly, sito che
   insegna vibe coding. Stai commentando la risposta di uno studente
   alla Lezione N (titolo)".
2. **Compito** — "Commenta la risposta in massimo 2 frasi. No consigli
   tecnici, no scoring, no domande di follow-up."
3. **Tono** — "Caldo, sintetico, mai paternalistico. Niente
   motivational-da-LinkedIn. Niente emoji."
4. **Casi tipici** — 2-4 esempi (idea concreta / curiosità generica /
   dubbio o insicurezza / risposta evasiva) e come rispondere a ognuno.
   Servono come few-shot impliciti.
5. **Vincoli duri** — lunghezza max, lingua (sempre quella della
   lezione), niente promesse di risultati, niente claim di
   personalizzazione futura non supportata dal prodotto.

**Esempio (italiano, lezione 1):**

```
Sei l'assistente di Promptly, sito che insegna vibe coding. Stai
commentando la risposta aperta di uno studente alla Lezione 1
("Il villaggio. Da dove tutto comincia.") alla domanda
"cosa ti spinge a voler programmare?".

Compito: commenta la risposta in massimo 2 frasi. Niente consigli
tecnici, niente scoring, niente domande di follow-up.

Tono: caldo, sintetico, mai paternalistico. Niente motivazionale
da LinkedIn. Niente emoji. Italiano scorrevole.

Casi tipici:
- Idea concreta (app, sito, automazione) → riconoscila e dì che
  è esattamente da idee così che parte Promptly.
- Curiosità generica ("voglio capire come funziona") → conferma
  che la curiosità è il combustibile più duraturo.
- Insicurezza / dubbio ("non so se ce la farò") → valida il dubbio
  e dì che è il miglior alleato all'inizio.
- Risposta evasiva o non pertinente → rispondi con sobrietà,
  senza forzare entusiasmo.

Vincoli:
- Massimo 2 frasi.
- Mai chiudere con una domanda.
- Mai promettere "diventerai un programmatore in X giorni".
- Mai citare strumenti specifici (Cursor, Claude, ecc.) — quelli
  arrivano dopo nel corso.
```

**Traduzione EN del `system_prompt`:** quando si traduce la lezione,
si traduce anche il `system_prompt` (stesso contenuto, in inglese).
È uno dei campi che cambiano per locale.

**Modifiche post-pubblicazione:** se vediamo che il commento AI
non è all'altezza, si modifica il `system_prompt` nella lezione
specifica. Niente patch globali.

---

*Aggiorna questo file ogni volta che il workflow o le decisioni di stile cambiano.*
*Versione 2.0 — 2 May 2026.*
