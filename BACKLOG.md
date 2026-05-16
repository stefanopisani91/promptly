# PROMPTLY — Backlog Post-Launch

> Iterazioni / miglioramenti / modifiche da affrontare dopo l'MVP iniziale. Lo stato attuale del prodotto è in `CLAUDE.md`; le spec storiche sono in `docs/archive/`.
>
> Ogni voce ha: stato (⏳ proposed / 🚧 in progress / ✅ done), priorità (🔴 alta / 🟡 media / 🟢 bassa) e descrizione.
>
> Versione 1.0 — 29 April 2026.

---

# Voci urgenti

> Voci che bloccano l'esperienza utente o che conviene affrontare prima del prossimo ciclo di test. Le altre stanno nel backlog numerato più sotto.

---

## Urgente 0 — PostHog cattura eventi solo dal lato marketing (provider non montato sul lato app)

**Stato:** ⏳ proposed
**Priorità:** 🔴🔴 ALTISSIMA (sopra a tutti gli altri Urgenti in questa sezione)
**Aperta:** 14 May 2026
**Quando affrontarlo:** insieme all'attivazione del **banner dei cookie / consent UI** — vedi sotto perché i due lavori vanno fatti nello stesso passaggio.
**Scope:**
- [components/analytics/PostHogProvider.tsx](components/analytics/PostHogProvider.tsx) — provider lazy-init via `requestIdleCallback`
- [app/(marketing)/[lang]/layout.tsx:112](app/(marketing)/[lang]/layout.tsx#L112) — UNICO mount point del provider in tutto il codebase
- [lib/analytics/posthog.ts:99](lib/analytics/posthog.ts#L99) — guardia `if (!initialized) return` nel wrapper `track()`
- Layout app autenticata che NON monta il provider: `app/(app)/layout.tsx` (dashboard, lesson, settings, admin, path)

### Sintomo (a cosa serve sapere questa cosa)

In produzione vediamo in PostHog solo gli eventi del lato **marketing** (landing page pubblica): `landing_viewed`, `landing_hero_*`, `landing_exercise_*`, `landing_faq_*`, `landing_tools_*`, `landing_closing_cta_*`, `landing_lang_switched`.

**TUTTI gli eventi che partono dal lato app autenticata sono silenziosamente droppati.** In particolare:

- `spark_helper_opened` / `_suggestion_clicked` / `_message_sent` / `_quota_hit` / `_missed_personalization` — emessi da [components/lessons/v3/SparkChat.tsx](components/lessons/v3/SparkChat.tsx) dentro le lezioni V3
- `referral_link_activated` / `referral_link_copied` — emessi da `ReferralShareButton` nella dashboard
- Tutta la tassonomia futura che vive dentro le lezioni: gli eventi `lesson_started`/`lesson_completed`/`exercise_attempt` predisposti in [lib/lessons/progress.ts:146-148](lib/lessons/progress.ts#L146-L148) (oggi commento "wiring in round successivo") quando saranno cablati partiranno muti se questo bug non è risolto

### Causa esatta

`PostHogProvider` (che chiama `initPostHog()` e poi cattura i pageview manuali) è montato in **un solo layout**, quello marketing:

```
app/(marketing)/[lang]/layout.tsx:112  <PostHogProvider> { children } </PostHogProvider>
```

Il wrapper `track()` ha una guardia che bail-out silenziosamente se PostHog non è stato inizializzato:

```ts
// lib/analytics/posthog.ts:97-101
export function track(event: AppEvent) {
  if (typeof window === "undefined") return;
  if (!initialized) return;          // ← silenzioso, nessun warning
  posthog.capture(event.name, event.props ?? {});
}
```

Risultato: un componente sul lato app (es. SparkChat) importa `track` dal wrapper, lo chiama correttamente, ma `initialized` è `false` perché `initPostHog()` non è mai stato eseguito in quella tab → `posthog.capture` non viene mai chiamato. Nessun errore in console, nessuna traccia.

### Perché farlo insieme al cookie banner (e non prima)

1. Il cookie banner (GDPR/ePrivacy) richiede di **gateare l'init di PostHog dietro al consenso**. Va riscritto comunque `initPostHog()` per non partire prima dell'opt-in.
2. Mentre riscriviamo l'init flow è il momento naturale per **decidere DOVE montare il provider**. Sceglierne lo scope sbagliato adesso → debito tecnico tra qualche settimana.
3. Toccare un solo componente analitico in un solo passaggio = meno rischio di drift tra "dove è il provider" e "dove è il consent state".
4. **Non bisogna esporre più dati senza consenso**. Lasciare il bug ora è in realtà conservativo (meno tracking sul lato app significa meno violazione potenziale finché il banner non c'è). Fixarlo prima del banner peggiorerebbe il rischio GDPR.

### Fix da valutare quando si arriva qui

**Opzione A — Single provider sul root layout** (più pulita)
- Spostare `<PostHogProvider>` da `app/(marketing)/[lang]/layout.tsx` a `app/layout.tsx` (root). Il provider lazy-inizializza una sola volta per tab, copre marketing + app + auth.
- Pro: zero duplicazione, un solo punto di gating del consent.
- Contro: gestire la `lang` per gli eventi cross-surface (oggi PostHogProvider non legge `lang` direttamente, ma se serve attribution si può passare via context).

**Opzione B — Due provider scope-separati** (più granulare)
- Lasciare il provider marketing dov'è e aggiungerne uno parallelo in `app/(app)/layout.tsx`. La guardia `initialized` in [posthog.ts:5](lib/analytics/posthog.ts#L5) è già idempotente (singleton flag) quindi due mount funzionano.
- Pro: permette consent UI differenziato (marketing senza login = banner; app loggata = già consensata in onboarding).
- Contro: due punti di gating, due possibili divergenze.

**Opzione C — Cookie-consent provider wrappa entrambi**
- Quando arriva il banner si farà comunque un `<ConsentProvider>` che decide se rendere PostHog attivo. Quel provider sta sul root, e PostHog si attacca a lui. Naturalmente questa è la combinazione di A + nuovo livello di gating.

### Test post-fix (verificare in produzione, su account loggato)

1. Login → entra in una lezione V3 → apri Spark Helper → in PostHog deve apparire `spark_helper_opened` entro 30s.
2. Clicca un suggerimento → `spark_helper_suggestion_clicked` deve apparire.
3. Apri la dashboard → tocca "Condividi" sul referral card → `referral_link_copied` deve apparire.
4. Visita la landing in modalità incognito (senza login) → `landing_viewed` deve continuare a funzionare (regression check).
5. Aprire la dev console: `window.posthog?.config?.token` deve essere definito sia su `/dashboard` sia su `/it` (oggi solo la seconda).

### Vincoli da rispettare

- Mantenere `capture_pageview: false` + `capture_pageleave: true` — i pageview sono già fatti manualmente in [PostHogProvider.tsx:70](components/analytics/PostHogProvider.tsx#L70) per evitare doppi conteggi con il routing client-side di Next.js.
- Il lazy init via `requestIdleCallback` (2.5s fallback) deve restare — è la garanzia che PostHog non blocchi LCP/INP.
- Istanza EU (`https://eu.i.posthog.com`) obbligatoria per GDPR — già il default in [posthog.ts:14](lib/analytics/posthog.ts#L14).
- Non aggiungere chiamate dirette a `posthog-js` fuori dal wrapper. Tutto il tracking deve continuare a passare da `track()` (convenzione di CLAUDE.md riga 218).

### Prompt Claude Code (quando lo affronteremo)

```
Sto attivando il cookie banner / consent UI per GDPR. Contestualmente devo
risolvere il bug PostHog descritto in BACKLOG.md "Urgente 0":
PostHogProvider è montato solo in app/(marketing)/[lang]/layout.tsx, quindi
TUTTI gli eventi dal lato app autenticata (spark_helper_*, referral_*, e i
futuri lesson_*) vengono silenziosamente droppati dalla guardia
`if (!initialized) return` in lib/analytics/posthog.ts:99.

Decidi insieme a me l'opzione (A: provider sul root layout / B: due provider
scope-separati / C: consent provider che wrappa entrambi) basandoti su come
sto strutturando il cookie banner. Poi: implementa, aggiungi log dev-only
quando track() viene chiamato pre-consent, e verifica con i 5 test del
post-fix nella voce di backlog.
```

---

## Urgente 1 — Calibrare il Lucia widget perché l'utente arrivi più facilmente alla vittoria

**Stato:** ✅ done (10 May 2026, commit `e173d5c`)
**Priorità:** 🔴 alta
**Aperta:** 9 May 2026 · Chiusa: 10 May 2026

### Risoluzione

Tre layer di fix applicati e validati su 23 prompt di test:

**Code-side** ([types.ts](lib/landing-demo/types.ts) + [InteractiveStep.tsx](components/lessons/v3/steps/InteractiveStep.tsx)):
- Soglia vittoria 85 → 70, perfect 95 → 90, estratte come costanti `LUCIA_VICTORY_THRESHOLD` / `LUCIA_PERFECT_THRESHOLD` (single source of truth)
- `BONUS_ALL_3_BUGS` 5 → 10
- Pesi `computeTotale`: chiarezza 0.25 → 0.30, protezione 0.20 → 0.15 (Lez 1 non ha ancora insegnato i vincoli)

**System prompt OpenAI** ([system-prompt.ts](lib/landing-demo/system-prompt.ts), IT+EN):
- CHIAREZZA: scala aperta a linguaggio comune (non più obbligatorio "404"/"/assets/profilo.jpg" per >65)
- CONTESTO: descrizione visiva basta per 45-65 (non più richiesto riferimento a codice/framework)
- PROTEZIONE: rimosso il tono "STRETTA/RIGORE/NON indulgente" che dava bias punitivo, rebranded come "calibrata sulla Lezione 1"
- PROTEZIONE: bande allargate (0-30 niente, 35-60 generici)
- PROTEZIONE: lista esempi di vincoli operativi ampliata ("preserva tipografia", "non installare librerie", "non cambiare le classi esistenti")
- `bugs_menzionati`: passaggio da match per parola-chiave a riconoscimento semantico
- Beginner floor: banda 0-15 → 8-22 (non punitivo per chi prova)

**Calibrazione finale (23 prompt validati):**
- Vague/off-topic: 5-12 (correttamente non vincono)
- 1-2 bug coperti: 33-52 (retry zone)
- 3 bug + 0 vincoli: 64-69 (near-miss — Spark dice "aggiungi un vincolo")
- 3 bug + ≥1 vincolo: 76-79 (WIN ✅)
- Avanzati (3 bug + 3+ operativi + spiegazione): 95-100 (PERFECT ✨)

I "vincoli" restano il discriminator pedagogico tra near-miss e win, coerente con il preview di Lez 4.
**Scope:** [components/lessons/v3/steps/InteractiveStep.tsx](components/lessons/v3/steps/InteractiveStep.tsx) + [lib/landing-demo/types.ts](lib/landing-demo/types.ts) + [lib/landing-demo/system-prompt.ts](lib/landing-demo/system-prompt.ts)

### Problema osservato (test reale 9 May 2026)

L'utente nel primo tentativo della Lezione 1 ha scritto un prompt decente che menzionava tutti e 3 i bug e ha ottenuto **bestScore = 69**. Breakdown:
- chiarezza: 95
- contesto: 65
- obiettivo: 70
- protezione: **15** ← qui il problema
- bonus: +5 (tutti i bug menzionati)

Per "vincere" (cioè `band: "all_bugs"` con score ≥ 85, soglia di `r.allBugsHighScore` e di `victory`) servirebbe scrivere un prompt enterprise-grade con almeno 3-4 vincoli operativi specifici (`non aggiungere dipendenze`, `mostra solo i diff`, `non modificare il framework`, `preserva il design system`...) E chiedere una spiegazione del fix. **Soglia troppo alta per la Lezione 1**, che è introduttiva e non ha ancora insegnato il concetto di vincoli (Lezione 4) né di `diff` (glossary di Lezione 4).

L'utente percepisce il widget come "ho fatto tutto giusto e mi dà 69, è bloccato". Demotivante.

### Direzioni da considerare (non mutuamente esclusive)

1. **Abbassare la soglia di vittoria** da 85 → 70 nel widget. Punti da toccare:
   - `won` in `InteractiveStep.tsx` (`bestScore >= 85` → `>= 70`)
   - `victory` in `handleFinalize` (`bestScore >= 85` → `>= 70`)
   - `pickReaction` in `InteractiveStep.tsx` (`ev.totale >= 85` → `>= 70`)
   - `bandFor` in `InteractiveStep.tsx` (`bestScore >= 95` → `>= 90` per `perfect`)
   - Eventualmente la soglia in [lib/landing-demo/types.ts](lib/landing-demo/types.ts) `bandFromScore` (oggi 81 per "great") — rivedere se va allineata.
   - **Una sola fonte di verità**: estrarre una costante `LUCIA_VICTORY_THRESHOLD` invece di duplicare il numero in 4 punti.

2. **Ammorbidire la scala di "protezione"** nel system prompt. Oggi è dichiarata "STRETTA": un utente di Lezione 1 che non ha mai sentito parlare di "vincoli operativi" non può segnare alto. Per Lezione 1 ha senso accettare anche vincoli più morbidi ("non rompere il resto", "modifiche minime") con score 50-60 invece di 30-55. Modifica in [lib/landing-demo/system-prompt.ts](lib/landing-demo/system-prompt.ts) §4 (IT) e mirror EN.

3. **Ribilanciare i pesi** delle 4 dimensioni in `computeTotale` ([lib/landing-demo/types.ts](lib/landing-demo/types.ts)). Oggi: chiarezza 0.25 + contesto 0.25 + obiettivo 0.30 + **protezione 0.20**. Per la Lezione 1 (introduttiva) la protezione conta troppo. Proposta: chiarezza 0.30 + contesto 0.25 + obiettivo 0.30 + **protezione 0.15**. Sposta 5 punti dal "non lo sai ancora" al "concetti di Lezione 1".

4. **Bonus più generosi al primo tentativo** quando l'utente ha menzionato tutti i bug (incentiva il "wow al primo colpo"): `BONUS_ALL_3_BUGS` da 5 → 10. O aggiungere un nuovo bonus `+5 al primo tentativo se score ≥ 60`.

### Vincoli da rispettare nel fix

- La modifica deve essere **isolata alla Lezione 1**. Le Lezioni 2/3/4 non devono cambiare comportamento (le loro soglie sono già nei rispettivi widget e usano `xp_by_case` indipendenti).
- Il punteggio della **landing page demo** (Lucia su `/it` e `/en` per visitatori non loggati) può cambiare insieme al widget di lezione: condividono la stessa API e lo stesso system prompt. Confermare se la calibrazione "facile" deve valere anche lì o se va separata.

### Test post-fix (3 profili)

- **Beginner-vago**: prompt che cita 1 bug senza vincoli → ~40 (non vincente, OK)
- **Intermedio-onesto** (oggi 69): prompt che cita 3 bug, 1-2 vincoli generici, comportamento atteso → DOVREBBE arrivare a 70-80 → **vincita** ✓
- **Advanced**: prompt enterprise (3 bug + 3+ vincoli operativi + chiede spiegazione) → 95-100 → vincita perfetta con fuochi d'artificio

---

## Urgente 3 — Ruotare 3 password/secret finiti in git history (file settings.local.json)

**Stato:** ⏳ proposed
**Priorità:** 🔴 alta (azione di pulizia, non blocca utenti, ma non rimandare oltre il prossimo giro Pro/pubblicazione)
**Aperta:** 10 May 2026

### Cosa è successo (in parole semplici)

Il file `.claude/settings.local.json` (la lista di permessi che Claude Code ha imparato comando per comando) è stato **tracciato in git** per molti mesi. Dentro, alcune approvazioni includevano comandi `curl` di test scritti in chiaro — e in quei comandi c'erano 3 segreti veri:

1. **`x-qa-secret`** — la chiave che apre l'endpoint locale di QA login (`app/api/qa-login/`)
2. **Password del test user `qa-test-A@promptly.test`** (Supabase Auth)
3. **Password del test user `qa-test-C@promptly.test`** (Supabase Auth)

I valori esatti vivono nella git history pre-`064e70c` — recuperali da lì se servono per identificare gli script di test che li usano (`git log --all -p -- .claude/settings.local.json | grep "x-qa-secret"`). NON copiarli in altri file tracciati.

⚠️ **Questi 3 valori sono nella history di git anche dopo il commit `064e70c` che ha aggiunto il file a `.gitignore`**. Rimuoverlo dal tracking non li toglie dai commit passati.

### Perché vale la pena agire (anche se la repo è privata)

- "Privata oggi" non è "privata per sempre". Se un giorno la rendi pubblica → secrets esposti istantaneamente
- Se aggiungi un collaboratore anche solo per 1 ora → vede tutta la history
- Account compromesso (token GitHub rubato, password leak) → l'attaccante vede subito la history
- Integrazioni OAuth che hai connesso (Netlify, Supabase MCP, ecc.) hanno già accesso al codice
- L'endpoint `qa-login` è gitignored quindi NON è in produzione → il rischio reale dell'`x-qa-secret` è basso, ma è comunque pulizia da fare

### Cosa fare (10 minuti totali)

**1. Ruotare `x-qa-secret`** (~3 min)

```bash
# Genera nuovo hex random
openssl rand -hex 24
# Copia l'output, sostituisci il valore di QA_SECRET (o come si chiama)
# nel tuo .env.local locale
```

Riavvia il dev server. L'endpoint `/api/qa-login` userà la nuova chiave automaticamente.

**2. Ruotare la password di `qa-test-A@promptly.test`** (~3 min)

- Vai su [Supabase Dashboard](https://supabase.com/dashboard) → progetto Promptly → **Authentication** → **Users**
- Cerca `qa-test-A@promptly.test`
- Click sul menu `...` accanto all'utente → **"Send password recovery"** (manda un link di reset)
- Oppure: click sull'utente → **"Update password"** → genera una nuova password random e copiala in un password manager

**3. Ruotare la password di `qa-test-C@promptly.test`** (~3 min)

Stessa procedura del punto 2.

**4. (Opzionale) Aggiornare gli script di test che usano queste password**

Se hai script in `scripts/` o `qa-reports/` che hanno hardcodate le password vecchie, aggiornali con le nuove. Recupera i valori vecchi dalla git history (vedi sopra) e cercali nei file locali con `grep -r <vecchio_valore> .`.

### Cosa NON serve fare (overkill)

- ❌ Riscrivere la git history con `git filter-repo` per cancellare il file. Operazione invasiva (rompe i clone esistenti, riscrive ogni hash di commit) sproporzionata per 3 secret a basso impatto.
- ❌ Cambiare `.env.local` in produzione: `QA_SECRET` non è in produzione (l'endpoint `qa-login` è gitignored e non viene deployato).

### Quando rifare l'azione

- Quando capita, in 10 minuti di slow time
- **Da fare prima** di qualsiasi di queste mosse:
  - rendere pubblica la repo
  - aggiungere un collaboratore esterno (anche temporaneo)
  - migrare il codice in un altro provider git
  - usare i test account su un ambiente di staging condiviso

### Prevenzione futura

Già fatto col commit `064e70c`: `.claude/settings.local.json` è in `.gitignore`. Niente di nuovo finirà accidentalmente in git da quel file.

Per il futuro, evitare di approvare comandi `curl` con secret inline tra i pattern auto-approvati di Claude Code. Meglio: tenere i secret in `.env.local` e referenziarli con variabili (`-H "x-qa-secret: $QA_SECRET"`), così Claude approva il pattern del comando senza memorizzare il valore.

---

## Urgente 2 — Reazioni di Spark devono correlare con i punteggi reali delle 4 dimensioni

**Stato:** ⏳ proposed
**Priorità:** 🔴 alta
**Aperta:** 9 May 2026
**Scope:** [components/lessons/v3/steps/InteractiveStep.tsx](components/lessons/v3/steps/InteractiveStep.tsx) — `pickReaction` + i18n strings

### Problema osservato

Spark sceglie la reazione da mostrare in base a 2 segnali grossolani:
- `bugs_menzionati.length` (0 / 1 / 2 / 3)
- `totale` ≥ 85 sì/no

Il risultato: due utenti con punteggi totali simili ma profili dimensionali completamente diversi vedono la **stessa reazione**. Esempi reali:
- Utente A: chiarezza 95, contesto 65, obiettivo 70, **protezione 15**, totale 69 → riceve `r.allBugsLowScore` ("il prompt è ancora vago...")
- Utente B: chiarezza 30, contesto 30, obiettivo 50, protezione 80, totale 60 → potrebbe ricevere lo stesso messaggio "è vago"

Il consiglio di Spark per A è **falso** (il prompt di A NON è vago, è preciso ma manca dei vincoli). E quello per B sarebbe inadeguato perché il problema vero è la mancanza di osservazione/contesto.

In più: il valutatore AI **già produce un campo `consiglio`** ([lib/landing-demo/system-prompt.ts](lib/landing-demo/system-prompt.ts) riga 142) targetizzato sulla dimensione più debole. Esempio reale dal DB: *"Hai fornito l'errore esatto e descritto i problemi visivi. Aggiungi vincoli operativi specifici per migliorare il prompt."* — questo consiglio è **PERFETTO** per il caso utente A. Ma il widget non lo mostra mai: pesca dalla tabella di reazioni pre-scritte locali.

### Cosa fare

**Opzione minima** (1-2 ore): mostrare il `consiglio` AI invece (o oltre) della reazione pre-scritta, almeno per gli stati `vague` / `photoOnly` / `twoBugs` / `allBugsLowScore`. Le reazioni "celebrative" (`allBugsHighScore`) restano scriptate per il tono di voce.

**Opzione media** (mezza giornata): rifare `pickReaction` come funzione che:
1. Identifica la dimensione più bassa (`weakestDim`).
2. Sceglie un template per `weakestDim` invece che per il bandone.
3. Sostituisce un placeholder `{specific_advice}` con il `consiglio` dell'AI.

Esempio di template targeted:
- `weakestDim === 'protezione'` → `"Hai chiarezza e obiettivo. Ti manca la protezione: {specific_advice}"`
- `weakestDim === 'contesto'` → `"Hai centrato il problema ma manca contesto: {specific_advice}"`

**Opzione completa** (1 giornata): aggiungere anche le **dimension bars già visibili dopo il submit** (fix del 9 May 2026 che ha mostrato chiarezza/contesto/obiettivo/protezione) — collegarle visualmente al consiglio: la dimensione debole pulsa rossa, le altre verdi.

### File toccati nell'opzione media

- [components/lessons/v3/steps/InteractiveStep.tsx](components/lessons/v3/steps/InteractiveStep.tsx): rifare `pickReaction` con la logica weakest-dim + integrare `ev.consiglio`. Persistere `consiglio` in `lastEvaluation` (già fatto al 9 May 2026).
- [lib/i18n/lessons.ts](lib/i18n/lessons.ts) `v3.interactiveStep.reactions`: cambiare le 5-6 stringhe pre-scritte in template con placeholder, IT + EN. Aggiungere chiavi per le 4 weakest dimensions.

### Vincoli

- Il tono di Spark resta lo stesso: asciutto, in prima persona, mai paternalista, mai "bravissimo". Il `consiglio` AI è già allineato a questo tono (vedi system prompt riga 142-146 IT).
- Le reazioni "celebrative" su victory (`allBugsHighScore`) restano scriptate — il tono di vittoria è troppo cinematografico per affidarlo all'AI.
- Mantenere il fallback `deriveReactionFromResult` per legacy stepState senza `consiglio` salvato.

### Quando affrontarlo

Ideale: insieme alla calibrazione del scoring (URGENTE 1). Le due fix si rinforzano — abbassare la soglia di vittoria + dare un consiglio mirato è la combinazione che trasforma un widget "punitivo" in uno "didattico".

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

**Stato:** 🚧 in progress (welcome ✅ done · sender + dark-mode fix ✅ done 16 May 2026 · reminder ⏳ pending)
**Priorità:** 🟡 media

### Welcome email — capitolo chiuso (16 May 2026)

Tre cambi consecutivi shippati in un trittico di commit:

**1. Sender migrato al dominio verificato** (commit `2372d73`)

- `from:` `Promptly <welcome@send.learnpromptly.app>` (era `Promptly <onboarding@resend.dev>`, indirizzo shared di test di Resend con deliverability fragile e DKIM/SPF non allineati al brand).
- `replyTo: "stepcloud3@icloud.com"` aggiunto inline su `resend.emails.send` in [lib/notifications/email.ts:71](lib/notifications/email.ts#L71). Le risposte alla welcome ora arrivano alla mailbox del fondatore invece di bouncare sul mittente Resend.
- `.env.example` aggiornato con `RESEND_FROM_EMAIL=Promptly <welcome@send.learnpromptly.app>` + commento sopra che annota la verifica DKIM/SPF/DMARC del dominio `send.learnpromptly.app` su Resend (16 May 2026).
- Nota SDK: Resend v6 espone il campo come `replyTo` (camelCase) nei typing TS; sul wire-protocol viaggia come header `Reply-To`. Diverso solo nel naming TS, identico nel comportamento.

**2. Logo rasterizzato dal `PromptlyWordmark` — sostituisce `public/brand/logo-horizontal.png`** (stesso commit `2372d73`)

Il PNG che la welcome serve come `<Img>` è ora la rasterizzazione di [components/promptly/PromptlyWordmark.tsx](components/promptly/PromptlyWordmark.tsx) — stesso wordmark dell'header app loggato e della landing — al posto del lockup mark+wordmark all-caps del SVG `assets/logo-horizontal.svg`. Brand coerente tra surface in-app ed email.

Pipeline: [scripts/generate-wordmark-png.ts](scripts/generate-wordmark-png.ts) (Playwright headless Chromium + sharp, registrato come `npm run generate-wordmark`) renderizza un HTML standalone con Plus Jakarta Sans 700 caricato da Google Fonts, fa `element.screenshot({ omitBackground: true })` e scrive `public/brand/logo-horizontal.png` (RGBA 349 × 92 px, 6.59 KB). Da rilanciare ogni volta che il wordmark cambia tipografia/spacing/colore. Lo SVG ufficiale `assets/logo-horizontal.svg` resta intatto per OG image / favicon / press kit.

Colore testo nel PNG: `#1F2937` (combacia con il fill del wordmark nel SVG ufficiale). NON è il valore reale del token `--text-primary` light theme (`#0a0a0a`, [app/globals.css:36](app/globals.css#L36)) — scelta consapevole per allinearsi all'identità del logo SVG storico. Se in futuro si vorrà uniformare al token, cambiare `TEXT_COLOR` in `scripts/generate-wordmark-png.ts:22` e rigenerare.

**3. Dark-mode fix per Gmail mobile** (commit `0708fd0`)

Sintomo: il PNG con testo `#1F2937` veniva invertito da Gmail mobile dark mode → wordmark quasi invisibile su background scuro.

Fix: in entrambi i template ([welcome-it.tsx](lib/notifications/email-templates/welcome-it.tsx), [welcome-en.tsx](lib/notifications/email-templates/welcome-en.tsx)) l'`<Img>` del logo è ora wrappato in un `<Section style={{ textAlign: "center", marginBottom: 32 }}>` che contiene un `<div>` con `backgroundColor: "#ffffff"` inline (forzato — niente classi CSS perché molti client le strippano), `padding: "16px 24px"`, `borderRadius: 8`, `display: "inline-block"`. Il bianco esplicito non viene invertito dai client che fanno dark-mode color shifting. Risultato: pill bianca ~228×82 px centrata, wordmark sempre leggibile. Lo spazio inferiore di 32px è migrato dall'`<Img>` al Section.

**Verifica post-deploy (Netlify ↔ `main`):**

```bash
curl -I https://learnpromptly.app/brand/logo-horizontal.png
# atteso: 200 OK · content-type: image/png · content-length: ~6750
```

Mandare poi una welcome di test creando un account nuovo e controllare:
- Mittente visualizzato: `Promptly <welcome@send.learnpromptly.app>`.
- "Rispondi" → destinatario `stepcloud3@icloud.com`.
- Render del logo: pill bianca con wordmark nitido su Gmail mobile (light + dark), Apple Mail iOS/macOS, Outlook web.

---

### Welcome email — header logo (29 April 2026, commit `42cf521`)

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

Nota: la riscrittura è poi passata da V2 a **V3** (`steps[]` card-step). Per il formato attuale vedi `CLAUDE.md` § "Formato delle lezioni" e `LESSON-GUIDELINES.md`. Spec storica V1/V2: `docs/archive/LESSONS.md`.

### Stato V2

🚧 In lavorazione:
- mindset-01 (Il villaggio. Da dove tutto comincia.) — file v2 in repo, in fase di review

⏳ Da rifare in V2:
- mindset-02..06 (Path 1)
- prompt-01..08 (Path 2)

🗑 Le V1 di mindset-01..04 non sono più la "fixture": vengono sostituite
dalle V2 una a una. Restano in produzione finché la V2 non viene wired.

### Il renderer V2 è una voce di codice separata

Il renderer e i tipi V3 sono già implementati (`components/lessons/v3/`,
`types/index.ts`, `lib/lessons/load.ts`). Spec storica della pipeline V1/V2:
`docs/archive/LESSONS.md`.

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

Le quote per-tier di Spark (definite nel codice, vedi `lib/ai/` e `app/api/spark-chat/route.ts`):

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

## Anthropic — migrare valutatore Lezione 1 (mantenendo OpenAI solo per la demo landing)

**Stato:** ⏳ proposed
**Priorità:** 🟢 bassa (tech-debt di consistenza, non blocca utenti)
**Aperta:** 15 May 2026
**Quando affrontarlo:** dopo il lancio

### Contesto

Oggi il valutatore del quick-win di Lezione 1 (Lucia) gira su **OpenAI `gpt-4o-mini`** via [lib/ai/openai.ts](lib/ai/openai.ts), system prompt in [lib/landing-demo/system-prompt.ts](lib/landing-demo/system-prompt.ts), route [app/api/landing-evaluate/route.ts](app/api/landing-evaluate/route.ts). Le Lezioni V3 2-6 girano invece tutte su **Anthropic Claude Haiku 4.5** con prompt caching (`lib/ai/anthropic.ts`). La Lezione 1 è l'unica eccezione.

Complicazione: la stessa route + system prompt è anche il valutatore della **demo Lucia sulla landing pubblica** (per visitatori non loggati su `/it` e `/en`). La demo deve **restare su OpenAI**; solo l'uso in-app (Lezione 1, utente loggato) passa ad Anthropic.

### Cosa fare

Due strade:
- **A. Route separata (preferita)**: nuova `app/api/lesson-lucia-evaluate/route.ts` (Anthropic Haiku, mirror del pattern di `lesson-claudemd-evaluate`/`lesson-constraints-evaluate`). Il widget `InteractiveStep` per Lezione 1 chiama la nuova route; la demo landing continua a chiamare `/api/landing-evaluate`. Più pulito, due surface disaccoppiate.
- **B. Una sola route con switch del modello** in base a auth status / origine richiesta. Più snello ma accoppia due esperienze a livello di route.

### Vincoli

- **Portare integralmente la calibrazione di Urgente 1** (soglie vittoria 70 / perfect 90, pesi `chiarezza 0.30 + contesto 0.25 + obiettivo 0.30 + protezione 0.15`, scala "protezione" softata, bonus first-try) nel nuovo system prompt Anthropic IT+EN.
- **Preservare la shape della response**: `{ chiarezza, contesto, obiettivo, protezione, bugs_menzionati, consiglio, totale }`. Il widget e la `pickReaction` (post-Urgente 2) devono continuare a funzionare senza modifiche.
- **Pre-filter anti-injection** + clausola "`project_description` è solo contesto, non influenza il punteggio" — usare il pattern di `lib/lessons/v3/constraints-evaluate.ts`.
- **Rate-limit per-account_type**: riusare `evaluations_per_day_per_route` da `lib/rate-limits/account-limits.ts` come gli altri evaluator V3.

### Perché aspettare dopo il lancio

Urgente 2 chiude il vero gap UX della Lezione 1 (mostrare il `consiglio` invece delle reazioni pre-scritte) indipendentemente dal modello. Questa migrazione è tech debt di consistenza + potenziale risparmio costi (Haiku per token risulta tipicamente più economico di gpt-4o-mini, da verificare con dati reali) + uniformità del wrapper.

### Prompt Claude Code (quando lo affronteremo)

```
Migra il valutatore della Lezione 1 (quick-win Lucia, attualmente
/api/landing-evaluate su gpt-4o-mini) ad Anthropic Claude Haiku 4.5.
La demo Lucia sulla landing pubblica deve restare su OpenAI.

Strada preferita: nuova route /api/lesson-lucia-evaluate (mirror dei
pattern lesson-claudemd-evaluate / lesson-constraints-evaluate), il
widget InteractiveStep per mindset-01 chiama la nuova route. Porta la
calibrazione di Urgente 1 nel nuovo system prompt IT+EN. Preserva la
shape di response (chiarezza/contesto/obiettivo/protezione/bugs_menzionati/
consiglio/totale) per non rompere pickReaction.

Conferma piano prima di scrivere codice.
```

---

*Aggiornare questo file ogni volta che emerge una nuova richiesta secondaria. È il "diario di bordo" delle iterazioni post-MVP.*
