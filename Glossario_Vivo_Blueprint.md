# Promptly — Glossario Vivo Blueprint

> Blueprint storico della feature "parole cliccabili che attivano spiegazioni di Spark", oggi implementata. La verità di runtime è nel codice: `lib/glossary/` (dizionario + parser del markup `[[term:...]]`), `components/glossary/` (`GlossaryTerm`, `GlossaryPopover`, `GlossaryProvider`, `RichText`). Alcuni dettagli qui (cartella `hooks/`, uso di framer-motion) non rispecchiano l'implementazione finale. Per il quadro generale: `CLAUDE.md`.

**Cosa fa:** durante una lezione certi termini tecnici sono cliccabili; il click apre un popover con la definizione (voce di Spark) e un bottone che apre la chat con un draft precompilato.
**Funzione strategica:** abbassa la soglia per iniziare a parlare con Spark e insegna il lessico tecnico progressivamente, senza interrompere il flusso.

---

## 🎯 OBIETTIVO STRATEGICO

Quando l'utente vede un termine tecnico durante una lezione (es. *"dipendenza"*, *"stack"*, *"database"*) deve poter:

1. **Cliccarlo direttamente nel testo** della lezione
2. Vedere apparire una **piccola tooltip** o **modale** con la spiegazione di Spark
3. Avere la possibilità di **fare una domanda di follow-up** se ancora non gli è chiaro
4. Tornare alla lezione **senza perdere il contesto**

Tre principi guida:

1. **Non rompere il flusso della lezione** — la spiegazione è un'aggiunta, non una deviazione
2. **Spark resta in personaggio** anche nelle definizioni — concise, asciutte, non da Wikipedia
3. **L'utente impara il lessico gradualmente** — la prima occorrenza spiega, le successive usano senza spiegare

---

## 💡 NOME DELLA FEATURE

**"Glossario Vivo"** (in code: `LiveGlossary` / `live-glossary`).

Internamente per Stefano: il "tap-to-Spark" pattern.

Nel prodotto user-facing: niente nome, è una feature trasparente che semplicemente funziona.

---

## 🎨 DESIGN VISIVO

### Aspetto del termine cliccabile nel testo

Un termine cliccabile deve essere visibile ma NON invadente. Si distingue dal testo normale ma non sembra un link generico.

**Stile proposto:**

```css
/* Termine cliccabile in linea con il testo */
.glossary-term {
  background: linear-gradient(
    to bottom,
    transparent 60%,
    rgba(251, 191, 36, 0.25) 60%
  );
  cursor: pointer;
  transition: background 200ms ease-out;
  padding: 0 2px;
  border-radius: 2px;
}

.glossary-term:hover {
  background: linear-gradient(
    to bottom,
    transparent 50%,
    rgba(251, 191, 36, 0.5) 50%
  );
}
```

L'effetto visivo è una **leggera sottolineatura giallo-Spark** (o pennellata simile a un evidenziatore) che dice: *"qui c'è qualcosa in più, se vuoi"*.

NON usare:
- ❌ Underline classico (sembra link generico)
- ❌ Colore arancione brand (confonde con CTA)
- ❌ Tooltip che appare al hover (fastidioso, accidentale)

### Comportamento al tap/click

Click sul termine → appare una **piccola modale** sopra/accanto al termine, NON una tooltip che sparisce al mouseout.

**Layout della modale:**

```
┌─────────────────────────────────────────────┐
│  ✦ Spark spiega                       [✕]  │
├─────────────────────────────────────────────┤
│                                             │
│  [TERMINE]                                  │
│                                             │
│  [definizione asciutta in stile Spark]     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Vuoi che approfondisca? [chiedi →] │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Posizionamento:**
- Desktop: appare sopra/sotto il termine cliccato (popover stile Linear, con freccia che punta al termine)
- Mobile: bottom sheet che sale dal basso (occupa 40-60% schermo)

**Stile:**
- Background: `bg-stone-50` o `bg-white` con border `border-orange-200`
- Padding generoso
- Header: nome del termine in font medio + icona Spark mini
- Corpo: definizione in 1-2 frasi concise
- Footer: bottone "Vuoi che approfondisca?" che apre la chat libera con Spark, pre-compilando il primo messaggio

### Animazione di apparizione

```jsx
// Framer Motion
initial={{ opacity: 0, scale: 0.9, y: -8 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.9, y: -8 }}
transition={{ duration: 0.2, ease: "easeOut" }}
```

Apertura rapida (200ms), chiusura ancora più rapida. Niente bounce, niente effetti drammatici.

### Tracciamento "già visto"

Quando un utente apre la modale di un termine, lo segniamo come "visto" nel suo profilo. Le volte successive, il termine è ancora cliccabile MA con stile leggermente attenuato (sottolineatura più chiara). Indica all'utente *"questo l'hai già esplorato"*.

---

## 📚 CONTENUTO — IL DIZIONARIO DEI TERMINI

I termini cliccabili sono **predefiniti** in un dizionario JSON. Non scegliamo automaticamente quali parole sottolineare — selezioniamo a mano i termini chiave per ogni lezione.

### Struttura dati

```typescript
// /lib/glossary/glossary.ts

export interface GlossaryTerm {
  id: string;              // 'database', 'dipendenza', etc.
  term_it: string;         // "database"
  term_en: string;         // "database"
  definition_it: string;   // definizione in italiano (Spark voice)
  definition_en: string;   // definizione in inglese (Spark voice)
  related_terms?: string[]; // altri termini correlati per "vedi anche"
  first_lesson?: string;   // 'mindset-01', etc. — dove appare la prima volta
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  // ... 12-15 termini essenziali per Path 1
};
```

### Lista dei 12 termini iniziali per Path 1

Calibrati per copertura graduale (alcuni Lezione 1, altri Lezione 2, altri Lezione 3).

#### TERMINI LEZIONE 1

**1. `prompt`**
- IT: *"Una prompt è la frase che dai all'AI per chiederle di fare qualcosa. Più è chiara e specifica, meglio l'AI lavora. Tipo dare istruzioni a uno chef, non a un cuoco generico."*
- EN: *"A prompt is the instruction you give to AI. The clearer and more specific it is, the better the AI works. Like giving directions to a chef, not a generic cook."*

**2. `AI` / `IA`**
- IT: *"AI sta per Intelligenza Artificiale. Sono modelli che capiscono il linguaggio umano e generano risposte. Tipo Claude, ChatGPT, Gemini. Bravissimi nelle cose che possono indovinare dal contesto, scemi nelle cose che non sanno."*
- EN: *"AI stands for Artificial Intelligence. Models that understand human language and generate responses. Like Claude, ChatGPT, Gemini. Great at things they can infer from context, dumb at things they don't know."*

**3. `vibe coding`**
- IT: *"Vibe coding è quando costruisci software descrivendo a parole cosa vuoi, e l'AI scrive il codice per te. Tu dirigi, lei esegue. Niente programmazione tradizionale necessaria."*
- EN: *"Vibe coding is when you build software by describing what you want in words, and AI writes the code for you. You direct, it executes. No traditional programming required."*

**4. `IDE`**
- IT: *"IDE sta per Integrated Development Environment, ma in italiano traduciamolo come 'l'ambiente dove scrivi codice'. Cursor, Windsurf, VS Code sono IDE. Il bello è che ora hanno un'AI dentro che ti aiuta in tempo reale."*
- EN: *"IDE stands for Integrated Development Environment, basically 'the place where you write code'. Cursor, Windsurf, VS Code are IDEs. The cool part is they now have AI built in that helps you in real time."*

#### TERMINI LEZIONE 2

**5. `CLAUDE.md` / `agents.md` / `cursor rules`**
- IT: *"È un file di istruzioni che dai all'AI nel tuo progetto. Una specie di lettera che lei rilegge ogni volta che ti aiuta. Le dici cosa stai costruendo, con cosa, e cosa NON deve fare. Senza, l'AI improvvisa ogni volta."*
- EN: *"It's an instruction file you give to AI in your project. A kind of letter it re-reads every time it helps you. You tell it what you're building, with what, and what NOT to do. Without it, AI improvises every time."*

**6. `stack`**
- IT: *"Lo stack sono i mattoni con cui costruisci la tua app. Tipo: Next.js (per la struttura del sito), Supabase (per il database), Tailwind (per gli stili). Quando li metti insieme, lo chiami stack."*
- EN: *"The stack is the building blocks of your app. Like: Next.js (for site structure), Supabase (for database), Tailwind (for styles). When you put them together, you call it a stack."*

**7. `dipendenza`**
- IT: *"Una dipendenza è un pacchetto di codice già scritto da altri che il tuo progetto usa. Tipo prendere in prestito una libreria invece di scrivere tu un libro. Esempio: invece di scrivere un sistema di pagamenti, usi Stripe come dipendenza."*
- EN: *"A dependency is a package of code written by others that your project uses. Like borrowing a library instead of writing a book yourself. Example: instead of writing a payment system, you use Stripe as a dependency."*

**8. `database`**
- IT: *"Il database è il posto dove la tua app salva i dati: utenti, messaggi, foto, ordini. Quando accedi a un sito e vedi la tua roba, l'app sta leggendo dal database. Supabase, MongoDB, PostgreSQL sono database."*
- EN: *"The database is where your app saves data: users, messages, photos, orders. When you log into a site and see your stuff, the app is reading from the database. Supabase, MongoDB, PostgreSQL are databases."*

#### TERMINI LEZIONE 3

**9. `contesto`**
- IT: *"Il contesto è tutto quello che l'AI deve sapere PRIMA di rispondere alla tua domanda. Non quello che le chiedi, ma quello che le serve per capire la domanda. Tipo: 'aggiungi una funzione' senza contesto è cieca; 'aggiungi una funzione di login al mio e-commerce in Next.js' è vista."*
- EN: *"Context is everything AI needs to know BEFORE answering your question. Not what you ask, but what it needs to understand the question. Like: 'add a function' without context is blind; 'add a login function to my Next.js e-commerce' has eyes."*

**10. `funzione`**
- IT: *"Una funzione è un blocco di codice che fa una cosa specifica. Tipo: la funzione 'salvaUtente' fa solo quello, salvare un utente nel database. Le funzioni sono i mattoncini Lego del codice — ne combini tante per costruire un'app."*
- EN: *"A function is a block of code that does one specific thing. Like: the 'saveUser' function does only that, saving a user in the database. Functions are the Lego bricks of code — you combine many to build an app."*

**11. `componente`**
- IT: *"Un componente è un pezzo riutilizzabile dell'interfaccia del tuo sito. Tipo un bottone, una card, un form. Lo scrivi una volta, lo usi mille volte. Esempio: il bottone 'Salva' che vedi su 30 schermate diverse è uno solo componente, riusato."*
- EN: *"A component is a reusable piece of your site's interface. Like a button, a card, a form. You write it once, use it a thousand times. Example: the 'Save' button you see on 30 different screens is one component, reused."*

**12. `framework`**
- IT: *"Un framework è un insieme di regole e strumenti che ti dà una struttura già pronta per costruire l'app. Tipo Next.js: ti dice 'metti le pagine qui, le API qui, gli stili qui', e ti risparmia mille decisioni iniziali. Ti dà la struttura, tu ci metti dentro la storia."*
- EN: *"A framework is a set of rules and tools that gives you a ready-made structure to build your app. Like Next.js: it tells you 'put pages here, APIs here, styles here', saving you a thousand initial decisions. It gives you the skeleton, you add the story."*

### Tono delle definizioni — checklist

Ogni definizione deve:
- ✅ Essere sotto le 4 frasi
- ✅ Includere un'analogia o esempio concreto
- ✅ Avere il tono di Spark (asciutto, prima persona implicita, nessuna esclamazione)
- ✅ Essere comprensibile a chi non sa nulla di tecnico
- ❌ NON usare altri termini tecnici non spiegati (o se li usa, usa termini di base universali)
- ❌ NON essere da Wikipedia / didascalica

---

## 🛠️ ARCHITETTURA TECNICA

### Componente principale

```typescript
// /components/glossary/GlossaryTerm.tsx

interface GlossaryTermProps {
  termId: string;       // riferisce a GLOSSARY[termId]
  children: ReactNode;  // testo visibile (può differire dal termId)
}

export function GlossaryTerm({ termId, children }: GlossaryTermProps) {
  // Recupera definizione dal GLOSSARY in base alla lingua dell'utente
  // Gestisce stato aperto/chiuso della popover
  // Tracking "termine visto" tramite hook useGlossaryTracker
  // Animazione popover
}
```

### Uso nel codice delle lezioni

Nei testi delle lezioni, il contenuto Markdown/JSX include i termini come componenti:

```jsx
// Esempio in Lezione 2 step 5

<TextStep>
  L'<GlossaryTerm termId="ide">IDE</GlossaryTerm> è il posto dove
  scrivi codice. Quando ci metti dentro un'AI, vede tutto il
  contesto del tuo progetto: file, errori, <GlossaryTerm termId="dipendenza">
  dipendenze</GlossaryTerm>, struttura.
</TextStep>
```

In questo esempio, "IDE" e "dipendenze" sono cliccabili. Le altre parole sono testo normale.

### Hook di tracking

```typescript
// /hooks/useGlossaryTracker.ts

export function useGlossaryTracker() {
  // Salva in user_profiles.glossary_seen quali termini l'utente ha cliccato
  // Restituisce funzione markAsSeen(termId)
  // Restituisce funzione hasSeen(termId): boolean
}
```

### Schema dati

```sql
-- Aggiungere a user_profiles

ALTER TABLE user_profiles
ADD COLUMN glossary_seen TEXT[] DEFAULT '{}';

-- Esempio formato:
-- ['ide', 'dipendenza', 'database']
```

### Integrazione con chat libera Spark

Il bottone "Vuoi che approfondisca?" nella popover apre la chat libera Spark **pre-compilando il primo messaggio**:

```typescript
// Quando user clicca "Vuoi che approfondisca?"
const prefilledMessage = `Mi puoi spiegare meglio cos'è ${term}? Non mi è chiaro al 100%.`;

// Apre la chat con messaggio pre-compilato
openSparkChat({ initialMessage: prefilledMessage });
```

Questo risolve il **secondo problema strategico**: l'utente non sa come iniziare una conversazione con Spark. Il bottone abbassa la barriera a zero.

---

## 🎯 INTEGRAZIONE PROGRESSIVA NELLE LEZIONI

### Strategia di propagazione

I termini vanno integrati **gradualmente** nelle lezioni esistenti. Non tutti subito.

### Lezione 1 — 4 termini cliccabili

Nei testi delle 14 step di Lezione 1, identificare e wrappare:

- 1x occorrenza di `prompt` (nello step 2 o 3)
- 1x occorrenza di `AI` (step 4 — la card PRINCIPLE "L'AI è ubbidiente")
- 1x occorrenza di `vibe coding` (step 1 o introduzione)
- 1x occorrenza di `IDE` (se appare in Lezione 1, altrimenti rimanda a Lezione 2)

**Solo prima occorrenza in lezione.** Se "AI" appare 5 volte nella Lezione 1, solo la prima è cliccabile.

### Lezione 2 — 4 termini cliccabili

- 1x `IDE` (step 5)
- 1x `CLAUDE.md` (step 9 dove introdotto)
- 1x `stack` (step 10 lista 4 sezioni)
- 1x `dipendenza` (step 11 esempio)

Se l'utente ha già visto `IDE` in Lezione 1, lo stile attenuato si applica automaticamente.

### Lezione 3 — 4 termini cliccabili

- 1x `contesto` (step 5)
- 1x `database` (step 6 opzione corretta)
- 1x `funzione` (step 6 — "scrivi una funzione")
- 1x `framework` (step 11 esempio)

### Lezioni 4, 5, 6 — termini futuri

Aggiungerli quando scriverai quelle lezioni. Ogni lezione introduce 3-5 nuovi termini cliccabili.

**Regola operativa:** ogni nuovo termine compare **massimo 1 volta cliccabile per lezione**, e solo nella **prima occorrenza** del termine in TUTTA l'app (cross-lesson).

---

## Errori da evitare

### Errori UX

- ❌ NON sottolineare ogni occorrenza del termine (solo la prima cross-app)
- ❌ NON usare tooltip che appare al hover (fastidioso, va al click)
- ❌ NON aprire una pagina dedicata o cambiare URL (rompe il contesto)
- ❌ NON rendere la modale troppo grande (max 360px larghezza desktop, max 60vh mobile)

### Errori di tono

- ❌ Le definizioni NON devono usare gergo tecnico non spiegato
- ❌ Spark NON deve dire "ottima domanda!" o sembrare entusiasta
- ❌ NIENTE link esterni a Wikipedia o documentazione (rompe l'esperienza Promptly)

### Errori tecnici

- ❌ NON ricaricare la lezione quando si chiude la popover (mantenere stato step)
- ❌ NON tracciare "termine visto" se l'utente apre e chiude in <500ms (probabilmente click accidentale)
- ❌ NON sovrapporre la popover al testo che si sta leggendo (calcola spazio disponibile)

---

## 🧪 TESTING POST-IMPLEMENTAZIONE

### Test 1 — Flow base

1. Vai a Lezione 1, scorri fino al primo termine cliccabile (es. "prompt")
2. Click sul termine
3. Verifica:
   - Popover appare in 200ms con animazione fluida
   - Definizione di Spark visibile e leggibile
   - Bottone "Vuoi che approfondisca?" presente
   - Click esterno chiude popover
   - Click sulla X chiude popover
4. Riapri lo stesso termine: verifica che lo stile è "già visto" (sottolineatura attenuata)

### Test 2 — Integrazione chat Spark

1. Apri popover di un termine
2. Click su "Vuoi che approfondisca?"
3. Verifica:
   - Chat Spark si apre
   - Primo messaggio è pre-compilato con domanda sul termine
   - Spark risponde in personaggio approfondendo
   - Chiudere chat torna alla lezione, allo step esatto

### Test 3 — Persistenza tracking

1. Clicca 3 termini diversi in una sessione
2. Logout, login di nuovo
3. Verifica che i 3 termini hanno stile "già visto"
4. Verifica che nuovi termini in altre lezioni NON hanno stile "già visto"

### Test 4 — Mobile

1. Su iPhone 13, apri popover di un termine
2. Verifica:
   - Bottom sheet sale dal basso
   - Occupa 50% schermo, non di più
   - Tap sul bordo superiore chiude
   - Swipe-down chiude
   - Bottone "Vuoi che approfondisca?" facilmente cliccabile

### Test 5 — Accessibility

1. Naviga termine cliccabile via Tab
2. Verifica focus visibile
3. Apri popover con Enter
4. Naviga contenuto popover via Tab
5. Chiudi con Esc

---

## ✅ CHECKLIST PRE-IMPLEMENTAZIONE

- [ ] Sistema chat libera Spark esistente e funzionante (per integrazione "approfondisci")
- [ ] Tabella `user_profiles` aggiornata con colonna `glossary_seen`
- [ ] Componenti UI base disponibili (Popover, Modal, BottomSheet)
- [ ] Framer Motion installato per animazioni — *NB: il progetto non ha framer-motion, usa CSS keyframes pattern di `globals.css` (vedi `claudemd-editor-*`, `context-editor-pulse-border`)*
- [ ] Lingua utente accessibile via context (per definizione IT/EN)

---

## 📝 ISTRUZIONI PER CLAUDE CODE

Quando passi questo file a Code:

1. **Leggi tutto il file prima di iniziare.**

2. **Ordine di implementazione raccomandato:**
   - Crea schema dati (migrazione `glossary_seen`)
   - Crea dizionario `/lib/glossary/glossary.ts` con i 12 termini
   - Crea componente `<GlossaryTerm />` con popover
   - Crea hook `useGlossaryTracker()`
   - Integra in Lezione 1 (4 termini)
   - Integra in Lezione 2 (4 termini)
   - Integra in Lezione 3 (4 termini)
   - Implementa integrazione con chat Spark per "approfondisci"
   - Test end-to-end

3. **Usa componenti UI esistenti** (no nuove librerie). In particolare: niente framer-motion — il progetto è CSS-keyframes only.

4. **Mantieni tono di Spark** quando rendi le definizioni — NON aggiungere parole tue.

5. **Test mobile prioritario** — questa feature deve funzionare benissimo su iPhone.

6. **Nota sul rendering dei termini nelle lezioni V3.** Le lezioni V3 sono JSON con array `paragraphs: string[]`. Per supportare i termini cliccabili senza riscrivere il renderer in MDX, l'opzione più semplice è: aggiungere markup inline tipo `[[term:ide]]testo visibile[[/term]]` e parsarlo lato `TextStep` con un mini-tokenizer che produce React nodes. Da decidere prima di iniziare se preferiamo questo approccio o se conviene migrare i `paragraphs` a un formato strutturato.

---

## 💡 NOTA STRATEGICA FINALE

Il Glossario Vivo è una **micro-feature ad alto impatto strategico**.

Risolve 2 problemi insieme:
1. **Onboarding alla chat Spark**: l'utente capisce che può chiedere a Spark e come farlo. Il bottone "Vuoi che approfondisca?" è un primo passo guidato.
2. **Insegnamento progressivo del lessico**: i termini tecnici diventano accessibili senza interrompere il flusso. L'utente li impara mentre studia, non prima.

E ha 2 benefici secondari importanti:
3. **Aumenta engagement con Spark**: più click sui termini → più conversazioni → più valore percepito di Spark come mentore
4. **Riduce abbandoni**: utenti che non capiscono un termine non sono più costretti a Google-are. Restano nell'app.

Quando l'utente esce dal Path 1, deve avere padronanza del lessico minimo (12-15 termini) **senza essersi mai sentito stupido**. Questo è il successo della feature.

— *Blueprint composto da Stefano Pisani con il supporto di Claude (Anthropic), Maggio 2026. Glossario Vivo di Promptly v1.0.*
