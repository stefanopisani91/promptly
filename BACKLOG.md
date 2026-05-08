# PROMPTLY — Backlog Post-Launch

> File dove vivono tutte le iterazioni / miglioramenti / modifiche da fare DOPO l'MVP iniziale.
>
> I file `PROMPTLY.md`, `AUTH.md`, `LANDING.md` restano la spec "pulita" del prodotto. Qui invece si accumulano richieste vive che emergono durante l'uso.
>
> Ogni voce ha: stato (⏳ proposed / 🚧 in progress / ✅ done), priorità (🔴 alta / 🟡 media / 🟢 bassa), descrizione, e quando è il momento di partire un mini-prompt per Claude Code.
>
> Versione 1.0 — 29 April 2026.

---

## 1. 🐛 Fix server-side exception su /dashboard post-onboarding

**Stato:** ✅ done (29 April 2026, commit `09d78a2`)
**Priorità:** 🔴 alta (era un crash visibile all'utente subito dopo onboarding)

### Risoluzione

L'errore era: *"Functions cannot be passed directly to Client Components"*. Il Server Component `app/(app)/dashboard/page.tsx` passava al Client Component `WelcomeCard` un oggetto `copy` con `title` come funzione `(name) => string`. React Server Components non può serializzare funzioni attraverso il confine server→client.

Fix: in `dashboard/page.tsx` la funzione viene risolta lato server con `welcomeCard.title(displayName)` e al `WelcomeCard` arrivano solo stringhe pure (title, sub, cta, submitting).

Audit aggiuntivo confermato: gli altri tre function-fields in `lib/i18n/auth.ts` (`checkEmail.sub`, `dashboard.greeting`, `onboarding.progressLabel`) sono già consumati in modo safe.

Verificato in produzione: utente loggato → `/dashboard` renderizza con greeting, 3 stat placeholder, welcome card, e logo + lang toggle + logout nell'header.

### Sintomo

Dopo aver completato i 3 step di onboarding, l'utente atterra su `/dashboard` e vede:

```
Application error: a server-side exception has occurred (see the server logs for more information).
Digest: 1844069790...
```

La welcome email viene comunque inviata (perché l'invio avviene prima del render dashboard). Quindi il bug è nel render della dashboard, non nel flusso onboarding.

### Cause possibili da indagare

- Query Supabase nella dashboard che fallisce (es. RLS che blocca, campi attesi `null`)
- Componente che si aspetta una prop popolata ma riceve `undefined` (es. `welcome_seen_at` o XP placeholder)
- Server action `dismissWelcome` chiamata prematuramente

### Prompt Claude Code (quando lo affronteremo)

```
Bug: dopo onboarding, /dashboard crasha con "Application error" digest 1844069790.
La welcome email arriva (quindi l'invio precedente al render funziona).
1. Apri Netlify → Functions → Logs, cerca per digest 1844069790.
2. Dimmi l'errore esatto del log.
3. NON guessare il fix. Prima leggi il log, poi proponi il fix.
```

---

## 2. 🎨 Branding nelle email (welcome + reminder futuri)

**Stato:** 🚧 in progress (welcome ✅ done 29 April 2026 · reminder ⏳ pending)
**Priorità:** 🟡 media

### Welcome email — ✅ done (29 April 2026, commit `42cf521`)

Implementato in `lib/notifications/email-templates/welcome-it.tsx` e
`welcome-en.tsx`: sostituito il wordmark testuale arancione "Promptly" con
un `<Img>` puntato a `${SITE_URL}/brand/logo-horizontal.png` (180×50px,
centrato, margin-bottom 32px). Niente altri cambi a copy/CTA/footer/colori.

Asset PNG (non SVG) generato da `assets/logo-horizontal.svg` via `sharp`
e salvato in `public/brand/logo-horizontal.png` — 360×100 RGBA trasparente,
4.6 KB, 2× retina rispetto al display target.

**Decisioni implementative (rilevanti se si rifa qualcosa di simile):**

- **PNG anziché SVG.** Gmail/Outlook desktop/Yahoo/AOL strippano l'SVG
  inline al sanitizer → utenti vedono solo alt-text con icona broken.
  PNG copre ~99% client.
- **180×50 anziché 180×40 (originale spec).** La SVG ha viewBox 720×200
  (aspect 3.6:1). 180×40 (4.5:1) avrebbe squashato verticalmente il
  logo. 180×50 preserva l'aspect ratio originale.
- **`SITE_URL` anziché `getCanonicalOrigin()`.** `getCanonicalOrigin()`
  throws se `NEXT_PUBLIC_SITE_URL` manca. Per template email
  transazionali (invocati da server actions / webhook) non vogliamo
  crashare l'invio per un env mancante: `SITE_URL` ha lo stesso valore
  in produzione ma con fallback safe.

**Verifica produzione:** `curl -sI https://learnpromptly.app/brand/logo-horizontal.png`
→ `HTTP/2 200`, `content-type: image/png`.

### Welcome email — spec originale (preservata per cronologia)

- Aggiungere il **logo Promptly grande** in cima all'email (header dominante)
- Asset disponibile: `/public/brand/logo-full.svg` o `/public/brand/logo-horizontal.svg`
- Tono e copy attuali da mantenere (sono già caldi e personali)

### Daily reminder email (futuro, quando attiveremo le notifiche streak)

- Logo più piccolo (header minimale, ~100px wide)
- Più compatto, ottimizzato per mobile (Gmail/Apple Mail preview)
- Brand color `--primary` per CTA

### Note tecniche

- Il logo va linkato come `<Img src={\`${SITE_URL}/brand/logo-horizontal.svg\`}/>` (gli email client non leggono asset locali, devono essere pubblici).
- Verificare che il logo renderizzi su Gmail web, Gmail iOS/Android, Apple Mail, Outlook.

### Prompt Claude Code (quando lo affronteremo)

```
Aggiorna i template welcome email (welcome-it.tsx + welcome-en.tsx) in
lib/notifications/email-templates/ aggiungendo in cima all'email il logo
Promptly. Usa l'asset pubblico ${SITE_URL}/brand/logo-horizontal.svg con
larghezza 180px, centrato, con margine top/bottom. Niente altri cambi al
template.
```

---

## 3. 📋 Onboarding esteso — da 3 a 6 step

**Stato:** ⏳ proposed (in attesa di validazione liste)
**Priorità:** 🟡 media (non blocca il funzionamento, arricchisce il profilo utente)

L'onboarding attuale è 3 step (Nome → Lingua → Daily goal). Aggiungere 3 step di profilazione per capire chi è l'utente e personalizzare l'esperienza:

| Step | Cosa | Tipo input |
|---|---|---|
| 1 | Nome | testo (esistente) |
| 2 | Lingua | radio IT/EN (esistente) |
| 3 | Daily goal | radio 5/10/15 min (esistente) |
| **4** | **Livello di vibe coding** | **single select** |
| **5** | **IDE + LLM usati** | **multi-select (chip)** |
| **6** | **Frustrazioni principali** | **multi-select + schermata risposta contestuale** |

### Step 4 — Livello di vibe coding (single select)

**Domanda:** *"Qual è il tuo livello con il vibe coding?"*

Opzioni proposte (DA VALIDARE con l'utente):

- 🌱 Mai sentito parlare di vibe coding
- 📘 L'ho letto / sentito ma non l'ho mai praticato
- 🚀 Lo uso saltuariamente
- 🔥 Lo uso quotidianamente

**DB:** nuovo campo `users.vibe_coding_level text` (con CHECK constraint sui valori).

### Step 5 — IDE + LLM (multi-select stile preferences)

**Domanda:** *"Quali strumenti usi? (puoi sceglierne più di uno)"*

UI: due gruppi di chip selezionabili (IDE in alto, LLM sotto).

**IDE proposti (DA VALIDARE):**
- Cursor
- Claude Code
- VS Code (+ Copilot / Continue)
- Windsurf
- Bolt.new
- Lovable
- v0 (Vercel)
- Replit
- Antigravity
- Altro (campo testo libero)

**LLM proposti (DA VALIDARE):**
- Claude (Sonnet / Opus)
- ChatGPT (GPT-4o / o1)
- Gemini
- DeepSeek
- Llama
- Mistral
- Altro (campo testo libero)

**DB:** due nuovi campi `users.ides text[]` e `users.llms text[]`.

### Step 6 — Frustrazioni + risposta contestuale

**Domanda:** *"Quali sono le frustrazioni più grandi che incontri?"*

Multi-select. Opzioni proposte (DA VALIDARE):

1. 🔁 Bug che ne genera altri quando provo a correggerli con l'AI ("doom loop")
2. 👻 L'AI inventa funzioni / API che non esistono
3. 🌪 Perdo il contesto a metà del lavoro
4. 💬 Non so come spiegare bene cosa voglio
5. 🔥 L'AI modifica parti del codice che non volevo toccare
6. 🌫 Le sessioni lunghe diventano caotiche
7. 🔍 Difficoltà a capire cosa è andato storto
8. 🔐 Mi dimentico di proteggere chiavi / dati / sicurezza
9. 💸 Costi API che esplodono
10. 🤔 Non so quando fidarmi del codice generato

**Schermata di chiusura (contestuale):**

Dopo il submit del Step 6, mostrare una schermata che fa riferimento alla **prima frustrazione selezionata** (in ordine di lista). Ognuna ha un messaggio dedicato che riconosce il problema e promette il valore di Promptly.

**Esempi di risposta contestuale (DA REVISIONARE):**

| Frustrazione selezionata | Messaggio |
|---|---|
| Doom loop | *"Questo è uno dei problemi più comuni del vibe coding. In Promptly imparerai a riconoscere quando sei nel ciclo, come uscirne con un prompt nuovo, e quando vale la pena ricominciare da zero senza perdere lavoro."* |
| API inventate | *"L'AI può sembrare sicura anche quando inventa. Promptly ti insegna a chiedere all'AI di citare le sue fonti e a verificare prima di fidarti, così smetti di perdere ore dietro a funzioni fantasma."* |
| Perdita di contesto | *"È il tallone d'Achille delle sessioni AI. In Promptly impari a costruire un context file (CLAUDE.md) che mantiene il filo del progetto, anche tra una sessione e l'altra."* |
| Non so spiegare cosa voglio | *"Questa è la skill numero 1 del vibe coding. Promptly è costruito esattamente per questo: 14 lezioni gratuite per imparare a parlare con l'AI in modo chiaro, conciso, efficace."* |
| AI modifica parti che non volevo | *"Una protezione fondamentale: imparerai a 'recintare' le aree del codice che l'AI non deve toccare (auth, payments, migrations) con prompt mirati."* |
| Sessioni lunghe caotiche | *"Le sessioni lunghe rompono tutto. Promptly ti insegna a lavorare in sessioni corte e focalizzate, con commit frequenti, così niente è mai irrecuperabile."* |
| Difficoltà a debuggare | *"Capire un errore senza saper leggere codice è la skill che il Path 4 di Promptly trasforma da incubo in routine."* |
| Sicurezza | *"Le AI non controllano la sicurezza per te. In Promptly imparerai i 5 punti che l'AI dimentica sempre: chiavi, validazione, accesso, secrets, deploy."* |
| Costi API | *"Vedremo come scrivere prompt più densi (meno token, più valore) e quando convenga usare modelli economici come DeepSeek invece di Opus."* |
| Non so quando fidarmi | *"Imparerai a leggere il codice generato come un manager, non come un ingegnere — in 5 minuti capirai se l'AI ha capito davvero quello che volevi."* |

**Copy finale CTA:** *"Iniziamo →"* (porta a /dashboard).

**DB:** nuovo campo `users.frustrations text[]`.

### Considerazioni UX

L'onboarding passa da ~30s a ~90-120s. È un investimento significativo di friction. Possibili contromisure:
- Step 4-5-6 con bottone "Salta per ora" (skip → utente atterra in dashboard, può completare il profilo dopo da Settings)
- Oppure: tutto obbligatorio ma con copy che spiega il valore ("Più ci dici di te, più Promptly può adattarsi")

→ Da decidere insieme prima di implementare.

### Prompt Claude Code (quando lo affronteremo)

```
Estendi l'onboarding da 3 a 6 step seguendo le specifiche del BACKLOG.md
voce 3. Liste finali (validate dall'utente):
- Livello: [...]
- IDE: [...]
- LLM: [...]
- Frustrazioni: [...]
- Risposta contestuale per ciascuna: [...]

Vincoli:
- Estendi la state machine OnboardingShell mantenendo lo stesso pattern.
- Nuovi campi DB: users.vibe_coding_level (text), users.ides (text[]),
  users.llms (text[]), users.frustrations (text[]).
- Nuova migration sql incrementale.
- Schermata Step 6 con risposta contestuale: dopo submit mostra un componente
  separato (non un toast) che legge la prima frustrazione e renderizza il
  messaggio mappato. CTA "Iniziamo →" che chiude e porta a /dashboard.
- Conferma piano prima di codice.
```

---

## 4. ✏️ Riscrittura lezioni Path 1 + Path 2 — pivot V2 (open_question + GPT-4o mini)

**Stato:** 🚧 in progress (pivot V2 attivo dal 2 May 2026)
**Priorità:** 🔴 alta (le lezioni sono il prodotto vero — gli utenti le consumano per imparare)

### Contesto

Il Round 3b ha lasciato 13 lezioni in produzione (Path 1 lez 2-6 + Path 2
lez 1-8) generate da Claude Code in modalità automatica. Erano **scarse**:
troppo brevi (130-180 parole), formattazione poco brillante, sembravano
triviali.

Stavamo iniziando una riscrittura V1 (formato `fill_blank`, standard
editoriale alzato a 350-500 parole). 4 lezioni mindset erano state rifatte
in quel formato (mindset-01..04).

### Pivot V2 (2 May 2026) — cambio di rotta

A maggio 2026 il formato esercizio cambia: niente più `fill_blank`. Il
nuovo standard è:

- **`open_question`** — domande a risposta aperta con un singolo campo testo. La risposta dell'utente viene commentata da **OpenAI GPT-4o mini**. Niente scoring, niente gating: pura personalizzazione.
- **`archetype_quiz`** — quiz multi-domanda multiple-choice che rivela un archetipo, logica statica (no API), opzionale per lezione.
- **System prompt per-lezione**, dentro ogni `open_question.system_prompt`. Niente default globale.
- **Workflow invertito**: Stefano scrive la bozza, l'AI revisiona con proposte numerate, traduce in EN e salva entrambi i file V2.
- **File paralleli**: `<order>-<slug>.v2.json` accanto al file V1, finché il renderer V2 non è in produzione.
- **API key**: `.env.example` contiene `OPENAI_API_KEY` + `OPENAI_MODEL=gpt-4o-mini` (da riempire).

Spec completa: `LESSON-GUIDELINES.md` (banner ⚠️ V2 in cima, §3.b, §11).
Master: `PROMPTLY.md` (banner V2 in cima, sezione "Exercise Formats — B").

### Stato V2

🚧 In lavorazione:
- mindset-01 (Il villaggio. Da dove tutto comincia.) — file v2 in repo, in fase di review

⏳ Da rifare in V2:
- mindset-02..06 (Path 1)
- prompt-01..08 (Path 2)

🗑 Le V1 di mindset-01..04 non sono più la "fixture": vengono sostituite
dalle V2 una a una. Restano in produzione finché la V2 non viene wired.

### Il renderer V2 è una voce di codice separata

Vedi `LESSONS.md` "Round 4 — V2 lesson format" per la checklist
implementativa (types, componenti, API route OpenAI, ecc.). Lo si fa
DOPO che almeno la prima lezione V2 è scritta e validata sul testo.

### File di riferimento

**`LESSON-GUIDELINES.md`** in root del progetto contiene tutto il contesto
operativo necessario per continuare: decisioni di stile, schema V2,
workflow invertito, convenzione `system_prompt` per-lezione (§11), errori
da evitare, prompt di kickoff per nuova chat.

### Quando finita

Single commit + push quando si chiude un blocco coerente (es. tutte le V2
di Path 1, oppure tutto Path 1+2). Messaggio suggerito:
`feat(content): rewrite Path 1 lessons in V2 (open_question + GPT-4o mini)`.

---

## Convenzioni del file

- Ogni voce ha un titolo numerato (1, 2, 3, ...). Aggiungere voci nuove in coda con il prossimo numero — non rinumerare le esistenti.
- Quando una voce è completata: cambia stato in ✅ done, sposta in fondo al file in una sezione "Done" (per cronologia). Non cancellare.
- Ogni voce dovrebbe avere abbastanza contesto da poter essere ripresa anche dopo settimane senza memoria fresca.

---

## Spark — Pro tier (rate limit + memoria settimanale)

**Stato:** ⏳ proposed (deferred — depends on Stripe wiring)
**Priorità:** 🟡 media (gating del piano Pro è una feature monetizzabile)
**Aperta:** 6 May 2026

### Contesto

`Promptly_Spark_Master_Configuration.md` §3 prescrive due tier:

| Feature | Free | Pro |
|---|---|---|
| Spark — messaggi per lezione | 5 | 20 |
| Spark — messaggi totali al giorno | 20 | 80 |
| Memoria di Spark tra sessioni | Solo sessione corrente | Cronologia ultima settimana |

**Stato attuale (Sessione 3 del 6 May 2026, commit successivo a `f8e59f4`):**
- ✅ Per-lezione (5) attivo via `user_progress.spark_chat_count`
- ✅ Daily (20) attivo via `spark_usage_daily.message_count`
- ❌ Pro tier non raggiungibile — Stripe non è ancora wired (vedi voce esistente "Stripe checkout" in questa stessa BACKLOG).
- ❌ Memoria conversazionale: nessuna (ogni messaggio a `/api/spark-chat` è single-turn).

### Cosa fare quando Stripe è online

1. Aggiungere colonna `tier text not null default 'free'` a `public.users`, con check constraint `tier in ('free', 'pro')`.
2. Webhook Stripe `checkout.session.completed` + `customer.subscription.deleted` aggiornano la colonna.
3. In `app/api/spark-chat/route.ts`:
   ```ts
   const tier = profileRow?.tier ?? 'free';
   const PER_LESSON_QUOTA = tier === 'pro' ? 20 : 5;
   const DAILY_QUOTA = tier === 'pro' ? 80 : 20;
   ```
4. Memoria settimanale (Pro): nuova tabella `spark_chat_history` con `(user_id, created_at, role, content)`. La rotta carica gli ultimi N turni (es. ultimi 10) della stessa lesson + lo manda come `messages: [...]` invece del solo turno corrente. Solo per tier Pro.
5. UI: il bubble "Chiedi a Spark" mostra il counter giusto in base al tier.

---

## Spark — Feedback "quota esaurita" sul bubble disabled

**Stato:** ⏳ proposed (legato alla grafica definitiva del bubble)
**Priorità:** 🟡 media
**Aperta:** 6 May 2026

### Contesto

Il bubble dorato "?" attuale (`AskSparkBubble.tsx`) è grafica **provvisoria** — sarà sostituito dalla versione finale che Giuseppe disegnerà in linea con l'estetica visiva di Spark. Quando l'utente esaurisce i 5 messaggi/lezione (o i 20/giorno), il bubble entra in stato `disabled`: opacity 50% + click ignorato dal browser per via dell'attributo `<button disabled>`.

Problema scoperto in test del 6 May 2026: l'utente vede il bubble "morto" senza capire **perché** non risponde. Esiste già un tooltip `quotaExhausted` / `dailyQuotaExhausted` (vedi `lib/i18n/lessons.ts`), ma:

1. Il tooltip esce solo all'**hover desktop**. Su mobile non si vede mai.
2. Anche su desktop, l'utente potrebbe non hover-are esattamente sul bubble (28×28 px è piccolo).

### Cosa fare quando la grafica è definitiva

Riprogettare il flusso "quota esaurita" insieme al redesign del bubble. Tre opzioni da valutare:

1. **Click-to-explain**: rimuovere `disabled` e permettere sempre il click; in stato esaurito la modale si apre comunque ma mostra solo il messaggio quota-esaurita + CTA "torna nella prossima lezione" / "torna domani". Più scoperto, costa 5 minuti.
2. **Stato visivo persistente**: bubble disabled ottiene un badge testuale (`0/5`) o un'icona diversa (lucchetto, X, stop). Leggibile senza hover.
3. **Microcopy nella vignetta**: una delle vignette orbitanti diventa una linea di Spark stessa che dice *"Per oggi su questa lezione abbiamo parlato abbastanza. Vai avanti."* — coerente con la voce di Spark e nessuna nuova UI da progettare.

L'opzione 3 si sposa meglio con l'estetica "Spark è viva" del Master Config, ma richiede orchestrazione lato backend (la vignetta deve apparire solo quando lo stato lo merita).

### File toccati nella scelta

- `components/lessons/v3/AskSparkBubble.tsx` — il bubble stesso
- `components/lessons/v3/SparkChat.tsx` — eventuale modale "esaurita"
- `lib/i18n/lessons.ts` — copy IT/EN già presente (`quotaExhausted`, `dailyQuotaExhausted`)
- `components/lessons/v3/VignetteCloud.tsx` — solo se si sceglie l'opzione 3

### Quando affrontarlo

Quando Giuseppe consegna la grafica finale del bubble di Spark. Da non fare prima — sarebbe lavoro buttato se la grafica cambia struttura (es. un avatar invece di un cerchio, o un balloon di chat invece di un bubble).

---

## Auth — Abilitare leaked-password protection

**Stato:** ⏳ proposed
**Priorità:** 🟢 bassa
**Aperta:** 6 May 2026

### Contesto

Il Supabase Advisor scan (`mcp__claude_ai_Supabase__get_advisors` security) segnala:
> `auth_leaked_password_protection` — WARN — *Leaked password protection is currently disabled. Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org.*

Documentazione: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Cosa fare (2 minuti)

1. Vai su Supabase Dashboard → **Authentication** → **Providers** → **Email** → **Password Strength**
2. Attiva **"Check passwords against HaveIBeenPwned"**
3. Ri-esegui `get_advisors` per verificare che la voce sia sparita

---

## 📖 Glossario Vivo — termini cliccabili che attivano Spark

**Stato:** ⏳ proposed
**Priorità:** 🟡 media (alto impatto su engagement con Spark + onboarding al lessico)
**Aperta:** 8 May 2026
**Spec completa:** [`Glossario_Vivo_Blueprint.md`](Glossario_Vivo_Blueprint.md) (root)

### Contesto

Feature trasversale alle lezioni Path 1 (poi propagata a Path 2-5). Termini tecnici nei testi delle lezioni (es. `prompt`, `IDE`, `CLAUDE.md`, `stack`, `dipendenza`, `database`, `contesto`, `funzione`, `componente`, `framework`, `vibe coding`, `AI`) diventano cliccabili — un click apre una popover con la definizione di Spark + un bottone "Vuoi che approfondisca?" che pre-compila la chat libera Spark.

Risolve due problemi:
1. **Onboarding alla chat Spark** — l'utente non sa come iniziare a parlarle; il bottone "approfondisci" è il primo passo guidato.
2. **Lessico tecnico progressivo** — l'utente impara i termini in linea, senza dover Google-are e abbandonare.

### Cosa serve in pratica

1. Migration: colonna `glossary_seen TEXT[]` su `user_profiles` per tracking termini visti.
2. Dizionario: `lib/glossary/glossary.ts` con i 12 termini IT+EN del blueprint (pre-scritti, non auto-generati).
3. Componente: `<GlossaryTerm termId="..." />` con popover desktop + bottom sheet mobile, animazione 200ms (CSS keyframes — il progetto non usa framer-motion).
4. Hook: `useGlossaryTracker()` per `markAsSeen` / `hasSeen`.
5. Integrazione chat Spark: il bottone "approfondisci" apre la chat con messaggio pre-compilato.
6. **Decisione tecnica aperta**: come embeddare i termini nei `paragraphs: string[]` delle lezioni V3? Opzioni nel blueprint §"Istruzioni per Claude Code" — probabilmente un markup inline `[[term:ide]]…[[/term]]` parsato in `TextStep`.

### Integrazione progressiva

- Lezione 1 → 4 termini (`prompt`, `AI`, `vibe coding`, `IDE`)
- Lezione 2 → 4 termini (`IDE`, `CLAUDE.md`, `stack`, `dipendenza`)
- Lezione 3 → 4 termini (`contesto`, `database`, `funzione`, `framework`)
- Path 2-5 → da scrivere quando le lezioni saranno pronte

Regola: ogni termine cliccabile **una sola volta** in tutta l'app (prima occorrenza cross-lesson).

### Tempo stimato

4-6 ore di vibe coding per la prima passata (Path 1 completo + componente + tracking). Vedi blueprint per dettagli design, dizionario completo, errori da evitare e checklist di test.

---

*Aggiornare questo file ogni volta che emerge una nuova richiesta secondaria. È il "diario di bordo" delle iterazioni post-MVP.*
