# PROMPTLY — Landing Page Brief

> Brief completo per l'implementazione della landing page pubblica di Promptly.
> Da leggere insieme a `PROMPTLY.md` (single source of truth) e `assets/README.md` (brand assets).
> Versione 1.0 — 29 April 2026.

---

## Contesto strategico (decisioni già prese)

| Aspetto | Decisione |
|---|---|
| Obiettivo primario | Signup gratuito (account → Path 1+2 free) |
| Target prioritario | Beginner non-tech (marketer, designer, freelancer, curiosi) |
| Tono di voce | Caldo & rassicurante (non condiscendente, no hype) |
| Angolo headline | Promessa di trasformazione |
| Pricing | Nascosto in landing (CTA = "Inizia gratis"), Pro scoperto dopo signup |
| Lingue | EN + IT con toggle, URL `/en/` e `/it/`, auto-detect Accept-Language |
| Hero | Mockup app interattivo (screenshot animato della prima lezione) |
| Esempio esercizio | Mini fill-in-the-blank giocabile inline, senza signup |
| Social proof | 1-2 endorsement esperti + counter "[n] studenti early access" |
| Founder story | Esclusa |
| FAQ | 10-12 domande |
| Closing | Repeat CTA + footer essenziale |

---

## Routing & file structure

```
app/
├── (marketing)/                         # Route group, no layout app
│   ├── [lang]/                          # Dynamic segment: en | it
│   │   ├── page.tsx                     # Landing principale
│   │   ├── privacy/page.tsx             # Privacy policy
│   │   ├── terms/page.tsx               # Terms of service
│   │   └── layout.tsx                   # Marketing layout (header + footer)
│   └── page.tsx                         # Redirect logic basata su Accept-Language
├── (auth)/...                           # già esistente
└── (app)/...                            # già esistente

components/
└── marketing/                           # Componenti landing only
    ├── MarketingHeader.tsx              # Logo, lang toggle, "Login" + "Start free"
    ├── MarketingFooter.tsx
    ├── HeroSection.tsx
    ├── ProblemSection.tsx
    ├── SolutionSection.tsx
    ├── CurriculumPreview.tsx
    ├── InteractiveExerciseDemo.tsx      # Esercizio giocabile standalone
    ├── SocialProofSection.tsx
    ├── FAQSection.tsx
    ├── ClosingCTA.tsx
    └── LangSwitcher.tsx
```

**Implementation note**: la landing **non** condivide il layout autenticato. Header e footer sono diversi (es. niente streak/XP). Usare un route group separato `(marketing)`.

---

## Architettura della pagina (7 sezioni + header + footer)

```
┌─────────────────────────────────────────────────┐
│ HEADER: logo + lang toggle + Login + Start free  │
├─────────────────────────────────────────────────┤
│ 1. HERO                                          │
│    Headline + sub + CTA + mockup app             │
├─────────────────────────────────────────────────┤
│ 2. PROBLEMA                                      │
│    "Hai un'idea ma..." 3 pain point              │
├─────────────────────────────────────────────────┤
│ 3. SOLUZIONE / COME FUNZIONA                     │
│    3 step con icone (impara → prova → costruisci)│
├─────────────────────────────────────────────────┤
│ 4. CURRICULUM PREVIEW                            │
│    Le 5 path con icone + lessons count           │
├─────────────────────────────────────────────────┤
│ 5. ESERCIZIO LIVE                                │
│    Mini fill-in-the-blank giocabile              │
├─────────────────────────────────────────────────┤
│ 6. SOCIAL PROOF                                  │
│    Endorsement + early access counter            │
├─────────────────────────────────────────────────┤
│ 7. FAQ                                           │
│    10-12 domande, accordion                      │
├─────────────────────────────────────────────────┤
│ 8. CLOSING CTA                                   │
│    Repeat headline + CTA + reminder "no carta"   │
├─────────────────────────────────────────────────┤
│ FOOTER: privacy, terms, contatto, social, lang  │
└─────────────────────────────────────────────────┘
```

---

## 1. Hero Section

### Layout
Desktop: split 60/40 — testo a sinistra, mockup a destra.
Mobile: stack verticale, mockup sotto il testo.

### Copy

**Italiano**

```
Eyebrow:    IMPARA A USARE L'AI PER COSTRUIRE
Headline:   Trasforma le tue idee in app vere.
            Senza scrivere una riga di codice.
Sub:        Promptly ti insegna a parlare con l'AI per costruire
            software vero. Lezioni brevi, esercizi pratici,
            risultati che vedi crescere ogni giorno.
CTA primary:   Inizia gratis →
CTA secondary: Vedi un esempio
Reminder:   14 lezioni gratis · No carta di credito · 5 minuti al giorno
```

**English**

```
Eyebrow:    LEARN TO BUILD WITH AI
Headline:   Turn your ideas into real apps.
            Without writing a single line of code.
Sub:        Promptly teaches you how to talk to AI to build real
            software. Short lessons, hands-on exercises, results
            you see growing every day.
CTA primary:   Start free →
CTA secondary: Try an example
Reminder:   14 free lessons · No credit card · 5 minutes a day
```

### Visual: hero mockup

- Browser frame (mac-style top bar) contenente uno screenshot della pagina lezione
- Cattura il momento subito dopo "Correct! ✓" con XP toast `+150 XP ⚡` che entra dal basso a destra
- Animazione: ogni 4s il toast si rifa (CSS animation, non gif — peso minimo)
- Su mobile: scalato e sotto il testo

### CTA behaviour

- "Inizia gratis" → `/signup` con `?source=hero_primary` (per tracking PostHog)
- "Vedi un esempio" → scroll smooth alla sezione 5 (Esercizio live)

### Eventi PostHog

- `landing_hero_viewed` (intersection observer)
- `landing_hero_cta_clicked` `{ cta: 'primary' | 'secondary' }`

---

## 2. Sezione Problema

### Layout
Centrato, max-width 720px, 3 carte affiancate sotto a un titolo.

### Copy

**Italiano**

```
Titolo:     Hai un'idea, ma il codice ti blocca.
Sottotitolo: Suona familiare?

Card 1: 📌  "Vorrei costruire la mia idea, ma non so programmare."
Card 2: 🌪  "Ho provato i corsi di coding, ma sono lunghi e astratti."
Card 3: 🤖  "L'AI sembra promettente, ma non so come usarla davvero."
```

**English**

```
Title:    You have an idea, but code is blocking you.
Subtitle: Sound familiar?

Card 1: 📌  "I want to build my idea, but I can't code."
Card 2: 🌪  "I tried coding courses, but they're long and abstract."
Card 3: 🤖  "AI looks promising, but I don't know how to actually use it."
```

### Visual
Card semplici: sfondo `--surface`, border `--border`, emoji/icona in alto, testo in `--text-primary`. Niente immagini complesse.

---

## 3. Soluzione / Come funziona

### Layout
3 step orizzontali (mobile: stack verticale). Numero grande + icona path + titolo + sub.

### Copy

**Italiano**

```
Titolo:     Promptly ti insegna a costruire con le parole.

Step 1 — IMPARA
Icona: icon-path-mindset.svg (lampadina)
Titolo: Capisci come parlare all'AI
Sub: Ogni concetto in 5 minuti. Niente teoria astratta — solo cose
     che userai subito.

Step 2 — PROVA
Icona: icon-path-prompt.svg (chat)
Titolo: Esercitati con prompt veri
Sub: Esercizi interattivi che ti correggono. Sbagliare è permesso —
     anzi, è il modo in cui imparerai meglio.

Step 3 — COSTRUISCI
Icona: icon-path-build.svg (blocchi)
Titolo: Realizza il tuo primo progetto
Sub: Dalla prima riga al deploy. A fine corso avrai un'app vera,
     online, funzionante. E saprai come ricominciare con la prossima.
```

**English**

```
Title:     Promptly teaches you to build with words.

Step 1 — LEARN
Icon: icon-path-mindset.svg
Title: Understand how to talk to AI
Sub: Every concept in 5 minutes. No abstract theory — only what
     you'll actually use.

Step 2 — PRACTICE
Icon: icon-path-prompt.svg
Title: Exercise with real prompts
Sub: Interactive exercises that correct you. Mistakes are welcome —
     they're how you'll learn fastest.

Step 3 — BUILD
Icon: icon-path-build.svg
Title: Ship your first project
Sub: From the first line to a live deploy. By the end of the course
     you'll have a real app, online, working. And you'll know
     how to start the next one.
```

---

## 4. Curriculum Preview

### Layout
5 card path orizzontali (carousel su mobile). Ogni card mostra: icona path, numero, titolo, lessons count, livello, tempo stimato.

### Copy

**Italiano**

```
Titolo:    Il percorso completo, in 5 tappe.
Sub:       38 lezioni totali. Inizia oggi con le prime 14 gratis.

Card 1: 🟢 PERCORSO 1 — La Mente del Vibe Coder
        6 lezioni · 30-50 min · Inizia da qui
        Badge: GRATIS

Card 2: 🟢 PERCORSO 2 — Il Prompt
        8 lezioni · 50-90 min
        Badge: GRATIS

Card 3: 🟡 PERCORSO 3 — Costruisci
        10 lezioni · 90-150 min
        Badge: PRO

Card 4: 🔴 PERCORSO 4 — Risolvi i Bug
        6 lezioni · 50-80 min
        Badge: PRO

Card 5: 🚀 PERCORSO 5 — Pubblica al Mondo
        8 lezioni · 70-110 min
        Badge: PRO
```

**English**

```
Title:    The full path, in 5 steps.
Sub:      38 lessons total. Start today with the first 14 free.

Card 1: 🟢 PATH 1 — The Mindset
        6 lessons · 30-50 min · Start here
        Badge: FREE

Card 2: 🟢 PATH 2 — The Prompt
        8 lessons · 50-90 min
        Badge: FREE

Card 3: 🟡 PATH 3 — Build
        10 lessons · 90-150 min
        Badge: PRO

Card 4: 🔴 PATH 4 — Debug
        6 lessons · 50-80 min
        Badge: PRO

Card 5: 🚀 PATH 5 — Ship
        8 lessons · 70-110 min
        Badge: PRO
```

### Visual
Card con: header colorato per difficoltà (verde/giallo/rosso) + icona path + titolo + meta (lessons + time) + badge tier (free/pro). Hover: leggera elevazione, niente click action (decorativo).

**IMPORTANTE**: questa è la prima volta che il visitatore vede menzionato "Pro". Serve come anteprima trasparente — non vuol dire mostrare il prezzo, ma rendere chiaro che alcuni path sono premium. Il prezzo viene scoperto dopo signup.

---

## 5. Esercizio Live (giocabile inline)

### Layout
Sezione full-width con sfondo `--surface-muted`, contenuto centrato max-width 720px.

### Copy

**Italiano**

```
Eyebrow:  PROVALO ORA
Titolo:   Senti com'è imparare con Promptly.
Sub:      Completa questo esercizio reale dalla prima lezione.
          Non serve registrarsi.
```

**English**

```
Eyebrow:  TRY IT NOW
Title:    Feel what learning with Promptly is like.
Sub:      Complete this real exercise from the first lesson.
          No signup needed.
```

### Esercizio (entrambe le lingue)

Brief: "Completa la definizione di vibe coding."

Prompt template:
```
Vibe coding è la pratica di costruire [BLANK] usando [BLANK]
invece di scrivere codice manualmente.
```

Blanks (case-insensitive):
- Blank 1 accept: `software`, `applicazioni`, `app`, `software vero`
- Blank 2 accept: `linguaggio naturale`, `parole`, `frasi`, `prompt`

### Behavior

- Stesso identico componente `ExerciseFillBlank` usato nell'app — riutilizzabile
- 3 attempt flow standard (hint → hint specifico → reveal)
- Quando l'utente completa: confetti + toast `"Bravo! Vorresti continuare?"` con CTA `Iscriviti gratis →`
- Se fallisce 3 volte: rivela risposta + stesso CTA
- Tracking: `landing_exercise_started`, `landing_exercise_attempt`, `landing_exercise_completed`, `landing_exercise_cta_clicked`

### Implementation note
Il componente standalone deve funzionare **senza Supabase** (no progress saving). I dati vivono in state locale React. Quando l'utente clicca il CTA finale, il fatto che ha completato l'esercizio viene passato come query param a `/signup?completed_demo=true` — l'app può mostrare un benvenuto personalizzato ("Hai già fatto la prima lezione, falla contare!").

---

## 6. Social Proof

### Layout
Banner orizzontale: counter centrale + 1-2 quote sotto in carosello/stack.

### Copy

**Italiano**

```
Banner top:   ✨ Unisciti a [n] persone che hanno già iniziato

Quote 1 (esempio — sostituire con vera):
   "Promptly trasforma il vibe coding da concetto astratto a
    skill concreta. Il futuro dell'apprendimento di software."
   — [Nome esperto], [Ruolo]

Quote 2 (esempio):
   "Finalmente un corso che non ti fa leggere ore — ti fa
    scrivere prompt veri dal primo minuto."
   — [Nome esperto], [Ruolo]
```

**English**

```
Banner top:   ✨ Join [n] people who already started

Quote 1 (example):
   "Promptly turns vibe coding from an abstract concept into
    a concrete skill. The future of software education."
   — [Expert name], [Role]

Quote 2 (example):
   "Finally a course that doesn't make you read for hours —
    it makes you write real prompts from minute one."
   — [Expert name], [Role]
```

### Counter implementation

Il numero `[n]` non è il vero count utenti (rischio: troppo basso al lancio). È un **early access counter** che parte da un numero credibile (es. 200-500) e cresce in base a:
- Signup reali (peso 1.0)
- Iscrizioni newsletter (peso 0.5)
- Boost manuale gestibile da admin (peso transparente in DB)

Implementazione: edge function che legge `users.count + admin_boost` da Supabase. Cache 60s.

**IMPORTANT — onestà**: se non hai ancora i 200 utenti, NON inventare. Inizia da un counter più piccolo ma reale (es. "Tra i primi 50 studenti") oppure rimuovi il counter finché non ne hai ≥100.

### Quote: importante

Le quote sono **placeholder**. Prima del lancio:
1. Identifica 3-4 esperti del vibe coding (es. autori dei riferimenti curriculari di PROMPTLY.md: roadmap.sh, producttalk.org, creatoreconomy.so)
2. Mostra loro un demo del prodotto
3. Chiedi quote autentiche
4. Se non li ottieni: usa quote da beta tester reali (5-10 persone che hanno provato Path 1+2 prima del lancio)
5. **MAI inventare quote**. È deontologicamente sbagliato e legalmente rischioso.

---

## 7. FAQ

### Layout
Accordion verticale, max-width 720px, una domanda aperta di default (la prima).

### Domande (12)

**Italiano + English in parallelo. Solo testo italiano qui per brevità — le versioni EN sono nel file `i18n/landing.ts`.**

```
1. Devo saper programmare?
   No, assolutamente. Promptly è pensato per chi non ha nessuna
   esperienza di codice. Imparerai a parlare con l'AI usando
   parole tue, non comandi tecnici.

2. Cosa imparo davvero?
   Imparerai a trasformare un'idea in un'app vera usando l'AI
   come collaboratore. Alla fine del corso avrai un progetto
   pubblicato online e saprai come iniziare il prossimo.

3. È davvero gratis o c'è un trucco?
   I primi due percorsi (14 lezioni) sono gratis per sempre,
   senza carta di credito. Se vorrai approfondire i percorsi
   avanzati potrai passare a Pro, ma è opzionale e lo decidi tu.

4. Quanto tempo richiede?
   Puoi scegliere il tuo ritmo: 5, 10 o 15 minuti al giorno.
   I primi due percorsi richiedono circa 1-2 ore totali.
   Il corso completo (5 percorsi) circa 5-7 ore.

5. Su quali dispositivi funziona?
   Su qualsiasi browser moderno: telefono, tablet, computer.
   Puoi anche installarlo come app sulla tua home (Android
   e desktop). Su iPhone funziona aggiungendolo alla home dal
   menu condivisione di Safari.

6. Posso usare Promptly per il mio progetto vero?
   Sì, è il punto. Le tecniche che imparerai le applicherai
   subito al tuo progetto. Non sono esercizi accademici —
   sono il modo in cui costruirai davvero.

7. Quale AI userò durante il corso?
   Promptly ti insegna i principi che funzionano con qualsiasi
   AI: Claude Code, Cursor, ChatGPT, Copilot. Gli esempi nelle
   lezioni usano Claude Code perché è lo strumento più indicato
   per progetti reali, ma le idee sono universali.

8. Cosa succede se sbaglio un esercizio?
   Niente di brutto — anzi. Il sistema ti dà suggerimenti
   progressivi. Dopo tre tentativi vedi la risposta corretta
   con la spiegazione. Sbagliare è il modo migliore per
   imparare davvero.

9. Posso interrompere e riprendere?
   Sempre. Il tuo progresso si salva automaticamente.
   Hai una "streak" che ti incoraggia a tornare ogni giorno,
   e un congelamento settimanale gratis per quando salti
   un giorno (giorni di malattia, vacanze, vita).

10. C'è un certificato finale?
    Sì. Completando tutti e cinque i percorsi ricevi un
    certificato PDF con il tuo nome, condivisibile su LinkedIn.
    Il certificato è incluso in Pro.

11. Posso ottenere un rimborso se Pro non fa per me?
    Sì. Hai 14 giorni dall'acquisto per richiedere il rimborso
    completo, senza dover spiegare il motivo. Scrivici e basta.

12. Come funziona la lingua?
    Promptly è disponibile in italiano e inglese. Puoi cambiare
    lingua in qualsiasi momento dalle impostazioni — il tuo
    progresso non si perde.
```

---

## 8. Closing CTA

### Layout
Sezione full-width con sfondo `--primary` (arancione brand) e testo bianco. Massimo impatto visivo, ultima cosa prima del footer.

### Copy

**Italiano**

```
Headline: Pronto a costruire la tua prima app?
Sub:      Le prime 14 lezioni sono gratis. Iniziamo?
CTA:      Inizia gratis →
Reminder: No carta di credito · 5 minuti al giorno · Annulli quando vuoi
```

**English**

```
Headline: Ready to build your first app?
Sub:      The first 14 lessons are free. Shall we?
CTA:      Start free →
Reminder: No credit card · 5 minutes a day · Cancel anytime
```

### Tracking
- `landing_closing_cta_clicked` `{ source: 'closing' }`

---

## Header

### Layout
Sticky in alto, height 64px, background `--surface` con border-bottom sottile.

### Contenuto

Sinistra: logo (`logo-horizontal.svg`) cliccabile → `/`
Destra (desktop):
- LangSwitcher (EN/IT)
- Link "Accedi" / "Login" → `/login`
- Bottone "Inizia gratis" / "Start free" → `/signup?source=header`

Mobile: hamburger menu con stesse opzioni.

### Comportamento
- Su scroll down: l'header rimpicciolisce leggermente (height 56px)
- Lo sfondo diventa leggermente translucido con backdrop-filter blur

---

## Footer

### Layout
Sfondo `--surface-muted`, padding generoso, max-width container.

### Contenuto

```
[Logo Promptly]                     [Lang switcher EN | IT]

Prodotto                Risorse              Legale
- Come funziona         - Blog (futuro)      - Privacy
- Curriculum            - Aiuto              - Termini
- Pro                   - Contatti           - Cookie

Social: Twitter · LinkedIn · GitHub

──────────────────────────────────────────────────────────
© 2026 Promptly · Costruito con ❤ in Italia
```

**English version**: stesse sezioni, label tradotte.

### Note
- Il blog è opzionale e linkato solo se esiste contenuto pubblicato (almeno 3 articoli). Altrimenti rimuovere la voce.
- "Aiuto" → email `support@learnpromptly.app` (placeholder dominio)
- "Costruito con ❤ in Italia" è un piccolo elemento brand che umanizza il prodotto senza richiedere founder section.

---

## Microcopy & UX rules

### Tono — esempi sì/no

✅ "Le prime 14 lezioni sono gratis. Iniziamo?"
❌ "ISCRIVITI ORA E TRASFORMA LA TUA VITA!!!"

✅ "Sbagliare è permesso — anzi, è il modo in cui imparerai meglio."
❌ "Sbagli? Riprova! Non mollare mai!"

✅ "Promptly ti insegna a parlare con l'AI per costruire software vero."
❌ "Promptly è la rivoluzione del coding del futuro che cambierà tutto."

### CTA labels (sempre identici in tutta la landing)

- Primary: "Inizia gratis" / "Start free" (mai "Iscriviti gratis", mai "Registrati", mai "Prova ora")
- Secondary: "Vedi un esempio" / "Try an example" (per il jump alla sezione 5)

### Reminder copy (sotto ai CTA)

Pattern: "X · Y · Z" con separatori bullet point. Mai più di 3 elementi.
Esempio: `14 lezioni gratis · No carta di credito · 5 minuti al giorno`

### Loading states
La landing è statica — niente loading. Eccezione: l'esercizio live ha un check answer in 200ms (client-side), nessun spinner serve.

---

## Performance & SEO

### Performance target
- Lighthouse mobile: ≥ 90 in tutte le categorie
- LCP < 2.5s (l'immagine hero è il candidato critico — usare `next/image` priority + fallback blur)
- Bundle JS landing: < 80kb gzip (la landing non importa Supabase, niente client SDK pesanti)

### SEO

```html
<title>Promptly — Impara a costruire con le parole, non con il codice</title>
<meta name="description"
      content="Il primo corso interattivo di vibe coding. Trasforma le tue idee in app vere, senza scrivere codice. Inizia gratis con 14 lezioni." />

<meta property="og:title" content="Promptly — Learn to build with words" />
<meta property="og:description" content="..." />
<meta property="og:image" content="/og-image.png" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

### Structured data
JSON-LD `Course` schema (https://schema.org/Course) con: name, description, provider (Promptly), inLanguage (en, it), educationalLevel (beginner), hasCourseInstance (free + pro).

### Hreflang
```html
<link rel="alternate" hreflang="en" href="https://learnpromptly.app/en/" />
<link rel="alternate" hreflang="it" href="https://learnpromptly.app/it/" />
<link rel="alternate" hreflang="x-default" href="https://learnpromptly.app/" />
```

---

## Eventi PostHog (taxonomy completa landing)

```
landing_viewed                      { lang, source: utm_source }
landing_hero_viewed
landing_hero_cta_clicked            { cta: 'primary' | 'secondary' }
landing_problem_viewed
landing_solution_viewed
landing_curriculum_viewed
landing_curriculum_path_hovered     { path_slug }
landing_exercise_viewed
landing_exercise_started
landing_exercise_attempt            { attempt_n: 1-3, correct: bool }
landing_exercise_completed          { attempts_used: 1-3 }
landing_exercise_cta_clicked
landing_social_proof_viewed
landing_faq_viewed
landing_faq_question_opened         { question_id }
landing_closing_cta_clicked
landing_lang_switched               { from, to }
landing_signup_started              { source }   (after redirect to /signup)
```

I funnel chiave da impostare day-1 in PostHog:
1. `landing_viewed → landing_hero_cta_clicked → landing_signup_started → signup_completed`
2. `landing_exercise_started → landing_exercise_completed → landing_exercise_cta_clicked → signup_completed`
3. `landing_viewed → landing_faq_viewed → landing_signup_started`

---

## Implementation checklist (per Claude Code)

### Setup
- [ ] Route group `app/(marketing)/[lang]/` con layout dedicato
- [ ] Middleware per detect `Accept-Language` e redirect a `/en/` o `/it/` (default it)
- [ ] File `lib/i18n/landing-en.ts` e `landing-it.ts` con tutto il copy strutturato

### Sezioni
- [ ] `<HeroSection>` con mockup app statico (placeholder image OK al D1)
- [ ] `<ProblemSection>` 3 cards
- [ ] `<SolutionSection>` 3 step
- [ ] `<CurriculumPreview>` con 5 path card (riusa `LessonCard`? o componente dedicato `PathPreviewCard`?)
- [ ] `<InteractiveExerciseDemo>` riusando `ExerciseFillBlank` con prop `standalone={true}`
- [ ] `<SocialProofSection>` con counter da edge function
- [ ] `<FAQSection>` con 12 Q&A da JSON, accordion shadcn
- [ ] `<ClosingCTA>` con sfondo arancione

### Cross-cutting
- [ ] `<MarketingHeader>` con sticky behaviour + scroll-shrink
- [ ] `<MarketingFooter>` con grid 3 colonne
- [ ] `<LangSwitcher>` con cookie `NEXT_LOCALE` per persistenza
- [ ] `next/font` per Plus Jakarta Sans + Inter
- [ ] OG image generata via `next/og` (oppure precompilata da `og-image.svg`)
- [ ] Analytics PostHog wired con event taxonomy completa
- [ ] Privacy policy + Terms (placeholder OK per il primo deploy)
- [ ] Sitemap.xml + robots.txt
- [ ] JSON-LD structured data nel `<head>`

### Test
- [ ] Lighthouse mobile ≥ 90
- [ ] Test bilingue: navigare in EN, switchare a IT, verificare URL/cookies/copy
- [ ] Test esercizio live: completarlo + sbagliare 3 volte
- [ ] Test responsive: 375px (iPhone SE), 768px (iPad), 1440px (laptop)
- [ ] Verificare che gli eventi PostHog si registrino correttamente

---

*Brief versione 1.0 — passa a Claude Code dicendo "Implementa la landing seguendo `LANDING.md` e `PROMPTLY.md`. Inizia dal layout `(marketing)` e dalla `HeroSection`. Conferma il piano prima di toccare codice."*
