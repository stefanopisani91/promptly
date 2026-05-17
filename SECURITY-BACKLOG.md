# SECURITY-BACKLOG.md

> Cose di sicurezza/igiene operativa che NON sono urgenti ma vanno
> rifatte/migliorate quando c'è tempo. Priorità interne (non legate alla
> roadmap di prodotto). Aggiornare ogni volta che emerge una nuova voce.
>
> Versione 1.0 — 2 May 2026.

---

## Convenzioni del file

- 🟢 **bassa** — fix consigliato ma il rischio attuale è cappato.
- 🟡 **media** — non c'è incidente in corso, ma se ci fosse un leak il danno scalerebbe.
- 🔴 **alta** — esposizione attiva, fix appena possibile.

Quando una voce è chiusa: cambia stato in ✅ done e spostala in fondo.
Niente cancellazioni: serve la cronologia.

---

## 1. 🟢 OpenAI API key non scoped

**Stato:** ⏳ pending
**Priorità:** 🟢 bassa
**Aperta:** 2 May 2026

### Contesto

La chiave OpenAI (`OPENAI_API_KEY`) è stata generata con permission **All**
invece di **Restricted → Model capabilities → Write**. Funziona, ma se
trapelasse darebbe accesso anche a Files, Assistants, Threads, Fine-tuning,
Vector Stores, Prompts, Datasets, Videos, Evals.

### Perché bassa priorità

- Modello prepagato (no addebito automatico sulla carta finché c'è credito).
- Project budget cap = $10/mese (muro indipendente dal saldo).
- La chiave vive solo in `.env.local` (gitignored sul Mac di Stefano) e
  in Netlify environment variables (cifrate, marked sensitive).
- Worst case in caso di leak: $10 bruciati in finestre orarie, con email
  di warning a $5.

### Fix (2 minuti quando se ne ha voglia)

1. https://platform.openai.com/api-keys → trova la chiave "Promptly" → tre puntini → **Revoke**
2. **+ Create new secret key** → Name `Promptly v2` → **Restricted** → spunta solo `Model capabilities → Write` → Save
3. Copia la nuova chiave
4. Aggiorna `.env.local` riga `OPENAI_API_KEY=` con la nuova chiave
5. Riavvia `npm run dev`
6. Aggiorna Netlify env var `OPENAI_API_KEY` con la nuova chiave (pannello → Site configuration → Environment variables → edit → paste → save)
7. Trigger un nuovo deploy su Netlify (Deploys → Trigger deploy → Clear cache and deploy site) altrimenti la nuova chiave non arriva nelle Edge Functions.

---

## 2. 🟢 Rotation policy delle chiavi (preventiva)

**Stato:** ⏳ pending
**Priorità:** 🟢 bassa

### Contesto

Tutte le chiavi attive (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`GOOGLE_OAUTH_CLIENT_SECRET`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`
quando attiva, `STRIPE_SECRET_KEY` quando attiva) andrebbero ruotate
periodicamente, anche senza incidenti, per ridurre la finestra di
esposizione storica.

### Cosa fare

- Stabilire una cadenza: ogni 6 mesi rotation completa, ogni 12 mesi rotation di tutte le chiavi insieme (più disruption ma copre tutto).
- Tenere un registro qui sotto delle date di rotation.

| Chiave | Ultima rotation | Prossima rotation prevista |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | mai (creata 29 Apr 2026) | 29 Oct 2026 |
| `RESEND_API_KEY` | mai (creata Apr 2026) | Oct 2026 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | mai (creata Apr 2026) | Oct 2026 |
| `OPENAI_API_KEY` | nuova (creata 2 May 2026) | 2 Nov 2026 |

### Fix automatico

Per ora niente automazione. Da fare a mano. In futuro si può aggiungere
una scheduled task che notifica via email quando una chiave si avvicina
alla data di rotation.

---

## 3. 🟢 Audit periodico delle env vars

**Stato:** ⏳ pending
**Priorità:** 🟢 bassa

### Cosa fare

Una volta al trimestre:

1. Confrontare `.env.example` (cosa il codice si aspetta) con `.env.local` (cosa hai in locale) e con la lista env di Netlify (cosa è in produzione). Le tre liste devono coincidere come set di chiavi.
2. Per ogni chiave: il servizio è ancora in uso? Se no, revoca + rimuovi dalla `.env.local` + rimuovi da Netlify + rimuovi dal `.env.example`.
3. Verificare che nessuna chiave abbia il prefisso `NEXT_PUBLIC_` se non strettamente necessario (quel prefisso esporrebbe il valore al bundle JavaScript del browser).

### Comando di sanity per il leak check

Da terminale, dentro il repo:

```bash
# Cerca eventuali leak di chiavi tipiche nel codice e nei docs
grep -rE "sk-(proj-|live_|test_)|re_|GOCSPX-|eyJhbGc" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude=".env.local" .
```

L'output deve essere vuoto. Se non lo è, **la chiave trovata va
revocata immediatamente** e rifatta.

---

## 4. 🟢 Marcare tutte le env "sensitive" su Netlify

**Stato:** ⏳ pending
**Priorità:** 🟢 bassa

### Contesto

Quando si aggiunge una env var su Netlify c'è un toggle "Contains
secret values" / "Sensitive variable". Se attivato, dopo il primo
salvataggio il valore diventa offuscato anche per il proprietario (solo
update/delete, non re-read). Riduce il rischio di leak da screenshot
delle Site settings.

### Cosa fare

Aprire ogni env var su Netlify e verificare il flag. Quelle che NON sono
segreti (es. `OPENAI_MODEL`, `NEXT_PUBLIC_*`, `RESEND_FROM_EMAIL`,
`VAPID_SUBJECT`, `NEXT_PUBLIC_SITE_URL`) possono restare normali. Tutto
il resto: sensitive.

| Env var | Sensitive? |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ deve essere |
| `OPENAI_API_KEY` | ✅ deve essere |
| `RESEND_API_KEY` | ✅ deve essere |
| `GOOGLE_OAUTH_CLIENT_SECRET` | ✅ deve essere |
| `STRIPE_SECRET_KEY` (quando attiva) | ✅ deve essere |
| `STRIPE_WEBHOOK_SECRET` (quando attiva) | ✅ deve essere |
| `VAPID_PRIVATE_KEY` (quando attiva) | ✅ deve essere |
| `DEEPSEEK_API_KEY` (quando attiva) | ✅ deve essere |
| `NEXT_PUBLIC_*` (qualunque) | ❌ no, sono per il browser per definizione |
| `OPENAI_MODEL` | ❌ no, è solo `gpt-4o-mini` |
| `RESEND_FROM_EMAIL` | ❌ no |
| `VAPID_SUBJECT` | ❌ no |

---

## 5. 🟢 Restringere `OPENAI_API_KEY` ai soli modelli usati a livello Project

**Stato:** ⏳ pending (parte naturale del fix #1, oppure da fare a parte)
**Priorità:** 🟢 bassa

### Contesto

Anche con una chiave scoped a "Model capabilities → Write", in teoria
può chiamare qualunque modello accessibile al Project (gpt-4o, o1,
ecc.). Il codice di Promptly usa solo `gpt-4o-mini` (variabile
`OPENAI_MODEL`), ma se qualcuno cambiasse quella variabile in errore,
potrebbe bruciare credito su modelli più costosi.

### Fix

1. Vai su https://platform.openai.com/settings/organization/projects
2. Seleziona Project Promptly
3. **Settings → Model usage** (o nome simile, sezione che limita quali modelli il Project può chiamare)
4. Whitelist solo `gpt-4o-mini`

In questo modo anche un'eventuale modifica di `OPENAI_MODEL` a un
modello più costoso fallirebbe lato Project, indipendentemente dalla
chiave.

---

## 6. 🟡 Privacy policy — disclosure OpenAI / Anthropic / Supabase / Resend

**Stato:** 🚧 parzialmente risolto (17 May 2026) — banner cookie iubenda + privacy policy generata sono live, ma serve verificare manualmente sulla dashboard iubenda che TUTTI i data processor effettivi siano elencati.
**Priorità:** 🟡 media (era 🟢 bassa quando il problema era "manca la policy"; ora è "verifica che la policy generata copra tutti i processor").

### Contesto

Le risposte degli utenti vengono inviate a diversi processor esteri:
- **OpenAI** (USA) — risposte aperte V2 + demo Lucia + quick-win lezione 1 (gpt-4o-mini)
- **Anthropic** (USA) — chat Spark + evaluator V3 lezioni 2-6 (Claude Haiku 4.5)
- **Supabase** (DB in EU, ma org in USA) — auth, progress, XP, streak
- **Resend** (USA) — welcome email + future reminder
- **PostHog** (istanza EU, org in USA) — analytics, gated sul consenso
- **DeepSeek** (Cina) — pianificato per Path 3-5, non ancora wired

Il GDPR richiede di disclosure questi trasferimenti.

### Cosa è già fatto (17 May 2026, commit `2417743`)

- ✅ **Banner cookie iubenda live in produzione** (account `learnpromptly.app`, piano Advanced). Vedi BACKLOG.md "Urgente 0".
- ✅ **Privacy Policy + Cookie Policy + T&C generate da iubenda** e linkate dal footer marketing in IT (policy `64451899`) e EN (`23626902`).
- ✅ **PostHog gated sul consenso** (categoria Misurazione = id 4 nel widget). Nessun analytics pre-consenso.

### Cosa resta da verificare (10 minuti sulla dashboard iubenda)

Loggarsi su iubenda → seleziona learnpromptly.app → Privacy Policy → "Servizi attivati" e confermare che siano presenti almeno:
1. **OpenAI** — per il commento alle risposte V2 + demo Lucia + quick-win lezione 1
2. **Anthropic Claude** — per la chat Spark e gli evaluator V3 (lezioni 2-6)
3. **Supabase** — per database + auth
4. **Resend** — per le email transazionali (welcome attiva, reminder pianificata)
5. **PostHog** — per gli analytics (già nella Cookie Policy via categoria Misurazione, controllare che sia anche nella Privacy Policy)
6. Se mancano, aggiungerli dal catalogo iubenda. Iubenda genera automaticamente il testo legale.

### Cosa resta da fare quando si attiverà DeepSeek (Path 3-5, Pro tier)

- Aggiungere DeepSeek alla privacy policy iubenda (data processor in Cina — richiede menzione specifica).
- Considerare se per gli utenti Pro serve un consenso esplicito aggiuntivo al primo prompt verso DeepSeek (one-time modal). DeepSeek non è attualmente ancora wired (vedi CLAUDE.md), quindi non è urgente.

### Cosa NON serve più

- ~~Aggiornare la consent flow al primo uso di una lezione V2 (banner one-time)~~ — sostituito dal banner cookie iubenda che cattura il consenso una volta sola per visita.
- ~~Considerare un opt-out alternativo (lezione fruibile senza commento AI)~~ — l'utente può negare la categoria Misurazione e continuare; l'AI delle lezioni resta funzionale perché è "Necessario" / "Funzionalità", non Marketing/Tracking.

---

## 7. 🟡 Rate-limit per-utente sull'endpoint `/api/comment-answer`

**Stato:** ⏳ pending
**Priorità:** 🟡 media (diventa 🔴 alta in caso di traffico organico significativo)
**Aperta:** 2 May 2026

### Contesto

L'endpoint `app/api/comment-answer/route.ts` chiama OpenAI per ogni
risposta aperta inviata da un utente loggato in una lezione V2. Oggi
**non c'è rate-limit per-utente**: il muro è solo il budget cap di $10
del Project OpenAI.

Scenario peggiore con il setup attuale: un singolo utente loggato che
spamma submit consuma tutto il budget mensile in poche ore. Anche se non
è "leak", è downtime per tutti gli altri utenti finché non ricarichi.

### Fix

1. Nuova migration Supabase per `ai_usage_log`:
   ```sql
   create table public.ai_usage_log (
     id bigserial primary key,
     user_id uuid not null references public.users(id) on delete cascade,
     endpoint text not null,                     -- es. 'comment-answer'
     occurred_at timestamptz not null default now()
   );
   create index ai_usage_log_user_endpoint_day_idx
     on public.ai_usage_log (user_id, endpoint, occurred_at desc);
   alter table public.ai_usage_log enable row level security;
   create policy "ai_usage_log_select_own" on public.ai_usage_log
     for select using (auth.uid() = user_id);
   create policy "ai_usage_log_insert_own" on public.ai_usage_log
     for insert with check (auth.uid() = user_id);
   ```

2. In `app/api/comment-answer/route.ts`, prima di chiamare OpenAI:
   ```ts
   // Count last 24h
   const { count } = await supabase
     .from('ai_usage_log')
     .select('*', { count: 'exact', head: true })
     .eq('user_id', user.id)
     .eq('endpoint', 'comment-answer')
     .gte('occurred_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
   if ((count ?? 0) >= 30) {
     return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
   }
   ```

3. Dopo la chiamata OpenAI riuscita, insert nel log:
   ```ts
   await supabase.from('ai_usage_log').insert({
     user_id: user.id,
     endpoint: 'comment-answer',
   });
   ```

4. Lato client `OpenQuestion.tsx`: gestire 429 con messaggio dedicato ("hai esaurito le risposte di oggi, torna domani") invece del generico apiError.

5. Aggiungere la copy 429 in `lib/i18n/lessons.ts` (IT + EN).

### Nota sul valore 30/giorno

Scelto come stima di "uso normale": un utente attivo fa 1-2 lezioni al
giorno, ognuna con 2-3 open_question. 30 copre 10x quel volume per
permettere "rispondi e cancella e riprova" senza frustrare. Ricalibrare
dopo 30 giorni di dati reali.

---

## 8. 🟢 Logging — niente env vars nei log

**Stato:** ⏳ pending
**Priorità:** 🟢 bassa

### Cosa controllare

Una volta al mese, fare grep su `console.log`, `console.error`,
`console.warn` in tutto il codice e verificare che nessuno stampi
oggetti che potrebbero contenere `process.env.*` o body di API request
con chiavi/header di auth. Stessa cosa quando integreremo Sentry o
qualsiasi error reporter: filtrare i campi sensibili nei breadcrumb e
negli error contexts prima di mandarli al provider.

```bash
grep -rn "console\.\(log\|error\|warn\).*process\.env" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git .
```

Output vuoto = OK.

---

## 9. 🟢 Rotazione `OPENAI_API_KEY` — esposizione in conversazione Claude

**Stato:** ⏳ pending
**Priorità:** 🟢 bassa
**Aperta:** 5 May 2026

### Contesto

Durante la sessione di vibe coding del 5 May 2026 (passaggio di Spark ad
Anthropic), il valore completo di `OPENAI_API_KEY` è transitato nel context
della conversazione Claude almeno 3 volte:

1. Lettura iniziale di `.env.local` per esplorare il progetto.
2. Re-lettura di `.env.local` dopo aggiunta della sezione Anthropic.
3. Lettura delle env vars Netlify via MCP — il `dev` context ritornava il
   valore non mascherato.

L'assistant non ha mai trascritto la chiave nel proprio output di testo
(sempre referenziata in forma abbreviata), ma i tool result fanno comunque
parte del log della conversazione.

### Perché bassa priorità

- Modello prepagato OpenAI (no addebito automatico sulla carta).
- Project budget cap $10/mese.
- La conversazione gira sull'infrastruttura Anthropic, non è pubblica.
- Stessa key è già destinata a essere ruotata e scoped (vedi voce #1) —
  questa task è un'occasione per chiudere entrambe insieme.

### Fix (5 minuti)

Combina questa task con la voce #1 (scope a `Model capabilities → Write`)
e #5 (whitelist modello a livello Project) — un giro solo.

1. https://platform.openai.com/api-keys → revoca `la vecchia chiave`
2. Crea nuova key Restricted (vedi voce #1) → name `Promptly v3`
3. Aggiorna in 2 posti:
   - `.env.local` riga `OPENAI_API_KEY=` → riavvia `npm run dev`
   - Netlify → Environment variables → `OPENAI_API_KEY` context
     **production** → paste nuovo valore → save. **Lasciare vuoti** gli
     altri context (`deploy-preview`, `branch-deploy`, `dev`,
     `dev-server`) come già configurato 5 May 2026.
4. Netlify → Deploys → Trigger deploy → **Clear cache and deploy site**
5. Dopo deploy "Published": testa una risposta aperta in una lezione V2 e
   prova la demo Lucia sulla landing — entrambe devono rispondere.
6. Aggiorna la tabella di rotation in voce #2 con la nuova data.

### Nota — perché Anthropic NON ha questo issue

`ANTHROPIC_API_KEY` è già stata ruotata il 5 May 2026 (l'utente l'ha
revocata + rigenerata dopo aver notato un'esposizione equivalente nello
stesso flusso). Buona prassi: stesso passo per OpenAI quando c'è tempo.

---

*File creato 2 May 2026. Aggiornare ogni volta che emerge una nuova voce.*
