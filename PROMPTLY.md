# PROMPTLY — Master Context File

> Read this file BEFORE touching any other file in the project.
> This is the single source of truth for vision, design, data model, and UI language.
> Version 2.3 — Updated 2 May 2026 (lessons V2 pivot).

---

## ⚠️ Lessons V2 pivot (2 May 2026)

The Path 1-2 exercise format has changed. The "fill-in-the-blank" template
documented in earlier sections is **superseded** for new content:

- **New format** for Path 1-2: open-ended questions + AI commentary
  via **OpenAI GPT-4o mini**. Plus optional in-lesson `archetype_quiz`
  blocks (multiple-choice with static archetype reveal).
- **System prompts live per-lesson** inside each `open_question` block
  (no global default). See `LESSON-GUIDELINES.md` §11.
- **Authoring workflow inverted**: Stefano writes the draft, the AI reviews
  with numbered proposals, the AI translates and saves both `.v2.json`
  files (IT + EN) in `/content/<lang>/<path>/`.
- **Rollout strategy**: V2 lessons are saved as `<order>-<slug>.v2.json`
  alongside the V1 files until the renderer is wired. V1 stays in
  production for now.
- **API keys**: `.env.example` now declares `OPENAI_API_KEY` and
  `OPENAI_MODEL=gpt-4o-mini`. DeepSeek is still reserved for the v2 Pro
  tier (Path 3-5) when those lessons land.

Sections of this document that were written assuming the V1 fill-blank
format are kept for context but flagged where they conflict with V2.
The authoritative spec for the V2 lesson schema lives in
`LESSON-GUIDELINES.md` (§3.b, §2.5, §5, §11).

---

## Hosting & URLs

| Environment | URL | Provider | Notes |
|---|---|---|---|
| **Production** | `https://learnpromptly.app/` | Netlify | Active. Custom domain `learnpromptly.app` acquired and configured (DNS pending propagation). |
| Repository | `https://github.com/stefanopisani91/promptly` | GitHub | Private. Deploys auto-trigger from `main`. |
| Vercel (deprecated) | `project-ikucx.vercel.app` | Vercel | Abandoned: Edge Runtime middleware bundling issues. Kept inactive in case we need to compare. |

When configuring OAuth redirect URIs, Stripe webhooks, Resend domain verification, etc., use `https://learnpromptly.app`.

---

## Vision

PROMPTLY is an interactive learning platform that teaches **vibe coding** — the practice of building real software through AI prompts instead of writing code manually. It is not a collection of tutorials. It is a structured, bilingual, gamified course where every lesson ends with a hands-on exercise and every concept is immediately applied.

The target user ranges from a complete beginner (marketer, entrepreneur, designer with zero technical background) to a junior developer who wants to accelerate using AI tools. The course works for all three because it teaches **thinking and communication**, not syntax.

## Tagline

**"Learn to build with words, not code."**
*(Italian: "Impara a costruire con le parole, non con il codice.")*

## What makes Promptly different

Every vibe coding guide online is an article to read. Promptly is the first **structured, interactive course** that makes you practice. The curriculum is grounded in the best existing resources (roadmap.sh/vibe-coding, producttalk.org, creatoreconomy.so) but transforms their content into exercises, not reading lists.

## Product type

**Web app + installable PWA.** Built as a Next.js webapp deployed on Vercel. Users can "Add to Home Screen" on Android/desktop for an app-like experience and reliable push notifications. iOS users without PWA install fall back to email reminders (see Notifications below).

---

## Business Model — Freemium

| Tier | Access | Price |
|------|--------|-------|
| **Free** | Path 1 (Mindset) + Path 2 (Prompt) — 14 lessons total | €0 |
| **Pro** | Path 3 (Build) + Path 4 (Debug) + Path 5 (Ship) + completion certificate + AI prompt evaluation | **€6.99/month** or **€29 lifetime** |

Rationale: the first 2 paths are both the acquisition funnel and a real taste of the methodology. Pro is unlocked when the user has completed Path 2 (warmest possible upsell moment).

**Payments:** Stripe Checkout for both subscription and one-time lifetime. Webhook → Supabase → updates `users.subscription_tier`.

---

## MVP Scope (do NOT exceed)

The first launch ships only:

1. ✅ Auth (Email + Google), onboarding, language selection, daily goal selection
2. ✅ Dashboard with all 5 paths visible (Path 3-5 marked "Coming soon — Pro")
3. ✅ Path 1 (Mindset, 6 lessons) + Path 2 (Prompt, 8 lessons) — full content in EN + IT
4. ✅ Lesson page with theory + exercise. **V1** uses fill-in-the-blank with adaptive hints (currently in production). **V2** (rollout in progress May 2026) uses open-ended questions with AI commentary via GPT-4o mini, plus optional archetype quizzes — see V2 banner above.
5. ✅ Streak system (with weekly freeze) + XP system + daily goal ring
6. ✅ Save/bookmark, settings, language toggle
7. ✅ Push notifications (PWA) + email fallback for streak reminders
8. ✅ PostHog analytics on all key funnels
9. ✅ Stripe integration (paywall is functional; Pro content arrives in v2)

Path 3-5 + AI prompt evaluation + completion certificate ship in **v2**, after MVP validates engagement.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode, no exceptions, no `any`)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + Auth)
- **Auth providers:** Email/password + Google OAuth (no Apple OAuth in MVP — adds $99/year + complexity for marginal gain)
- **Payments:** Stripe Checkout + webhook → Supabase
- **AI commentary (Path 1-2, V2):** OpenAI **GPT-4o mini** — used to comment on the user's free-text answers to in-lesson `open_question` blocks. No scoring, no gating: pure engagement layer. Each lesson's JSON carries its own `system_prompt` per question.
- **AI evaluation (Path 3-5, v2 Pro tier):** DeepSeek API (`deepseek-chat`) — chosen for cost efficiency (~5–10x cheaper than GPT-4o mini or Claude Haiku at comparable quality on structured rubric tasks). Used for free-form prompt evaluation with numeric scoring.
- **Push notifications:** Web Push API via service worker (PWA installs only)
- **Email:** Resend (transactional + streak reminders)
- **Analytics:** PostHog (self-hosted EU instance for GDPR comfort, or PostHog Cloud EU)
- **Deploy:** Vercel
- **PDF generation (v2):** `@react-pdf/renderer` for the completion certificate

### GDPR notes

- DeepSeek API servers are in China. The user prompt is sent there for evaluation. This must be disclosed in the privacy policy and the consent flow before activating Pro features.
- OpenAI (GPT-4o mini) servers are in the US. User answers to V2 `open_question` blocks are sent there for the commentary layer. Disclose in the privacy policy. EU data residency add-ons can be considered if/when traffic justifies the cost.
- PostHog should be the EU-region instance to avoid extra DPAs.
- Supabase project should be in the EU region.

### Privacy policy backlog

The landing-page Lucia demo (`/api/landing-evaluate`) sends anonymous-user prompts to OpenAI (US). Interim coverage is in place:

- `/[lang]/privacy` renders a **provisional** Italian + English privacy notice (`components/marketing/PrivacyPolicyProvisional.tsx`) covering Art. 13 GDPR, EU-US Data Privacy Framework (Adequacy Decision 2023/1795), AI Act Art. 50 transparency, and the warning to not include personal data in the prompt. Lawful basis declared: legitimate interest (Art. 6(1)(f) GDPR), NOT consent.
- An inline disclosure note sits under the demo with a link to the page.

**Before public launch:**
- [ ] Have a lawyer review and replace the provisional privacy notice with the definitive version. The provisional content is a defensible interim placeholder, not a substitute for legal review.
- [ ] Decide the data controller's identifying details (legal entity, address, P.IVA / VAT, contact DPO if any) and update the "Titolare del trattamento" / "Data controller" section.
- [ ] Verify OpenAI's current DPF certification status before publication.
- [ ] Add full Cookie Policy + Terms of Service (currently still placeholders).

---

## Folder Structure

```
promptly/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                            # Authenticated area
│   │   ├── dashboard/page.tsx            # Home — all paths + progress
│   │   ├── path/[pathSlug]/page.tsx      # Path overview (list of lessons)
│   │   ├── lesson/[lessonId]/page.tsx    # Single lesson page
│   │   ├── saved/page.tsx                # Saved lessons & exercises
│   │   ├── certificate/page.tsx          # Final certificate (v2)
│   │   ├── pro/page.tsx                  # Upgrade landing page (Stripe)
│   │   └── settings/page.tsx             # Language, daily goal, notifications, billing
│   ├── api/
│   │   ├── progress/route.ts             # Update lesson/exercise progress
│   │   ├── streak/route.ts               # Streak logic + freeze redemption
│   │   ├── certificate/route.ts          # PDF generation endpoint (v2)
│   │   ├── evaluate/route.ts             # DeepSeek prompt evaluation (v2, Path 3-5)
│   │   ├── stripe/checkout/route.ts      # Create Stripe Checkout session
│   │   ├── stripe/webhook/route.ts       # Stripe webhook handler
│   │   ├── notifications/subscribe/route.ts  # Web Push subscription store
│   │   └── notifications/cron/route.ts   # Vercel Cron at 18:00 — sends push + email
│   ├── manifest.ts                       # PWA manifest
│   ├── sw.ts                             # Service worker
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                               # shadcn components (do NOT edit directly)
│   └── promptly/
│       ├── PathCard.tsx                  # Card for each learning path on dashboard
│       ├── LessonCard.tsx                # Card for a single lesson inside a path
│       ├── ProgressBar.tsx               # XP and path completion bar
│       ├── StreakDisplay.tsx             # Streak counter + flame + freeze indicator
│       ├── ExerciseFillBlank.tsx         # Fill-in-the-blank prompt exercise (Path 1-2)
│       ├── ExerciseFreeForm.tsx          # Free-form prompt + AI feedback (Path 3-5, v2)
│       ├── HintBox.tsx                   # Adaptive hint after wrong answer
│       ├── XPToast.tsx                   # "+150 XP" toast after completing exercise
│       ├── DailyGoalRing.tsx             # Circular ring showing today's progress
│       ├── SaveButton.tsx                # Bookmark icon — save lesson or exercise
│       ├── LanguageToggle.tsx            # EN / IT switcher in the navbar
│       ├── PWAInstallPrompt.tsx          # "Install Promptly" CTA after first lesson
│       ├── ProLockCard.tsx               # Coming soon / upgrade prompt for Path 3-5
│       └── SimulatedOutput.tsx           # Renders pre-scripted AI output blocks in lessons
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── queries.ts                    # ALL database queries live here
│   ├── stripe/
│   │   ├── client.ts
│   │   └── checkout.ts
│   ├── ai/
│   │   └── deepseek.ts                   # DeepSeek client + evaluation prompts (v2)
│   ├── notifications/
│   │   ├── push.ts                       # Web Push send logic
│   │   └── email.ts                      # Resend email templates
│   ├── analytics/
│   │   └── posthog.ts                    # PostHog wrapper, event taxonomy
│   ├── xp.ts                             # XP calculation logic
│   ├── streak.ts                         # Streak + freeze logic
│   └── i18n/
│       ├── en.ts                         # All English UI strings
│       └── it.ts                         # All Italian UI strings
├── types/
│   └── index.ts                          # ALL TypeScript types
├── hooks/
│   ├── useProgress.ts
│   ├── useStreak.ts
│   ├── useLanguage.ts
│   ├── useSaved.ts
│   ├── useSubscription.ts                # Reads users.subscription_tier
│   └── usePWAInstall.ts
├── content/                              # Static lesson content (JSON)
│   ├── en/
│   │   ├── mindset/                      # Path 1 — 6 lessons (MVP)
│   │   └── prompt/                       # Path 2 — 8 lessons (MVP)
│   └── it/
│       ├── mindset/
│       └── prompt/
└── PROMPTLY.md                           # This file
```

---

## Design System — "Focused Academy"

### Philosophy

Clean, professional, results-oriented. The user came to learn something useful, not to be entertained. The interface gets out of the way and puts the content front and center. Visual feedback (XP, streak, progress) is present but never noisy. Think Linear meets Duolingo — calm structure with moments of celebration.

### Color Palette (CSS Variables → globals.css)

The brand color is taken directly from the logo: a warm coral-orange that's distinctive in the AI/learning space (most competitors use blue or purple) and reduces the "intimidating tech" feel for non-technical users.

```css
:root {
  /* Backgrounds */
  --background:       #F8F7F4;
  --surface:          #FFFFFF;
  --surface-muted:    #F1F0ED;
  --border:           #E4E2DC;

  /* Brand — orange (from logo) */
  --primary:          #E8703F;   /* Brand orange — primary actions, links, accents */
  --primary-hover:    #C8521F;   /* Darker orange — hover state */
  --primary-light:    #FFF1EB;   /* Pale orange — backgrounds, badges */
  --primary-deep:     #A23E12;   /* Deepest shade — used sparingly for emphasis */

  /* Feedback */
  --success:          #16A34A;
  --success-light:    #F0FDF4;
  --warning:          #D97706;
  --warning-light:    #FFFBEB;
  --error:            #DC2626;

  /* Gamification */
  --xp-gold:          #EAB308;   /* Yellow-gold — pulled away from orange to keep separation */
  --streak-fire:      #DC2626;   /* Red — distinct from brand orange */
  --streak-freeze:    #38BDF8;   /* Cyan — freeze indicator (snowflake icon) */

  /* Text */
  --text-primary:     #111827;
  --text-secondary:   #4B5563;
  --text-muted:       #9CA3AF;

  /* Prompt exercise area */
  --prompt-bg:        #1E293B;
  --prompt-text:      #E2E8F0;
  --prompt-fill:      #F59E0B;   /* Warm amber — blanks, harmonizes with brand */
  --prompt-fill-done: #86EFAC;

  /* Pro tier */
  --pro-accent:       #7C3AED;   /* Purple — Pro badge, paywall accents (intentional contrast with brand) */
  --pro-light:        #F5F3FF;
}
```

**Color rationale:** the orange brand stays exclusively for primary actions and identity. XP gold is shifted to a yellow-leaning tone to avoid blending into the orange. Streak fire is red, not orange, to remain distinct. Pro purple is the deliberate "premium" contrast — purple + orange is a classic complementary pair that signals upgrade clearly.

### Tool view — a formalized dialect (added May 2026)

Some surfaces represent a *tool* — an editor, an IDE, a terminal, a code preview. The Lucia landing demo is the first one shipped; future Path 3-5 build/debug exercises will reuse the same surface. Tool view is a deliberate exception to the "Focused Academy" calm: it's the only place where Promptly trades cream warmth for IDE-dark autonomy, because a simulated coding tool that *doesn't* feel like a real tool is uncanny.

```css
/* Tool view tokens — declared in globals.css. Use ONLY inside components
   that explicitly represent an editor/IDE/terminal scene. Never as
   decoration on marketing or app surfaces. */
--tool-bg:              #0A0A0A;   /* deepest canvas — outer console */
--tool-bg-elevated:     #282C34;   /* editor area (Atom One Dark feel) */
--tool-bg-result:       #0F1218;   /* result/score panel */
--tool-bg-chrome:       #21252B;   /* tab bar, status bar, terminal chrome */
--tool-bg-action:       #1C1F25;   /* action bar background */
--tool-bg-card:         #3A3F4B;   /* disabled buttons, neutral on dark */
--tool-divider:         #181A1F;   /* hard separators in tool chrome */
--tool-divider-soft:    #2A2A2A;   /* soft separator */
--tool-text:            #ABB2BF;   /* primary text on tool bg */
--tool-text-muted:      #5C6370;   /* metadata, line numbers active */
--tool-text-subtle:     #4B5263;   /* line numbers inactive */
--tool-text-faint:      #7A8190;   /* subtle hints */
--tool-accent:          #C5F432;   /* "tool brand" — lime, signals action */
--tool-accent-bright:   #9FFF00;   /* brighter lime — focused border */
--tool-accent-victory:  #00C853;   /* locked-in success state */
--tool-error:           #FF4444;   /* terminal error red — diegetic, not feedback */

/* macOS chrome dots — iconic, reused across all browser/IDE mockups */
--macos-red:    #FF5F57;
--macos-yellow: #FEBC2E;
--macos-green:  #28C840;
```

**Tailwind aliases** (declared in `tailwind.config.ts`):
- `bg-tool-bg`, `text-tool-text`, `border-tool-divider`, `text-tool-accent`, etc.
- `bg-macos-red`, `bg-macos-yellow`, `bg-macos-green`

**Rules of use**:
1. Tool view tokens are scoped to **editor/IDE/terminal scenes only**. The `LuciaDemo`, `LuciaPromptPanel`, `LuciaConsole` use them. A future Path 3 build exercise that simulates Claude Code will reuse them. Marketing copy, dashboards, lesson cards, navbars: **forbidden**.
2. Promptly's brand orange (`--primary`) is allowed inside tool view as **the user's voice** — caret colour, action-button background, "your side" border-left. Lime is the tool's voice (the IDE itself). Orange + lime are NOT decorative — they're a deliberate two-character dialogue.
3. Some inline glow/shadow strings concatenate alpha suffixes (e.g. `${scoreColor}40`) and CSS `var(...)` doesn't support that. In those rare cases the hex is duplicated as a local constant with a comment pointing back to the matching token. Keep them in sync.
4. The `LuciaHomepage` panel is **diegetic** — it represents a fictional third-party site Lucia built. Its colours (`#F8F5F0`, `#5C8C5E`, etc.) are *not* tool view tokens; they're props of the scene. Keep them as local constants in that file, not promoted to the DS.

**The orange spine (`border-left: 4px solid var(--primary)`)** on the right panel of the Lucia demo is the visual signature that says "this side belongs to Promptly". The lime spine on the left says "this side is the tool / the world to fix". Replicate this convention in any future tool view surface that has a "your input" / "external state" split.

### Typography

- **Headings:** Plus Jakarta Sans (weight 600-700)
- **Body & UI:** Inter (weight 400 regular, 500 medium for emphasis)
- **Prompt / code areas:** JetBrains Mono
- **Wordmark "PROMPTLY":** Plus Jakarta Sans **700 (Bold)** — never the heavier 800/900. The intermediate weight aligns with the "Focused Academy" tone (Linear-leaning) instead of feeling overly playful (Duolingo-leaning).

---

## Brand Assets

The logo is a P-mark with a brain inside, plus the wordmark "PROMPTLY". Brand color: `--primary` (orange). All assets live in `/public/brand/`.

### Logo variants (4 total)

| Variant | Use | File |
|---|---|---|
| **Full** | Landing hero, header, email signature, slide decks | `logo-full.svg` (P + brain + wordmark) |
| **Symbol** | App icon (PWA), social avatars, Open Graph image, navbar on narrow viewports | `logo-symbol.svg` (P + brain only, square aspect) |
| **Favicon** | Browser tab, small icons (≤48px) | `logo-favicon.svg` — simplified P with a clean glyph inside (no brain detail). Detailed wrinkles get muddy at 16-32px |
| **Monochrome** | Dark backgrounds, single-color print, watermarks | `logo-mono-white.svg` and `logo-mono-black.svg` |

### Sizing rules

- **Minimum size with wordmark:** 120px wide. Below that, use `logo-symbol.svg`
- **Minimum size for symbol:** 24px. Below 24px → `logo-favicon.svg`
- **Clear space:** always leave padding equal to the height of the "P" stem on all sides
- **Never stretch, recolor outside the palette, add drop shadows, or place on busy backgrounds without a solid container**

### Asset organization

Two folders, separate roles:

```
/assets/                       # SVG sources — imported as React components or via @ alias
├── logo-symbol.svg
├── logo-full.svg              # vertical (P + brain + wordmark stacked)
├── logo-horizontal.svg        # symbol left, wordmark right
├── logo-favicon.svg           # simplified for ≤48px
├── logo-mono-white.svg
├── logo-mono-black.svg
├── wordmark.svg               # text-only "PROMPTLY"
├── icon-192.svg               # PWA icon master
├── icon-512.svg               # PWA icon master
├── apple-touch-icon.svg       # iOS home screen (180×180, no rounded corners)
├── og-image.svg               # Open Graph share card (1200×630)
├── badge-pro.svg
├── badge-free.svg
├── icon-streak.svg
├── icon-streak-freeze.svg
├── icon-xp.svg
├── icon-path-mindset.svg
├── icon-path-prompt.svg
├── icon-path-build.svg
├── icon-path-debug.svg
├── icon-path-ship.svg
└── README.md                  # asset usage guide

/public/                       # Static files served at the root URL
├── favicon.ico                # exported from logo-favicon.svg
├── icon-192.png               # exported from icon-192.svg (referenced in manifest.ts)
├── icon-512.png               # exported from icon-512.svg
├── apple-touch-icon.png       # exported from apple-touch-icon.svg
└── og-image.png               # exported from og-image.svg (referenced in metadata)
```

Why two folders: Next.js serves `/public/` directly at the root URL (so `<link rel="icon" href="/favicon.ico">` works), while `/assets/` holds vector sources that get imported as React components or compiled by the bundler. PNGs needed by browsers/social platforms are exported from the SVG sources to `/public/`. See `assets/README.md` for export commands.

The `app/manifest.ts` references `/icon-192.png` and `/icon-512.png` for the PWA install icon.

### Visual Rules

- Never more than one primary CTA per screen
- Progress bars always visible on lesson and path pages
- Correct/wrong feedback within 300ms of submitting (no spinners on Path 1-2)
- AI evaluation feedback (Path 3-5) shows a clear loading state — it can take 2-4s
- Prompt exercise area always uses dark background + monospace font
- Confetti animation only for: lesson complete, path complete, streak milestones (3/7/14/30/100 days)
- Pro-locked content: muted, with purple Pro badge and an "Upgrade" CTA — never grey-out without explanation

---

## Bilingual UI System

### Language flow

The user selects their preferred language at signup. Switchable anytime via the navbar toggle (`EN` / `IT`). The switch applies instantly with no page reload (stored in user profile + localStorage for speed).

All UI strings live in `lib/i18n/en.ts` and `lib/i18n/it.ts`. **Never hardcode UI strings in components.**

### Core UI strings

**Navigation**

| Key | English | Italian |
|---|---|---|
| `nav.dashboard` | "Learn" | "Impara" |
| `nav.saved` | "Saved" | "Salvati" |
| `nav.settings` | "Settings" | "Impostazioni" |
| `nav.streak` | "🔥 [n] day streak" | "🔥 [n] giorni di fila" |
| `nav.upgrade` | "Upgrade to Pro" | "Passa a Pro" |

**Dashboard**

| Key | English | Italian |
|---|---|---|
| `dashboard.greeting` | "Welcome back, [name]" | "Bentornato, [name]" |
| `dashboard.goal_today` | "Today's goal: [n] min" | "Obiettivo di oggi: [n] min" |
| `dashboard.continue` | "Continue" | "Continua" |
| `dashboard.start` | "Start" | "Inizia" |
| `dashboard.locked_pro` | "Pro path — Upgrade to unlock" | "Percorso Pro — Sblocca con Pro" |
| `dashboard.locked_seq` | "Complete the previous path to unlock" | "Completa il percorso precedente per sbloccare" |
| `dashboard.xp_total` | "[n] XP total" | "[n] XP totali" |

**Lesson**

| Key | English | Italian |
|---|---|---|
| `lesson.next` | "Next" | "Avanti" |
| `lesson.check` | "Check answer" | "Controlla risposta" |
| `lesson.evaluate` | "Evaluate my prompt" | "Valuta il mio prompt" |
| `lesson.hint` | "Show hint" | "Mostra suggerimento" |
| `lesson.correct` | "Correct! ✓" | "Corretto! ✓" |
| `lesson.wrong` | "Not quite. Here's a hint:" | "Non ancora. Ecco un suggerimento:" |
| `lesson.complete` | "Lesson complete! +[n] XP ⚡" | "Lezione completata! +[n] XP ⚡" |
| `lesson.save` | "Save lesson" | "Salva lezione" |
| `lesson.saved` | "Saved ✓" | "Salvato ✓" |
| `lesson.simulated_output` | "Simulated AI output" | "Output AI simulato" |

**Streak & Freeze**

| Key | English | Italian |
|---|---|---|
| `streak.active` | "🔥 [n]-day streak! Keep it up." | "🔥 [n] giorni di fila! Continua così." |
| `streak.broken` | "Streak lost. Start a new one today." | "Streak persa. Ricomincia oggi." |
| `streak.new_record` | "New record: [n] days! 🎉" | "Nuovo record: [n] giorni! 🎉" |
| `streak.freeze_available` | "❄️ 1 freeze available this week" | "❄️ 1 congelamento disponibile questa settimana" |
| `streak.freeze_used` | "❄️ Freeze used — your streak is safe" | "❄️ Congelamento usato — la tua streak è salva" |
| `xp.earned` | "+[n] XP ⚡" | "+[n] XP ⚡" |
| `xp.bonus` | "+[n] bonus XP (hard exercise)" | "+[n] XP bonus (esercizio difficile)" |

**Pro / Paywall**

| Key | English | Italian |
|---|---|---|
| `pro.cta_title` | "Ready for the real builds?" | "Pronto a costruire sul serio?" |
| `pro.cta_body` | "Path 3-5 take you from idea to a deployed app — with AI feedback on every prompt." | "I percorsi 3-5 ti portano dall'idea a un'app online — con feedback AI su ogni prompt." |
| `pro.price_monthly` | "€6.99 / month" | "€6,99 / mese" |
| `pro.price_lifetime` | "€29 once — lifetime access" | "€29 una tantum — accesso a vita" |
| `pro.unlock_btn` | "Unlock Pro" | "Sblocca Pro" |

**Certificate (v2)**

| Key | English | Italian |
|---|---|---|
| `cert.title` | "Certificate of Completion" | "Certificato di Completamento" |
| `cert.body` | "This certifies that [name] has completed the Promptly Vibe Coding Course." | "Si certifica che [name] ha completato il corso Promptly di Vibe Coding." |
| `cert.download` | "Download certificate (PDF)" | "Scarica certificato (PDF)" |
| `cert.date` | "Completed on [date]" | "Completato il [data]" |

---

## The 5 Learning Paths — Full Curriculum

Each path contains lessons. Each lesson has two parts: **Theory** (read/understand) and **Exercise**. The user cannot skip the exercise to mark a lesson complete.

### Difficulty levels and XP

- 🟢 **Beginner** — base XP: 100
- 🟡 **Intermediate** — base XP: 150 + 50 bonus = 200
- 🔴 **Advanced** — base XP: 200 + 100 bonus = 300

### Path tier mapping

| Path | Tier | Exercise format (V1 — current production) | Exercise format (V2 — rollout in progress) | MVP? |
|------|------|---|---|------|
| 1 — Mindset | Free | Fill-in-the-blank | Open question + AI commentary (GPT-4o mini) + optional archetype_quiz | ✅ |
| 2 — Prompt | Free | Fill-in-the-blank | Open question + AI commentary (GPT-4o mini) | ✅ |
| 3 — Build | Pro | n/a | Free-form prompt + AI evaluation (DeepSeek) | v2 |
| 4 — Debug | Pro | n/a | Free-form prompt + AI evaluation (DeepSeek) | v2 |
| 5 — Ship | Pro | n/a | Free-form prompt + AI evaluation (DeepSeek) + capstone | v2 |

---

### Path 1 — The Mindset *(Free, MVP)*

*"Before you write a single prompt, you need to think like a vibe coder."*
**6 lessons | 30–50 min total | Beginner 🟢**

| # | Lesson | Core concept | Exercise |
|---|---|---|---|
| 1 | What is vibe coding? | Definition, history, why now | Fill: complete the definition |
| 2 | You are the architect | From writer to supervisor | Fill: rewrite a bad instruction as a brief |
| 3 | Think in outcomes, not steps | Describe WHAT not HOW | Fill: outcome-based instruction |
| 4 | Break it down | Decomposing problems | Fill: split a feature into 3 sub-tasks |
| 5 | Context is everything | Why AI needs background | Fill: add context to a vague prompt |
| 6 | The vibe coder's checklist | Putting it together | Fill: complete the pre-prompt checklist |

---

### Path 2 — The Prompt *(Free, MVP)*

*"A prompt is a specification. The better you write it, the better the AI builds."*
**8 lessons | 50–90 min total | Beginner 🟢 → Intermediate 🟡**

| # | Lesson | Core concept | Difficulty |
|---|---|---|---|
| 1 | Anatomy of a great prompt | Role, context, constraints, output | 🟢 |
| 2 | Give the AI a role | "Act as senior dev" vs no role | 🟢 |
| 3 | Constraints are your friends | Include AND exclude | 🟢 |
| 4 | Describe the output format | Tables, lists, JSON, code | 🟡 |
| 5 | Bad prompt vs good prompt | Side-by-side rewrite | 🟡 |
| 6 | Prompt chaining | Sequential prompts for big tasks | 🟡 |
| 7 | The version problem | AI cutoffs, ask which version | 🟡 |
| 8 | Prompt patterns library | Top 5 reusable templates | 🟡 |

---

### Path 3 — The Build *(Pro, v2)*

*"Now you build something real — one prompt at a time."*
**10 lessons | Intermediate 🟡 → Advanced 🔴**

(Full lesson list preserved from v1 — same content, evaluation format upgraded to free-form + DeepSeek feedback.)

---

### Path 4 — The Debug *(Pro, v2)*

*"The AI will break things. This path teaches you to fix them — with words."*
**6 lessons | Intermediate 🟡 → Advanced 🔴**

---

### Path 5 — The Ship *(Pro, v2)*

*"From localhost to the world."*
**8 lessons | Advanced 🔴**

Completing Path 5 unlocks the completion certificate.

---

## Exercise Formats

Promptly uses **three distinct exercise formats** as of V2:

| Format | Path | Tier | Notes |
|---|---|---|---|
| A. Fill-in-the-blank | Path 1-2 | Free | **Legacy V1** — still serves the lessons currently in production. Not used for new V2 lessons. |
| B. Open question + AI commentary | Path 1-2 | Free | **V2 active.** GPT-4o mini comments the user's free-text answer; no scoring, no gating. Plus the special-purpose `archetype_quiz` block for static branching reveals (no API call). |
| C. Free-form prompt + AI evaluation | Path 3-5 | Pro | DeepSeek-rubric scoring (v2 Pro tier, not yet in MVP). |

### A. Fill-in-the-blank (Path 1-2 — V1, legacy)

Used for foundational mechanics where there's a clear "right shape" of answer. Client-side validation against a list of accepted answers (case-insensitive, with synonym support).

```
┌────────────────────────────────────────────────────────┐
│  EXERCISE                              🟢 Beginner      │
│                                                        │
│  Complete the prompt below:                            │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  You are a [___________]. Your task is to        │  │
│  │  build a [___________] using only natural        │  │
│  │  language prompts. Do NOT [___________].         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [ Check answer ]                                      │
└────────────────────────────────────────────────────────┘
```

**Adaptive hint flow (3 attempts):**

1. Wrong → vague hint, asks a question rather than gives the answer
2. Wrong again → specific hint
3. Wrong third time → answer revealed + explanation, lesson marks complete with **−50 XP penalty**

The user can never get stuck. The system always moves forward.

### B. Open question + AI commentary (Path 1-2 — V2, active)

Used in V2 lessons as the engagement layer between blocks of theory.
The user reads a question (e.g. *"Cosa ti spinge a voler programmare?"*),
types a free-text answer into a single input, and on submit the answer
is sent to **OpenAI GPT-4o mini** with a per-question `system_prompt`
versioned inside the lesson JSON. The AI returns a 1-2 sentence comment
that's rendered inline.

Key properties:
- **No scoring, no gating.** The user always advances. The commentary is
  pure engagement / personalization.
- **Per-question system prompt.** Each `open_question` block in the
  lesson JSON carries its own `system_prompt` field. There is no global
  default. See `LESSON-GUIDELINES.md` §11 for the prompt structure.
- **Multiple per lesson.** A V2 lesson can interleave several
  `open_question` blocks with paragraphs of theory.
- **Companion block: `archetype_quiz`.** Static multi-question
  multiple-choice quiz that reveals one of N pre-defined archetypes via
  dominant-answer logic + an explicit `tie_breaker_priority`. No API
  call, but listed here because it lives next to `open_question` blocks
  in the lesson body.
- **Rate limit.** When wired, default cap = 30 commentary calls per user
  per day in MVP (matching the Path 3-5 cap until we observe usage).

### C. Free-form prompt + AI evaluation (Path 3-5 — Pro tier, v2)

Used where there is no single right answer — only better and worse prompts. The user writes their full prompt in a textarea. On submit, the prompt is sent to **DeepSeek** with a rubric:

```
You are evaluating a prompt written by a student of vibe coding.
The student is solving this exercise: <exercise brief>.

Score the prompt on these criteria (1-5 each):
- Role: does it tell the AI what to act as?
- Context: does it provide necessary background?
- Constraints: does it specify what to do AND what not to do?
- Output format: is the desired output explicit?

Return JSON: { scores: {...}, total: 1-20, feedback: "...", suggestion: "..." }
```

The UI then shows:
- 4 small radial gauges (one per criterion)
- A short textual feedback (2-3 sentences)
- A "Show suggested improvement" toggle that reveals a model-rewritten version
- The user can iterate up to 3 times — each iteration is logged for analytics

XP is awarded based on total score: 16-20 = full XP, 11-15 = 75%, ≤10 = 50%.

### Simulated AI output in theory blocks

Even in Free tier, lessons that show "what the AI would respond with" use **pre-scripted output** stored in the lesson JSON — rendered with the `SimulatedOutput` component (terminal styling, fake-typed-in animation). No live LLM call. This keeps the experience tactile without API costs.

---

## Daily Goal System

At signup, the user picks one of three goals:

| Goal | Label | Daily time | Lessons/day |
|---|---|---|---|
| 🌱 Trivial | "Just a taste" | 5 min/day | ~1 short lesson |
| 📘 Easy | "Steady progress" | 10 min/day | ~1–2 lessons |
| 🚀 Pro | "Full focus" | 15 min/day | ~2–3 lessons |

The daily goal determines:
- How full the `DailyGoalRing` needs to be to count as a streak day
- The reminder copy (push + email)
- The dashboard message

Changing the goal takes effect the next day (not mid-streak).

---

## Streak System (with Weekly Freeze)

A streak day is counted when the user completes enough lessons to meet their daily goal before midnight in their local timezone.

### Freeze mechanic (Duolingo-style)

- Every user has **1 freeze per ISO week (Mon-Sun)**, refilling automatically each Monday at 00:00 local time
- If the user misses a day, the freeze is **automatically applied** at the moment the streak would otherwise break — they don't have to claim it
- A freeze "saves" exactly one missed day per week. Two missed days in the same week = streak resets to 0
- The UI shows the freeze status in `StreakDisplay`: ❄️ icon when available, greyed out when used
- Freeze usage is logged in `streak_events` for analytics ("freeze prevented X% of streak losses")

### Reminders

- Push notification (PWA installs): fires at **18:00 local time** if goal not met yet
- Email fallback (everyone else): same time, same copy
- Copy: *"Don't break your streak! [n] minutes left today 🔥"* / *"Hai ancora [n] minuti per la tua streak di oggi 🔥"*

### Milestones

Brief confetti + special toast at: 3, 7, 14, 30, 100 days.
`longest_streak` never resets — it's the user's personal record.

---

## XP System

XP is purely cosmetic — it shows progress and effort but does not unlock content. Content unlocks are based on path completion (free tier) or subscription (Pro tier).

### XP formula

```
lesson_xp = base_xp + difficulty_bonus - attempt_penalty

base_xp:          100 (Beginner) | 150 (Intermediate) | 200 (Advanced)
difficulty_bonus: 0 (Beginner)   | 50 (Intermediate)  | 100 (Advanced)
attempt_penalty:  0 (1st try)    | 0 (2nd try)        | 50 (3rd try, fill-in-blank)

For Path 3-5 free-form exercises:
xp_multiplier = 1.0 (score 16-20) | 0.75 (11-15) | 0.5 (≤10)
```

Display:
- Running total in navbar: `⚡ 2,450 XP`
- XP toast after each lesson: `"+200 XP ⚡"`
- Difficulty bonus: `"+150 XP ⚡ +50 bonus (hard exercise)"`
- XP history visible in Settings

---

## Data Model — TypeScript Types

```typescript
// types/index.ts

export type Language = 'en' | 'it'
export type DailyGoal = 'trivial' | 'easy' | 'pro'
export type PathSlug = 'mindset' | 'prompt' | 'build' | 'debug' | 'ship'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type SubscriptionTier = 'free' | 'pro'
export type SubscriptionPlan = 'monthly' | 'lifetime' | null
export type ExerciseFormat = 'fill_blank' | 'free_form'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  language: Language
  daily_goal: DailyGoal
  current_streak: number
  longest_streak: number
  freeze_available: boolean        // Resets every Monday
  freeze_week_iso: string          // e.g. "2026-W18" — current freeze week
  total_xp: number
  last_activity_date: string       // ISO date
  push_subscription: PushSubscriptionJSON | null
  push_notifications_enabled: boolean
  email_notifications_enabled: boolean
  pwa_installed_at: string | null  // first time we detected PWA install
  subscription_tier: SubscriptionTier
  subscription_plan: SubscriptionPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  pro_since: string | null         // ISO date — first Pro upgrade
  consent_ai_eval: boolean         // GDPR consent for sending prompts to DeepSeek
  created_at: string
  updated_at: string
}

export interface LearningPath {
  id: string
  slug: PathSlug
  order: number                    // 1–5
  tier: SubscriptionTier           // 'free' (Path 1-2) | 'pro' (Path 3-5)
  title_en: string
  title_it: string
  description_en: string
  description_it: string
  lesson_count: number
  estimated_minutes_min: number
  estimated_minutes_max: number
  is_locked: boolean               // computed: prev path not completed OR pro required
  lock_reason: 'sequential' | 'pro' | null
}

export interface Lesson {
  id: string
  path_id: string
  order: number
  title_en: string
  title_it: string
  difficulty: Difficulty
  estimated_minutes: number
  base_xp: number
  difficulty_bonus_xp: number
  exercise_format: ExerciseFormat
  theory_content_en: string        // JSON content (see content schema)
  theory_content_it: string
  exercise: Exercise
}

// --- Exercise variants ---

export interface FillBlankExercise {
  format: 'fill_blank'
  id: string
  lesson_id: string
  prompt_template_en: string       // with [BLANK] markers
  prompt_template_it: string
  blanks: Blank[]
}

export interface FreeFormExercise {
  format: 'free_form'
  id: string
  lesson_id: string
  brief_en: string                 // what the user must write a prompt for
  brief_it: string
  rubric: RubricCriterion[]        // criteria the LLM evaluates against
  example_solution_en: string      // shown after attempt for comparison
  example_solution_it: string
}

export type Exercise = FillBlankExercise | FreeFormExercise

export interface Blank {
  index: number
  correct_answers: string[]        // accepted answers, case-insensitive
  hint_1_en: string
  hint_1_it: string
  hint_2_en: string
  hint_2_it: string
  explanation_en: string
  explanation_it: string
}

export interface RubricCriterion {
  key: 'role' | 'context' | 'constraints' | 'output_format'
  weight: number                   // sums to 1 across criteria
  description_en: string
  description_it: string
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  attempts: number
  xp_earned: number
  // Free-form only:
  evaluation_score: number | null  // 0-20
  evaluation_feedback: string | null
  completed_at: string | null
  created_at: string
}

export interface SavedItem {
  id: string
  user_id: string
  lesson_id: string
  created_at: string
  lesson?: Lesson
}

export interface DailyActivity {
  id: string
  user_id: string
  date: string                     // ISO YYYY-MM-DD
  minutes_studied: number
  xp_earned: number
  goal_met: boolean
  freeze_applied: boolean          // true if a freeze saved this day
  created_at: string
}

export interface StreakEvent {
  id: string
  user_id: string
  type: 'started' | 'extended' | 'frozen' | 'broken' | 'milestone'
  streak_value: number
  occurred_at: string
}
```

---

## Content Storage Strategy

Lesson content (theory + exercises + simulated outputs) is stored as **static JSON files** in `/content`, not in the database.

```
content/
├── en/
│   ├── mindset/
│   │   ├── 01-what-is-vibe-coding.json
│   │   ├── 02-you-are-the-architect.json
│   │   └── ...
│   └── prompt/
│       ├── 01-anatomy-of-a-great-prompt.json
│       └── ...
└── it/
    ├── mindset/
    └── prompt/
```

### Content schema (fill-in-the-blank lesson)

```json
{
  "id": "mindset-01",
  "title": "What is vibe coding?",
  "difficulty": "beginner",
  "estimated_minutes": 5,
  "base_xp": 100,
  "difficulty_bonus_xp": 0,
  "theory": [
    { "type": "paragraph", "text": "Vibe coding is..." },
    { "type": "callout", "text": "Key insight: you describe the outcome, not the steps." },
    { "type": "example", "label": "Example", "text": "Instead of 'Write a for loop'..." },
    {
      "type": "simulated_output",
      "prompt": "Build a contact form that emails me on submit.",
      "output": "Sure — I'll create a Next.js form component with..."
    }
  ],
  "exercise": {
    "format": "fill_blank",
    "prompt_template": "Vibe coding is the practice of building [BLANK] using [BLANK] instead of writing code manually.",
    "blanks": [
      {
        "index": 0,
        "correct_answers": ["software", "applications", "apps", "real software"],
        "hint_1": "Think about what the end result of development is.",
        "hint_2": "It's a general term for what developers build.",
        "explanation": "The correct answer is 'software' or 'applications'..."
      },
      {
        "index": 1,
        "correct_answers": ["natural language", "plain language", "words"],
        "hint_1": "What language does a non-programmer speak?",
        "hint_2": "It's not Python, JavaScript, or any programming language.",
        "explanation": "The answer is 'natural language'..."
      }
    ]
  }
}
```

### Content schema (free-form lesson — Path 3-5, v2)

```json
{
  "id": "build-05",
  "title": "One feature at a time",
  "difficulty": "intermediate",
  "estimated_minutes": 10,
  "base_xp": 150,
  "difficulty_bonus_xp": 50,
  "theory": [...],
  "exercise": {
    "format": "free_form",
    "brief": "You're building a todo app. Write a prompt that asks Claude Code to add ONLY the 'mark as done' feature, without modifying anything else.",
    "rubric": [
      { "key": "role", "weight": 0.2, "description": "Defines who the AI should act as." },
      { "key": "context", "weight": 0.3, "description": "References existing code/files." },
      { "key": "constraints", "weight": 0.3, "description": "Says what NOT to touch." },
      { "key": "output_format", "weight": 0.2, "description": "Specifies how the result should be returned." }
    ],
    "example_solution": "Act as a senior Next.js developer. In our existing /app/todos/page.tsx file, add ONLY the ability to mark a todo as done by clicking a checkbox. Do NOT modify the create or delete logic. Return only the diff for page.tsx and todo.ts. The completion state should persist via the existing Supabase 'todos' table — add a 'done' boolean column."
  }
}
```

---

## Notifications

### Push (PWA installs)

- Service worker registers on first lesson completion
- A `PWAInstallPrompt` component nudges installation after lesson 2 of Path 1
- Push subscriptions stored in `users.push_subscription`
- Sent via Web Push (VAPID keys in env vars)

### Email fallback

- Resend integration (`lib/notifications/email.ts`)
- Same trigger time (18:00 local), same copy
- Sent to all users with `email_notifications_enabled = true` AND `push_subscription IS NULL`

### Cron

- Vercel Cron job at `/api/notifications/cron` runs every 15 minutes
- Picks up users whose local timezone hits 18:00 in that window
- Computes whether goal is met today, sends push or email accordingly

---

## Analytics — PostHog

Event taxonomy (use `lib/analytics/posthog.ts` wrapper, no inline calls):

**Acquisition & Auth**
- `signup_started` `{ method: 'google' | 'email' }`
- `signup_completed` `{ method, language, daily_goal }`
- `login` `{ method }`

**Onboarding**
- `onboarding_language_selected` `{ language }`
- `onboarding_goal_selected` `{ goal }`

**Learning**
- `lesson_started` `{ path_slug, lesson_order, difficulty }`
- `lesson_theory_completed` `{ lesson_id, time_spent_s }`
- `exercise_attempt` `{ lesson_id, attempt: 1-3, correct: bool }`
- `exercise_evaluated` `{ lesson_id, score, total_attempts }` (free-form only)
- `lesson_completed` `{ lesson_id, xp_earned, attempts }`
- `path_completed` `{ path_slug, total_lessons, total_xp }`

**Engagement**
- `streak_extended` `{ days }`
- `streak_frozen` `{ days_saved }`
- `streak_broken` `{ length }`
- `daily_goal_met` `{ goal, minutes }`

**Monetization**
- `paywall_viewed` `{ source: 'path_3_card' | 'lesson_lock' | 'settings' }`
- `checkout_started` `{ plan: 'monthly' | 'lifetime' }`
- `checkout_completed` `{ plan, amount }`
- `subscription_canceled` `{ days_active }`

**PWA & Notifications**
- `pwa_install_prompt_shown`
- `pwa_installed`
- `push_permission_granted` / `push_permission_denied`
- `notification_clicked` `{ type: 'streak_reminder' }`

Funnels to set up day-1: signup → first lesson, lesson 1 → lesson 6 (Path 1 complete), Path 2 complete → paywall view → checkout.

---

## The 5 Screens — Page Responsibilities

### `/dashboard` — Learn

Main home.

- Top bar: greeting + daily goal ring + streak display (with freeze indicator) + total XP + language toggle + Pro badge if subscribed, else "Upgrade" button
- "Continue" card: prominent card showing the last in-progress lesson
- Path cards below: all 5 paths in order. Free paths show progress, Pro paths show purple Pro badge + "Unlock" CTA for free users
- Locked paths (sequential): muted with 🔒 icon
- PWA install prompt: appears once after lesson 2

### `/path/[slug]` — Path Overview

- Path title, description, total XP available
- List of lesson cards: title, difficulty badge, estimated time, completion checkmark, XP value
- Progress bar at top: "4/10 lessons completed"
- "Continue" jumps to first incomplete lesson
- Pro paths for free users: full lesson list visible (transparency!) but each card has Pro lock + paywall CTA

### `/lesson/[id]` — Single Lesson

- Theory phase: rendered from JSON. Supports paragraph, callout, example, code, simulated_output blocks. "Next: Exercise →" at bottom.
- Exercise phase: either `ExerciseFillBlank` or `ExerciseFreeForm` based on `exercise_format`
- Save button (top right), progress indicator, breadcrumb to path
- For Pro lessons accessed by free users: redirect to `/pro` with `source=lesson_lock`

### `/saved` — Saved Items

- List of bookmarked lessons
- Each shows: title, path name, difficulty, "Continue" button, "Remove" action
- Empty state: "No saved lessons yet."

### `/pro` — Upgrade

- Hero: "Ready for the real builds?" + body copy
- Side-by-side plans: Monthly €6.99 vs Lifetime €29 (lifetime highlighted as "Best value")
- 3-bullet feature list: full Path 3-5, AI prompt evaluation, completion certificate
- Stripe Checkout button per plan
- Money-back: 14-day refund policy noted
- After successful checkout: redirect to `/dashboard?welcome=pro` with confetti

### `/settings`

- Account section: name, email, change password
- Language: EN / IT
- Daily goal: radio (Trivial / Easy / Pro)
- Notifications: push toggle, email toggle, time display
- Billing (if Pro): plan, next renewal, "Manage in Stripe" link, cancel
- Privacy: GDPR consent for AI evaluation toggle (required for Path 3-5 use)
- Danger zone: delete account

---

## Rules for Claude Code

1. **NEVER** hardcode UI strings in components. Use `lib/i18n/`.
2. **NEVER** write DB queries directly in components. All Supabase queries live in `lib/supabase/queries.ts`.
3. **NEVER** edit files inside `components/ui/` — those are shadcn base components.
4. **NEVER** call DeepSeek or Stripe directly in components. Use `lib/ai/deepseek.ts` and `lib/stripe/`.
5. **NEVER** use `any` in TypeScript.
6. **ALWAYS** define types in `types/index.ts` before using them.
7. **ALWAYS** handle loading and error states in every component that fetches data.
8. **ALWAYS** use CSS variables from the design system — never hardcode color hex values.
9. **ALWAYS** check `subscription_tier` server-side before serving Path 3-5 content. Never trust client-side gating alone.
10. Lesson content comes from static JSON files in `/content`, NOT from the database.
11. User progress, streak, freezes, XP, subscription IS stored in the database.
12. XP calculation logic lives exclusively in `lib/xp.ts`.
13. Streak + freeze logic lives exclusively in `lib/streak.ts`.
14. **V1 only:** fill-in-the-blank answer checking is client-side (answers in JSON for instant feedback). **V2:** the `open_question` block has no client-side validation — submission goes through the open-question API route → GPT-4o mini → returns a textual comment. The user always advances. The `archetype_quiz` reveal is fully client-side static logic (no API).
15. Path 3-5 free-form prompt evaluation goes through `app/api/evaluate/route.ts` → DeepSeek. V2 Path 1-2 commentary goes through a separate route (e.g. `app/api/comment-answer/route.ts`) → OpenAI GPT-4o mini. Rate-limit per user (default 30/day in MVP for both).
16. **System prompts for V2 `open_question` are per-lesson**, stored inside the lesson JSON (`open_question.system_prompt`). Never define a global default; never silently substitute a fallback prompt at runtime — fail loudly if the field is missing.
17. PostHog events go through `lib/analytics/posthog.ts` — never call `posthog.capture` directly.
18. Stripe webhooks are the source of truth for subscription state. Never update `subscription_tier` from client-side success redirects.

---

## Curriculum Sources (reference, not copy)

- `roadmap.sh/vibe-coding` — technical backbone, Claude Code guide
- `producttalk.org/vibe-coding-best-practices` — planning, doom loop concept
- `creatoreconomy.so/p/12-rules-to-vibe-code-without-frustration` — practical rules
- `hostinger.com/tutorials/vibe-coding-best-practices` — prompt comparison examples

Content must be rewritten and transformed into exercises — never copied verbatim.

---

## Project Status Checklist

### Phase 1 — MVP (Path 1 + Path 2 only)

- [ ] Next.js + Supabase + Tailwind + shadcn setup
- [ ] PWA manifest + service worker
- [ ] Auth: email + Google OAuth
- [ ] Onboarding: language + daily goal
- [ ] Dashboard with all 5 paths (Path 3-5 marked Pro)
- [ ] Path overview page
- [ ] Lesson page — theory phase with simulated outputs
- [ ] Lesson page — fill-in-the-blank exercise + adaptive hints
- [ ] XP system + toast
- [ ] Streak system + weekly freeze
- [ ] Daily goal ring
- [ ] Save/bookmark
- [ ] Settings (language, goal, notifications, billing stub)
- [ ] Push notifications + email fallback (Resend)
- [ ] PostHog wired to all event taxonomy
- [ ] Stripe Checkout (monthly + lifetime) + webhook
- [ ] Paywall on Path 3-5 cards
- [ ] Path 1 (6 lessons) — content EN + IT
- [ ] Path 2 (8 lessons) — content EN + IT
- [ ] Privacy policy + GDPR consent flow
- [ ] Deploy on Vercel

### Phase 2 — Pro content

- [ ] Path 3 (10 lessons) — content EN + IT
- [ ] Path 4 (6 lessons) — content EN + IT
- [ ] Path 5 (8 lessons) — content EN + IT
- [ ] Free-form exercise component + DeepSeek integration
- [ ] AI evaluation rate-limiting + cost monitoring
- [ ] Certificate generation (`@react-pdf/renderer`)
- [ ] LinkedIn share for certificate
- [ ] Streak milestone celebrations (3, 7, 14, 30, 100 days)

---

*Version: 2.1 — Updated 29 April 2026 (brand color + logo assets).*
*Update this file whenever architecture, naming, curriculum, or design system changes.*
