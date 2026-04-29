# Lesson illustrations

Set di 14 illustrazioni SVG, una per lezione di Path 1 (Mindset) e Path 2 (Prompt).

Stile coerente col brand kit Promptly:
- Palette: `#E8703F` (orange brand) + `#FFF1EB` (pale orange) + bianco/trasparente
- Stroke: 2-2.5px, `linecap="round"`, `linejoin="round"`
- viewBox: 64×64, scalabili senza perdita
- Composizione: una sola idea visiva per lezione, riconoscibile a 32×32

## Mapping lezioni → SVG

### Path 1 — Mindset

| File | Lezione | Concept visivo |
|---|---|---|
| `mindset-01.svg` | What is vibe coding? | Bolla di dialogo con simboli `< / >` |
| `mindset-02.svg` | You are the architect | Persona stilizzata + planimetria |
| `mindset-03.svg` | Think in outcomes, not steps | Freccia diretta verso bandiera, sentiero tortuoso scartato |
| `mindset-04.svg` | Break it down | Un blocco grande che si divide in 3 piccoli |
| `mindset-05.svg` | Context is everything | Cornice che racchiude un soggetto centrale |
| `mindset-06.svg` | The vibe coder's checklist | Clipboard con checkmarks |

### Path 2 — Prompt

| File | Lezione | Concept visivo |
|---|---|---|
| `prompt-01.svg` | Anatomy of a great prompt | 4 sezioni orizzontali (role / context / constraints / output) |
| `prompt-02.svg` | Give the AI a role | Badge / cartello con etichetta ROLE |
| `prompt-03.svg` | Constraints are your friends | Recinto che protegge un piccolo elemento |
| `prompt-04.svg` | Describe the output format | Tabella strutturata con header + righe |
| `prompt-05.svg` | Bad prompt vs good prompt | Due bolle a confronto: ✗ vs ✓ |
| `prompt-06.svg` | Prompt chaining | 3 pillole numerate connesse 1 → 2 → 3 |
| `prompt-07.svg` | The version problem | Orologio con marker di warning sul cutoff |
| `prompt-08.svg` | Prompt patterns library | Griglia 2×2 di card-template |

## Uso

Le lezioni JSON in `/content/<lang>/<path>/<order>-<slug>.json` referenziano l'icona via:

```json
{
  "icon": "/brand/lessons/mindset-01.svg"
}
```

Quindi i file SVG vanno copiati anche in `/public/brand/lessons/` per essere serviti dal browser. Claude Code lo farà come parte del Round 3a.

## Dimensione di rendering consigliata

- Card lezione (path overview): 48×48 a 56×56 px
- Header lezione (in alto nella pagina): 64×64 a 80×80 px
- Toast/notifica (post-completamento): 32×32 px

Tutti gli SVG sono testati per essere leggibili anche a 32×32.

## Aggiornamenti futuri

Quando aggiungeremo Path 3 (Build), Path 4 (Debug), Path 5 (Ship), ognuno avrà le sue illustrazioni in questa stessa cartella, seguendo la naming convention `<path-slug>-<order>.svg`.
