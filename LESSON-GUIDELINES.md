# LESSON-GUIDELINES.md

> Guida operativa alla scrittura delle lezioni di Path 1 e Path 2.
> File **autosufficiente**: aprilo in una chat nuova e hai tutto il contesto per continuare il lavoro senza dover leggere conversazioni precedenti.
>
> Da leggere insieme a:
> - `LESSONS.md` — spec tecnica del sistema lezioni (schema, routing, types)
> - `vibe-coding-teoria-completa.md` — fonte teorica primaria
> - `PROMPTLY.md` — single source of truth del progetto
>
> Versione 1.0 — 29 April 2026.

---

## 1. Stato attuale

### ✅ Lezioni completate (rifatte con il nuovo standard editoriale)

| ID | Titolo IT | EN | IT | Note |
|---|---|---|---|---|
| mindset-01 | Cos'è il vibe coding | ✅ | ✅ | Originale, già esistente, OK così |
| mindset-02 | Sei tu l'architetto | ✅ | ✅ | Citazione Willison |
| mindset-03 | Pensa in risultati, non in passi | ✅ | ✅ | Apertura con caso concreto (login Google) |
| mindset-04 | Scomponi il problema | ✅ | ✅ | Citazione Descartes — **fixture di riferimento** |

### ⏳ Da rifare (priorità alta, in ordine)

**Path 1 — Mindset (2 lezioni rimaste):**

| ID | Titolo IT | Titolo EN | Fonte (vibe-coding-teoria-completa.md) |
|---|---|---|---|
| mindset-05 | Il contesto è tutto | Context is everything | §8 (Context engineering) |
| mindset-06 | La checklist del vibe coder | The vibe coder's checklist | §6 (loop 7 passi sintetizzato) |

**Path 2 — Prompt (8 lezioni nuove):**

| ID | Titolo IT | Titolo EN | Difficoltà | Fonte |
|---|---|---|---|---|
| prompt-01 | Anatomia di un buon prompt | Anatomy of a great prompt | beginner | §7 |
| prompt-02 | Dai un ruolo all'AI | Give the AI a role | beginner | §7 |
| prompt-03 | I vincoli sono tuoi amici | Constraints are your friends | beginner | §7 |
| prompt-04 | Descrivi il formato dell'output | Describe the output format | intermediate | §7 |
| prompt-05 | Prompt cattivo vs prompt buono | Bad prompt vs good prompt | intermediate | §7 |
| prompt-06 | Concatenare i prompt | Prompt chaining | intermediate | §7 |
| prompt-07 | Il problema della versione | The version problem | intermediate | §7 |
| prompt-08 | Libreria di pattern | Prompt patterns library | intermediate | §7 |

> ⚠️ Le 13 lezioni "vecchie" generate da Claude Code in modalità automatica (che oggi sono ancora in produzione) sono **da considerare scartate**. Sono troppo brevi (130-180 parole), formattazione poco brillante, sembrano triviali. NON usarle come reference. Usare la `mindset-04` come fixture.

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

```typescript
{ type: "paragraph", text: string }
{ type: "callout", variant: "key" | "warning" | "tip", text: string }
{ type: "example", label: string, text: string }            // raro, preferire simulated_output
{ type: "simulated_output", prompt: string, output: string } // terminal-style, dialogo con AI
{ type: "comparison_table", bad: { label, content }, good: { label, content } }
{ type: "quote", text: string, attribution: string }
```

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

**Path file:** `/content/<lang>/<path-slug>/<order>-<slug>.json`

Esempi:
- `/content/it/mindset/04-break-it-down.json`
- `/content/en/mindset/04-break-it-down.json`

### Schema completo

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

## 4. Sinonimi nelle `correct_answers`

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

## 5. Workflow operativo

### 5.1 Bozza in chat (italiano)
L'AI propone la lezione completa in IT, formattata in chat (NON JSON), con i blocchi indicati così:

```
[1] QUOTE (apertura)
"...."
— Autore, anno

[2] PARAGRAPH (concetto)
Testo del paragrafo...

[3] CALLOUT (variant: warning, ⚠️)
⚠️ Testo del callout...
```

E così via per tutti i blocchi. Esercizio + outro alla fine.

### 5.2 Review utente
Utente legge in chat, dà feedback specifico:
- "Cambia X in Y" (micro-correzione)
- "Rifai blocco N" (sostituisci pezzo)
- "Estendi/riduci di 50 parole"
- "Procedi" o "Salva"

### 5.3 Iterazione
AI applica le modifiche in chat, ripropone solo il blocco modificato (non riscrive tutta la lezione).

### 5.4 Salva quando OK
1. AI scrive il file JSON IT in `/content/it/<path>/<order>-<slug>.json` (sovrascrivendo l'esistente — usa `Read` prima di `Write`).
2. AI traduce in inglese mantenendo registro e tono, salva in `/content/en/<path>/<order>-<slug>.json`.

### 5.5 Validazione
AI esegue veloce sanity check:
```bash
node -e "JSON.parse(require('fs').readFileSync('content/it/<path>/<file>.json','utf8'));console.log('IT ✓')"
node -e "JSON.parse(require('fs').readFileSync('content/en/<path>/<file>.json','utf8'));console.log('EN ✓')"
```

E word count della teoria:
```bash
node -e "const j=JSON.parse(require('fs').readFileSync('content/it/<path>/<file>.json','utf8'));const w=j.theory.map(b=>(b.text||b.content||(b.bad&&b.bad.content+' '+b.good.content)||(b.prompt+' '+b.output)||'').split(/\\s+/).filter(Boolean).length).reduce((a,b)=>a+b,0);console.log('IT theory:',w,'words')"
```

### 5.6 NON committare singole lezioni
Tutto resta in locale finché non finiamo tutto Path 1+2, poi un singolo commit + push finale.

### 5.7 Cosa NON fare
- NON commitare ogni lezione singola. Commit unico alla fine.
- NON modificare `LESSONS.md`, `AUTH.md`, `BACKLOG.md`, `PROMPTLY.md`.
- NON modificare codice di rendering, schema TypeScript, `lib/`.
- NON aggiungere lezioni fuori dalla lista (Path 1: 6 lez, Path 2: 8 lez).
- NON creare nuovi SVG (sono già pronti in `/public/brand/lessons/` e `/assets/lessons/`).

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

## 9. Prompt di kickoff per nuova chat

Da copiare/incollare all'inizio di una chat nuova:

```
Sto continuando il lavoro sulle lezioni di Promptly. Apri il file
LESSON-GUIDELINES.md nel workspace, leggilo INTERAMENTE, poi apri
anche /content/it/mindset/04-break-it-down.json come fixture di
riferimento.

Workflow approvato:
1. Tu scrivi la bozza della lezione in chat in italiano (formattata
   come blocchi numerati [1] PARAGRAPH, [2] CALLOUT, ecc.).
2. Io reviso, do feedback puntuale ("cambia X in Y", "rifai blocco N",
   "procedi").
3. Tu salvi il JSON IT, poi traduci e salvi il JSON EN.
4. Validazione veloce (parse + word count).
5. NON committare. Commit unico alla fine di Path 2.

Status:
- Path 1 lezioni 1-4 ✅ fatte
- Mancano: mindset-05, mindset-06, prompt-01..08

Iniziamo dalla lezione mindset-05 (Il contesto è tutto, fonte §8 di
vibe-coding-teoria-completa.md).

Ricorda: niente metafore eccessive, niente regole forzate, 350-500
parole, sinonimi ricchi nelle blank (15-20 per blank), citazioni
parsimoniose (Karpathy/Willison/Descartes già usati).
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
| `/content/it/mindset/04-break-it-down.json` | **Fixture di stile** — apri sempre prima di iniziare |
| `/content/en/mindset/04-break-it-down.json` | Fixture di stile EN |
| `/content/<lang>/<path>/*` | Tutti i file lezione (sovrascrivere quelli esistenti) |
| `/public/brand/lessons/<id>.svg` | Icone già pronte, non toccare |

---

*Aggiorna questo file ogni volta che il workflow o le decisioni di stile cambiano.*
*Versione 1.0 — 29 April 2026.*
