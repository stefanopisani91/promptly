# PROMPTLY — Auth & Onboarding Brief (archivio)

> **Documento storico.** Il flusso auth (magic link + Google OAuth + callback + link scaduto) e il copy delle schermate sono ancora indicativi della realtà attuale. L'onboarding qui descritto è a 3 step (Nome / Lingua / Daily goal): oggi sono **12 step di profilazione** (Welcome → Name → Experience → Intent → Project → Tools → PreferredTool → Time → Motivation → Recap → Promises → Transition) — vedi `components/onboarding/profiling/steps/`. Per lo stato attuale: [`/CLAUDE.md`](../../CLAUDE.md).
>
> Versione storica 1.0 — 29 April 2026.

---

## Decisioni prese

| Aspetto | Decisione |
|---|---|
| Login email | Magic link (no password) |
| Login social | Google OAuth |
| Onboarding | 3 step: Nome → Lingua → Daily goal |
| Verifica email | Nessuna extra (magic link = auto-verifica) |
| Welcome email | Breve e calda, inviata subito dopo primo signup |
| Schermata auth | Card centrata semplice, una pagina unica `/auth` |
| Demo completion | `?completed_demo=true` → +100 XP + lez 1 di Path 1 segnata completed |
| Permission timing | Push: dopo lez 2 · GDPR AI: prima di Path 3 |
| Link scaduto | Pagina dedicata con email pre-compilata e reinvio |

---

## Routing & file structure

```
app/
├── (auth)/                              # Route group, layout dedicato (no app navbar)
│   ├── auth/page.tsx                    # /auth — login + signup unificato
│   ├── auth/check-email/page.tsx        # /auth/check-email — "abbiamo inviato il link"
│   ├── auth/callback/route.ts           # Callback Supabase per magic link + Google OAuth
│   ├── auth/expired/page.tsx            # /auth/expired — link scaduto, reinvio
│   ├── onboarding/page.tsx              # /onboarding — 3 step state machine
│   └── layout.tsx                       # Layout auth (logo + lang toggle, niente altro)
├── (app)/...                            # già esistente
└── (marketing)/...                      # già esistente

components/
└── auth/
    ├── AuthForm.tsx                     # Email input + Google button
    ├── MagicLinkSent.tsx                # "Controlla la tua email"
    ├── ExpiredLink.tsx                  # Pagina link scaduto
    ├── OnboardingShell.tsx              # State machine + progress dots
    ├── OnboardingStepName.tsx
    ├── OnboardingStepLanguage.tsx
    └── OnboardingStepGoal.tsx

lib/
├── supabase/
│   └── auth.ts                          # signInWithOtp, signInWithOAuth, signOut, getSession
├── notifications/
│   └── email-templates/
│       ├── welcome-it.tsx               # React Email template (Resend)
│       └── welcome-en.tsx
└── analytics/
    └── posthog.ts                       # esteso con eventi auth (vedi sotto)
```

---

## Flusso end-to-end

```
LANDING (CTA "Inizia gratis")
  └→ /auth?source=hero_primary&completed_demo=true
       │
       ├→ User clicca "Continua con Google"
       │    └→ Google OAuth → /auth/callback → check profilo
       │         ├→ Profilo NON esiste → /onboarding (3 step)
       │         └→ Profilo esiste già → /dashboard
       │
       └→ User scrive email + invia magic link
            └→ Email inviata → /auth/check-email
                 │
                 └→ User clicca link nell'email
                      └→ /auth/callback?token=... → check profilo
                           ├→ Token valido + nuovo → /onboarding
                           ├→ Token valido + esistente → /dashboard
                           └→ Token scaduto/usato → /auth/expired

ONBOARDING (3 step state machine)
  Step 1: Nome → Step 2: Lingua → Step 3: Daily goal → /dashboard

DASHBOARD (primo accesso post-onboarding)
  └→ Se ?completed_demo=true alla fine: +100 XP, lez 1 marcata, dashboard mostra welcome card
       └→ Click "Inizia lezione 2" → /lesson/mindset-02
            └→ Lezione 2 completata
                 └→ Prompt "Vuoi che ti ricordi della tua streak? 🔥" → push permission
```

---

## Schermata `/auth`

### Layout
Card centrata sullo schermo, max-width 420px, sfondo `--background`, padding generoso. Logo Promptly in alto, lang toggle in alto a destra (fixed).

### Wireframe testuale

```
┌───────────────────────────────────────┐
│  [Logo PROMPTLY]                      │
│                                       │
│        Inizia a costruire             │
│   con le parole, non col codice.      │
│                                       │
│   ┌─────────────────────────────┐    │
│   │ 🔵  Continua con Google     │    │
│   └─────────────────────────────┘    │
│                                       │
│   ─────────────  o  ─────────────    │
│                                       │
│   Email                               │
│   ┌─────────────────────────────┐    │
│   │ tuonome@esempio.com         │    │
│   └─────────────────────────────┘    │
│                                       │
│   ┌─────────────────────────────┐    │
│   │   Inviami il link →          │    │
│   └─────────────────────────────┘    │
│                                       │
│   Niente password. Ti mandiamo un    │
│   link per entrare al volo.          │
│                                       │
│   ─────────────────────────────       │
│   Continuando, accetti i Termini      │
│   e la Privacy Policy.                │
└───────────────────────────────────────┘
```

### Copy

**Italiano**

```
Headline:        Inizia a costruire con le parole, non col codice.
Google CTA:      Continua con Google
Divider:         o
Email label:     Email
Email placeholder: tuonome@esempio.com
Submit CTA:      Inviami il link →
Reassurance:     Niente password. Ti mandiamo un link per entrare al volo.
Footer fineprint: Continuando, accetti i Termini e la Privacy Policy.

Loading state submit: Sto inviando il link...
Error email malformata: Questa email non sembra valida.
Error generico:       Qualcosa è andato storto. Riprova tra un attimo.
```

**English**

```
Headline:        Start building with words, not code.
Google CTA:      Continue with Google
Divider:         or
Email label:     Email
Email placeholder: yourname@example.com
Submit CTA:      Send me the link →
Reassurance:     No password. We'll send you a link to log in instantly.
Footer fineprint: By continuing, you agree to the Terms and Privacy Policy.

Loading state submit: Sending the link...
Error email malformed: That doesn't look like a valid email.
Error generic:        Something went wrong. Try again in a moment.
```

### Behaviour

- Input email: validation client-side onBlur (regex base + max 254 char). Submit disabled finché non valida.
- Submit: chiama `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '/auth/callback' } })`.
- Google: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`.
- Su submit successo → redirect a `/auth/check-email`.
- Su errore: toast inline sotto input.

### Tracking PostHog

```
auth_page_viewed              { source: utm_source, completed_demo: bool }
auth_method_clicked           { method: 'google' | 'email' }
auth_email_submitted          { has_completed_demo: bool }
auth_email_submit_error       { error_type: 'invalid' | 'rate_limit' | 'unknown' }
```

### Edge cases

- **Rate limiting**: Supabase limita a 4 richieste magic link / 60s per email. Mostra toast "Troppi tentativi, riprova tra un minuto" (IT) / "Too many attempts, try again in a minute" (EN).
- **Email già con Google account**: l'utente prova magic link su email che usa Google. Supabase invia comunque il link, l'utente entra normalmente. Nessun trattamento speciale.

---

## Schermata `/auth/check-email`

### Copy

**Italiano**

```
Titolo:       Controlla la tua email
Sub:          Abbiamo mandato un link a [email]. Cliccaci sopra per entrare.

[Icona email animata o emoji 📨]

Microcopy:    Il link è valido per 15 minuti. Non lo trovi?
              Controlla in spam.

Bottone secondario: Cambia email
```

**English**

```
Title:        Check your email
Sub:          We sent a link to [email]. Click it to log in.

[Email icon or 📨]

Microcopy:    The link is valid for 15 minutes. Can't find it?
              Check your spam folder.

Secondary button: Change email
```

### Behaviour

- Email mostrata in grassetto (presa dal query param o sessione).
- "Cambia email" → torna a `/auth`.
- Nessun reinvio automatico — se vuole un altro link, torna indietro e re-invia (rate limit Supabase si occupa della protezione).
- Niente polling: il magic link apre una nuova sessione nel browser/dispositivo dove viene cliccato. La pagina `check-email` resta com'è.

---

## Schermata `/auth/expired`

Quando il magic link è scaduto, già usato, o malformato.

### Copy

**Italiano**

```
Titolo:    Questo link non funziona più
Sub:       I link magici durano 15 minuti per sicurezza. Te ne mandiamo uno
           nuovo subito.

Email:     [pre-compilata se la conosciamo, altrimenti vuota]

Bottone:   Reinvia il link →

Link sotto: Usa Google invece
```

**English**

```
Title:     This link doesn't work anymore
Sub:       Magic links expire after 15 minutes for security. We'll send you
           a fresh one right away.

Email:     [pre-filled if we have it, empty otherwise]

Button:    Resend the link →

Link below: Use Google instead
```

### Behaviour

- Se possibile, l'email del tentativo precedente viene passata via cookie (`auth_email`, scadenza 30 min) o query param.
- Submit re-invia magic link e va a `/auth/check-email`.
- "Usa Google invece" → ritorna a `/auth` con focus su Google CTA.

### Tracking PostHog

```
auth_link_expired_viewed     { had_email: bool }
auth_link_resent             { from: 'expired_page' }
```

---

## Onboarding — 3 step

### Layout shell (comune ai 3 step)

Card centrata, max-width 480px. In alto: progress dots `● ○ ○`, `● ● ○`, `● ● ●`. In basso: bottone "Continua →" o "Inizia →" all'ultimo step.

Non ha bottone "Indietro" — l'onboarding è veloce, niente friction. Se l'utente chiude la finestra, al prossimo accesso riparte da dove ha lasciato (state in DB, non in URL).

### Step 1 — Nome

**Italiano**

```
Eyebrow:     STEP 1 DI 3
Titolo:      Come ti chiamiamo?
Sub:         Vediamo il tuo nome quando torni. Niente di formale.

Input label: Nome
Placeholder: Es. Stefano
Bottone:     Continua →
```

**English**

```
Eyebrow:     STEP 1 OF 3
Title:       What should we call you?
Sub:         We'll greet you by name when you come back. No formal.

Input label: Name
Placeholder: e.g. Stefano
Button:      Continue →
```

**Logica**
- Pre-fill se presente da Google OAuth (`given_name` da `user.user_metadata.full_name`).
- Validazione: 1-40 caratteri, no caratteri speciali strani (regex `/^[\p{L}\p{N}\s\-']+$/u`).
- Submit → salva in `users.full_name`, vai a step 2.

### Step 2 — Lingua

**Italiano**

```
Eyebrow:     STEP 2 DI 3
Titolo:      In che lingua vuoi imparare?
Sub:         Puoi cambiarla in qualsiasi momento dalle impostazioni.

[Bottone radio grande] 🇮🇹  Italiano
[Bottone radio grande] 🇬🇧  English

Bottone:     Continua →
```

**English**

Stessa identica struttura ma microcopy in inglese.

**Logica**
- Pre-fill con `Accept-Language` del browser (default `en` se non IT).
- Submit → salva in `users.language`, vai a step 3.
- Se cambia lingua qui, le schermate seguenti dell'onboarding switchano subito.

### Step 3 — Daily goal

**Italiano**

```
Eyebrow:     STEP 3 DI 3
Titolo:      Quanto tempo vuoi dedicarci ogni giorno?
Sub:         Le streak partono da qui. Tranquillo, puoi cambiarla quando vuoi.

[Card cliccabile]  🌱 Solo un assaggio
                   5 minuti al giorno · ~1 lezione breve

[Card cliccabile]  📘 Progresso costante     [DEFAULT pre-selected]
                   10 minuti al giorno · ~1-2 lezioni

[Card cliccabile]  🚀 Massima concentrazione
                   15 minuti al giorno · ~2-3 lezioni

Bottone:     Inizia a imparare →
```

**English**

```
Eyebrow:     STEP 3 OF 3
Title:       How much time can you dedicate daily?
Sub:         Your streak starts here. Don't worry, you can change it anytime.

[Card]   🌱 Just a taste
         5 min/day · ~1 short lesson

[Card]   📘 Steady progress     [DEFAULT]
         10 min/day · ~1-2 lessons

[Card]   🚀 Full focus
         15 min/day · ~2-3 lessons

Button:  Start learning →
```

**Logica**
- Card pre-selezionata: `easy` (10 min). È il default più safe.
- Submit → salva in `users.daily_goal`, crea record DB se non esiste, redirect a `/dashboard?welcome=true&completed_demo=...`.

### Tracking PostHog

```
onboarding_started              { from_provider: 'email' | 'google' }
onboarding_step_completed       { step: 1 | 2 | 3, value: string }
onboarding_completed            { name_set: bool, language: 'it' | 'en', goal: 'trivial' | 'easy' | 'pro', total_seconds: number }
```

---

## Welcome email (Resend + React Email)

### Quando

Inviata UNA SOLA VOLTA, immediatamente dopo il completamento dell'onboarding. Mai sui login successivi.

Trigger: Supabase webhook `on auth.users INSERT` → edge function → Resend.

### Contenuto (italiano)

```
From:    Promptly <ciao@learnpromptly.app>
Subject: Benvenuto in Promptly, [nome] 🧠

[Logo Promptly in alto, dimensione contenuta]

Ciao [nome],

Sono contento di averti qui.

Promptly ti insegna a costruire con le parole — niente codice
da scrivere, solo prompt da pensare bene. Le prime 14 lezioni
sono gratis e bastano per iniziare a vedere risultati veri.

Il consiglio: comincia oggi, anche solo 5 minuti. La streak
parte dal primo giorno.

[Bottone arancione: Vai alla prima lezione →]

Se hai domande, basta rispondere a questa email.

A presto,
[Firma founder o "Il team Promptly"]

──────────
Stai ricevendo questa email perché ti sei iscritto a Promptly.
[Link unsubscribe] · [Privacy] · [Termini]
```

### Contenuto (english)

```
From:    Promptly <hello@learnpromptly.app>
Subject: Welcome to Promptly, [name] 🧠

[Promptly logo at top, modest size]

Hi [name],

Glad to have you here.

Promptly teaches you to build with words — no code to write,
just prompts to think well. The first 14 lessons are free and
enough to start seeing real results.

My tip: start today, even just 5 minutes. The streak begins
on day one.

[Orange button: Go to your first lesson →]

If you have any questions, just reply to this email.

See you soon,
[Founder signature or "The Promptly team"]

──────────
You're receiving this email because you signed up for Promptly.
[Unsubscribe] · [Privacy] · [Terms]
```

### Visual / template

- Sfondo `#F8F7F4`, container bianco max-width 560px, padding 32px.
- Bottone CTA con `bg-primary (#E8703F)`, testo bianco, padding generoso, rounded.
- Footer in `text-muted` piccolo.
- Mobile-friendly (single column, max-width responsive).
- Implementato con `react-email` per type-safety + `Resend.send()`.

---

## Welcome card in dashboard (post-onboarding)

Mostrata SOLO la prima volta che l'utente atterra in dashboard dopo onboarding. Tracciata via `users.welcome_seen_at`.

### Caso A — utente normale (no demo completion)

```
🎉 Benvenuto in Promptly!
Inizia con la prima lezione: "Cos'è il vibe coding?"

[Bottone: Inizia →]
```

### Caso B — utente con `?completed_demo=true`

```
🎉 Bentornato — la demo conta!
Hai già fatto la prima lezione di Path 1. Ti regaliamo +100 XP.

[Bottone: Vai alla lezione 2 →]
```

E al primo render: confetti + XP toast `+100 XP ⚡`.

In DB:
- `users.total_xp += 100`
- `user_progress` insert per `mindset-01` con `completed=true, attempts=1, xp_earned=100, completed_at=now()`
- `users.welcome_seen_at = now()`

---

## Permission lazy timing

### Push notification

**Quando**: alla fine della lezione 2 di Path 1 (`mindset-02`), DOPO l'XP toast e PRIMA del bottone "Prossima lezione".

**Italiano**:
```
🔥 Vuoi mantenere la streak?
Ti mando un piccolo promemoria alle 18 se non hai ancora
completato la lezione di oggi. Niente spam, promesso.

[Bottone primario: Sì, ricordamelo]
[Link secondario: Forse più tardi]
```

**English**:
```
🔥 Want to keep your streak alive?
I'll send a tiny reminder at 6 PM if you haven't completed
today's lesson yet. No spam, promise.

[Primary button: Yes, remind me]
[Secondary link: Maybe later]
```

**Logica**:
- Click "Sì": `Notification.requestPermission()` → se granted → `pushManager.subscribe()` → salva subscription in `users.push_subscription`.
- Click "Forse più tardi": `users.push_prompted_at = now()`. Riproponiamo dopo 7 giorni.
- Se l'utente nega permission a livello browser: la prossima volta non riproponiamo automaticamente, solo via Settings.

### GDPR consent (AI evaluation)

**Quando**: alla prima volta che l'utente apre una lezione di Path 3 (Pro tier). Prima di mostrare il contenuto.

**Italiano**:
```
Permesso per la valutazione AI

Per dare feedback sui tuoi prompt liberi userò un servizio
esterno (DeepSeek). Il tuo prompt viene inviato lì, valutato,
e il feedback torna nell'app.

Il prompt non viene salvato dal servizio esterno. Se preferisci,
puoi rivedere questo consenso in qualsiasi momento dalle impostazioni.

[Bottone primario: Acconsento, procedi]
[Link secondario: Non ora]
```

**English**:
```
AI evaluation consent

To give you feedback on your free-form prompts, I use an external
service (DeepSeek). Your prompt is sent there, evaluated, and the
feedback comes back into the app.

The prompt is not stored by the external service. You can revoke
this consent anytime from settings.

[Primary button: Consent and continue]
[Secondary link: Not now]
```

**Logica**:
- Click "Acconsento": `users.consent_ai_eval = true`. Continua alla lezione.
- Click "Non ora": resta su dashboard. Riproposto al prossimo accesso a Path 3.

---

## Source tracking & UTM

I CTA della landing arrivano a `/auth` con query param diversi:

| Sorgente landing | Query param |
|---|---|
| Hero primary | `?source=hero_primary` |
| Hero secondary (post-demo) | `?source=hero_secondary&completed_demo=true` |
| Curriculum CTA | `?source=curriculum` |
| Closing CTA | `?source=closing` |
| Header bottone | `?source=header` |

Salvati in `users.signup_source` al momento della creazione del profilo. Utile per:
- Funnel analytics (PostHog: quale CTA converte di più)
- Email welcome personalizzato (in v2)

---

## Database — schema implications

Aggiunte/modifiche ai types in `types/index.ts`:

```typescript
export interface UserProfile {
  // ...campi esistenti...
  signup_source: string | null         // es. 'hero_primary', 'closing', 'google_direct'
  welcome_seen_at: string | null       // ISO datetime — quando ha visto la welcome card
  push_prompted_at: string | null      // ISO datetime — ultima volta che abbiamo chiesto push
  ai_eval_prompted_at: string | null   // idem per consent GDPR
  onboarding_completed_at: string | null
}
```

SQL migration (`supabase/migrations/[timestamp]_auth_fields.sql`):

```sql
alter table users add column if not exists signup_source text;
alter table users add column if not exists welcome_seen_at timestamptz;
alter table users add column if not exists push_prompted_at timestamptz;
alter table users add column if not exists ai_eval_prompted_at timestamptz;
alter table users add column if not exists onboarding_completed_at timestamptz;
```

---

## Eventi PostHog (taxonomy completa auth)

```
auth_page_viewed                 { source, completed_demo, lang }
auth_method_clicked              { method }
auth_email_submitted             { has_completed_demo }
auth_email_submit_error          { error_type }
auth_link_expired_viewed         { had_email }
auth_link_resent                 { from }
auth_callback_received           { provider, is_new_user }

onboarding_started               { from_provider }
onboarding_step_viewed           { step: 1 | 2 | 3 }
onboarding_step_completed        { step, value }
onboarding_completed             { name_set, language, goal, total_seconds }

welcome_card_viewed              { has_demo_bonus }
welcome_card_cta_clicked

push_prompt_shown                { trigger: 'after_lesson_2' }
push_prompt_response             { response: 'accepted' | 'maybe_later', browser_granted }
ai_eval_prompt_shown             { trigger: 'first_path3_lesson' }
ai_eval_prompt_response          { response }
```

Funnel chiave da impostare D1:
1. `auth_page_viewed → auth_email_submitted → auth_callback_received → onboarding_completed`
2. `onboarding_completed → first_lesson_started → first_lesson_completed`
3. `lesson_2_completed → push_prompt_shown → push_prompt_response`

---

## Implementation checklist (per Claude Code)

### Setup Supabase
- [ ] Configura magic link in Supabase Auth: redirect URL = `/auth/callback`, email expiry = 15 min
- [ ] Configura Google OAuth: client ID + secret in Supabase, redirect URL allowlisted
- [ ] Configura email template di Supabase per il magic link (subject + body brand-allineato — IT + EN)
- [ ] Migration SQL per i nuovi campi `users` (vedi sopra)
- [ ] RLS policies su `users` (un utente vede solo la propria riga)
- [ ] Webhook trigger `on auth.users INSERT` → edge function `handle-new-user` (crea profilo + invia welcome email)

### Setup Resend
- [ ] Account Resend + dominio verificato (`learnpromptly.app`)
- [ ] Template welcome IT + EN con `react-email`
- [ ] Edge function `send-welcome-email` chiamata dal webhook

### Pages & components
- [ ] `(auth)/layout.tsx` con logo + lang toggle, niente altro
- [ ] `/auth/page.tsx` con `<AuthForm />`
- [ ] `/auth/check-email/page.tsx`
- [ ] `/auth/callback/route.ts` — handler che:
  1. Riceve token Supabase, scambia per sessione
  2. Verifica se profilo esiste (`select * from users where id = ?`)
  3. Se non esiste → redirect `/onboarding?source=...&completed_demo=...`
  4. Se esiste e onboarding completato → redirect `/dashboard`
  5. Se esiste ma onboarding NON completato → redirect `/onboarding`
  6. Se token scaduto/invalido → redirect `/auth/expired?email=...`
- [ ] `/auth/expired/page.tsx`
- [ ] `/onboarding/page.tsx` con state machine (3 step, no URL routing intermedio)
- [ ] Welcome card nel `/dashboard` condizionale su `welcome_seen_at IS NULL`

### Demo bonus logic
- [ ] In `/auth/callback`: se `completed_demo=true` query param → flag in cookie/session
- [ ] Alla fine onboarding: se flag → +100 XP, insert `user_progress` per `mindset-01`, set flag su welcome card
- [ ] Welcome card: rendering condizionale Caso A vs Caso B

### Permission prompts
- [ ] Componente `<PushPermissionPrompt />` mostrato dopo `lesson_completed` se: `path_slug=mindset && lesson_order=2 && !push_subscription && !push_prompted_at`
- [ ] Componente `<AIEvalConsentPrompt />` mostrato all'apertura prima lezione Path 3 se `!consent_ai_eval`

### Analytics
- [ ] Wire eventi PostHog auth (sopra)
- [ ] Funnel preconfigurato in PostHog dashboard

### Test
- [ ] Magic link con email valida → check-email → callback → onboarding → dashboard
- [ ] Magic link scaduto manualmente → expired page → reinvio → check-email
- [ ] Google OAuth flow completo
- [ ] Onboarding con back/forward del browser (deve resistere)
- [ ] Demo completion: signup con `?completed_demo=true` → +100 XP visibile
- [ ] Switch lingua durante onboarding → step successivo in lingua nuova
- [ ] Welcome email arriva (testare con Resend test mode)
- [ ] Push prompt appare DOPO lez 2, non prima
- [ ] `welcome_seen_at` settato correttamente, no doppio prompt al login successivo

### Sicurezza
- [ ] CSRF protection su `/auth/callback`
- [ ] Rate limiting su `signInWithOtp` lato Supabase (default 4/min, OK)
- [ ] Cookie `auth_email` httpOnly + secure + max-age=1800
- [ ] Validazione server-side di TUTTI i query param (`source`, `completed_demo`)
- [ ] No PII (Personally Identifiable Information) in URL post-callback

---

*Brief versione 1.0 — quando sei pronto, dai a Claude Code: "Implementa auth + onboarding seguendo `AUTH.md` e `PROMPTLY.md`. Inizia dalla schermata `/auth` e dalla configurazione Supabase. Conferma il piano prima di toccare codice."*
