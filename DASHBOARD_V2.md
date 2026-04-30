# PROMPTLY — Dashboard V2 Design Spec

> Design document per la rivisitazione della dashboard: mappa visiva, robot avatar, sistema livelli XP, bonus path, referral.
> Da leggere insieme a `PROMPTLY.md` (single source of truth).
> Versione 1.0 — 30 April 2026.

---

## Panoramica delle novità

| Componente | V1 | V2 |
|---|---|---|
| Visualizzazione path | Lista card verticale | Mappa visiva scrollabile (stile Mimo) |
| Profilo utente | Iniziali o avatar generico | Robot avatar che evolve con il livello XP |
| Path disponibili | Solo 5 path canoniche | 5 path principali + 8 bonus path sbloccabili |
| Gamification | Streak + XP cosmetic | Streak + XP + livelli + robot + referral |
| Social | Assente | Referral link con XP reward su conversione |

---

## 1. Mappa Visiva (Learning Map)

### Concept

La dashboard principale sostituisce la lista di PathCard con una **mappa verticale scrollabile** ispirata a Mimo. La mappa è un SVG interattivo che mostra il percorso completo di apprendimento come un "mondo" con zone distinte per ogni path.

Il cursore dell'utente (il suo robot avatar) si trova sempre sopra l'ultimo nodo completato — avanza visivamente mano a mano che completa lezioni.

### Layout generale della mappa

```
┌─────────────────────────────────────────────────────┐
│  [TOP BAR: robot avatar + level + streak + XP]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│   🌟 PATH 5 — SHIP        [zona: spazio/cosmico]    │
│        ○ — ○ — ○ — ○ — ○ — ○ — ○ — ○              │
│                           ↖ bonus branch           │
│                        ┌──[PathS]──[PathT]          │
│                                                     │
│   🔴 PATH 4 — DEBUG      [zona: industriale]        │
│        ○ — ○ — ○ — ○ — ○ — ○                       │
│                 ↙ bonus branch                     │
│            [PathQ]──[PathR]                         │
│                                                     │
│   🟡 PATH 3 — BUILD       [zona: urbana]            │
│        ○ — ○ — ○ — ○ — ○ — ○ — ○ — ○ — ○ — ○     │
│              ↗ bonus branch                        │
│        [PathZ]──[PathW]                             │
│                                                     │
│   🟢 PATH 2 — PROMPT      [zona: foresta]           │
│        ○ — ○ — ○ — ○ — ○ — ○ — ○ — ○              │
│                                   ↘ bonus branch   │
│                               [PathX]──[PathY]      │
│                                                     │
│   🟢 PATH 1 — MINDSET     [zona: villaggio/start]   │
│        ★ — ○ — ○ — ○ — ○ — ○                       │
│        ↑ START                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

La mappa scorre **dal basso verso l'alto** (come salire di livello letteralmente). Path 1 è in basso, Path 5 in cima.

### Nodi della mappa

Ogni nodo corrisponde a una **lezione**. I nodi sono cerchi cliccabili/toccabili:

| Stato | Aspetto | Interazione |
|---|---|---|
| Completato | Cerchio pieno con ✓, colore path | Click → apre lesson (revisione) |
| Corrente | Cerchio con pulse animation, colore brand orange | Click → apre lesson |
| Prossimo disponibile | Cerchio outline, leggermente evidenziato | Click → apre lesson |
| Bloccato (sequenziale) | Cerchio grigio con 🔒 | Click → tooltip "Completa la lezione precedente" |
| Bloccato (Pro) | Cerchio viola con 👑 | Click → modal paywall |
| Bonus (bloccato) | Stella grigia ⭐ con tooltip sblocco | Click → mostra condizione sblocco |
| Bonus (disponibile) | Stella arancione ⭐ pulsante | Click → apre bonus path overview |
| Bonus (completato) | Stella dorata ✨ | Click → apre bonus path (revisione) |

### Path sections — design visivo

Ogni path ha una **zona/bioma** con colori e texture di sfondo leggeri:

| Path | Bioma | Palette sfondo |
|---|---|---|
| Path 1 — Mindset | Villaggio di partenza 🏡 | Verde chiaro, terreno, erba |
| Path 2 — Prompt | Foresta 🌲 | Verde scuro, foglie stilizzate |
| Path 3 — Build | Città 🏙️ | Grigio-blu, edifici geometrici |
| Path 4 — Debug | Industria / Officina 🔧 | Grigio scuro, texture metallica |
| Path 5 — Ship | Spazio 🚀 | Blu notte, stelle, nebulose |
| Bonus Paths | Isole galleggianti ✨ | Sfondo dorato/ambra, staccate |

Le zone di sfondo sono **CSS gradient + pattern SVG leggeri** — nessuna immagine pesante. Le bonus path si trovano su "isole" visivamente staccate dalla path principale, raggiungibili via un ponte o un portale.

### Comportamento responsive

- **Mobile (< 768px):** mappa scrollabile verticalmente, nodi ≥ 48px (touch target), zoom pinch-to-zoom opzionale
- **Desktop (≥ 768px):** mappa in un container con altezza fissa e scroll interno, oppure full-height con sticky top bar
- Il robot avatar dell'utente "cammina" fino al nodo corrente con una breve animazione CSS ad ogni nuovo completamento

### Componenti necessari

```
components/promptly/
├── LearningMap.tsx           # Contenitore principale della mappa
├── MapSection.tsx            # Zona/bioma di ogni path con sfondo
├── MapNode.tsx               # Singolo nodo lezione (cliccabile)
├── MapNodeBonus.tsx          # Nodo bonus (stella, con logica sblocco diversa)
├── MapBonusBranch.tsx        # Il "ponte" visivo verso le bonus path
├── MapRobotCursor.tsx        # Il robot dell'utente che si posiziona sul nodo corrente
└── MapUnlockTooltip.tsx      # Tooltip/modal che mostra condizione di sblocco
```

### Coordinate nodi

Le posizioni x/y dei nodi nella mappa sono definite come **percentuali relative** alla larghezza della sezione, storicizzate in `content/map-layout.json`. La mappa è generata da questo file + dati del curriculum. Questo consente di aggiustare il layout visivo senza toccare il codice.

```json
// content/map-layout.json (struttura)
{
  "paths": [
    {
      "slug": "mindset",
      "section_height": 300,
      "nodes": [
        { "lesson_order": 1, "x": 0.15, "y": 0.85 },
        { "lesson_order": 2, "x": 0.35, "y": 0.65 },
        ...
      ]
    }
  ],
  "bonus_paths": [
    {
      "slug": "path-x",
      "branch_from_path": "prompt",
      "branch_from_lesson_order": 8,
      "x_offset": 0.75,
      "nodes": [...]
    }
  ]
}
```

---

## 2. Robot Avatar e Sistema Livelli XP

### Concept

L'avatar dell'utente in dashboard è un **robot** che evolve visivamente con il livello XP. Non è un avatar personalizzato — è un personaggio che "cresce" mano a mano che l'utente impara. Il robot appare:
- In top bar della dashboard (piccolo, 40px)
- Nella pagina profilo/impostazioni (grande, 120px)
- Sul nodo corrente nella mappa (micro, 32px, con piccola animazione idle)

### Libreria consigliata: DiceBear Bottts

[DiceBear](https://dicebear.com) (`@dicebear/collection` + `@dicebear/core`) genera SVG deterministici di robot. È open-source, NPM-installabile, funziona server-side (no CDN calls in produzione).

Il piano: **7 seed fissi predefiniti** — uno per ogni livello. Il robot dell'utente al livello 3 è sempre lo stesso robot per tutti gli utenti al livello 3. L'identità personale è data dal nome/streak, non dal robot. Il robot è il "grado" visibile.

```bash
npm install @dicebear/core @dicebear/collection
```

```typescript
// lib/avatar.ts
import { createAvatar } from '@dicebear/core'
import { bottts } from '@dicebear/collection'

// Seed fisso per ogni livello — scelti manualmente per aspetto progressivamente
// più "avanzato" (più componenti, colori più ricchi)
const LEVEL_SEEDS: Record<number, string> = {
  1: 'init-rookie-v1',
  2: 'byte-explorer-v1',
  3: 'circuit-coder-v1',
  4: 'nexus-engineer-v1',
  5: 'vertex-builder-v1',
  6: 'apex-master-v1',
  7: 'omega-architect-v1',
}

export function getRobotSvg(level: number): string {
  const seed = LEVEL_SEEDS[level] ?? LEVEL_SEEDS[1]
  const avatar = createAvatar(bottts, { seed, size: 128 })
  return avatar.toString()
}
```

> **Nota a lungo termine:** quando Promptly raggiunge un buon numero di utenti Pro, commissionare 7 robot illustrati custom (stile flat, palette brand) che sostituiranno i DiceBear. I seed restano come fallback. I robot custom avranno nomi e personalità coerenti con il brand.

### Tabella dei 7 livelli

| Livello | XP minimo | Nome robot | Titolo EN | Titolo IT |
|---------|-----------|------------|-----------|-----------|
| 1 | 0 | INIT | Prompt Rookie | Apprendista Prompt |
| 2 | 500 | BYTE | Prompt Explorer | Esploratore AI |
| 3 | 1.200 | CIRCUIT | Vibe Coder | Vibe Coder |
| 4 | 2.500 | NEXUS | Prompt Engineer | Ingegnere Prompt |
| 5 | 4.000 | VERTEX | AI Builder | Costruttore AI |
| 6 | 6.000 | APEX | Master Builder | Maestro Builder |
| 7 | 10.000 | OMEGA | Vibe Architect | Architetto Vibe |

### UX del level-up

Quando l'utente supera la soglia XP di un nuovo livello, scatta un **level-up modal** (una tantum):
- Robot animato (zoom-in da piccolo a grande)
- Titolo: *"Sei diventato [Titolo]!"*
- Sottotitolo: *"Il tuo robot si è evoluto in [NOME ROBOT]"*
- Se una bonus path si è sbloccata con questo livello: preview della nuova path con CTA "Esplora ora"
- CTA principale: "Continua a imparare"

Confetti standard + suono opzionale (come per path complete).

### Componenti necessari

```
components/promptly/
├── RobotAvatar.tsx       # SVG del robot per il livello corrente (size prop: sm/md/lg)
├── LevelBadge.tsx        # Badge "[CIRCUIT] Vibe Coder" con robot thumbnail
├── LevelUpModal.tsx      # Modal celebrativo al level-up
└── XPProgressBar.tsx     # Barra XP corrente → prossimo livello (in top bar)
```

### XP verso prossimo livello — top bar

La top bar mostra, accanto al robot:
```
[ROBOT 40px]  CIRCUIT — Vibe Coder
              ⚡ 1.850 / 2.500 XP  [░░░░░████████░░░] → NEXUS
```

---

## 3. Bonus Path — Catalogo completo

### Logica generale

Le bonus path sono **percorsi brevi e pratici** (3-5 lezioni) separati dalla path principale. Nella mappa appaiono come **isole** raggiungibili via un ponte/ramo. Non sono obbligatorie per la progressione — sono ricompense per gli utenti più engagé.

Le condizioni di sblocco sono di tre tipi:
- **XP threshold** — raggiungi una soglia di esperienza
- **Achievement** — completa una sfida specifica (es. streak 7 giorni, finisci una path senza hint)
- **Social** — porta un amico a iscriversi tramite il tuo referral

### PathX — Prima bonus path (post Path 2)

| Campo | Valore |
|---|---|
| Slug | `path-x` |
| Titolo IT | Non finire mai i token: best practice con Claude Code |
| Titolo EN | Never run out of tokens: Claude Code best practices |
| Difficoltà | 🟢 Beginner |
| Lezioni | 4 |
| Tempo stimato | 20-30 min |
| Tier | Free (bonus path gratuite per tutti) |
| **Sblocco** | **XP ≥ 600 + Path 2 completata** |
| Posizione mappa | Isola a destra di Path 2, nodo 8 |

Argomenti lezioni: context window e come funziona, dividere task grandi in task piccoli, usare file di contesto (CLAUDE.md base), quando ripartire da zero vs continuare.

---

### PathY — Seconda bonus path (post Path 2)

| Campo | Valore |
|---|---|
| Slug | `path-y` |
| Titolo IT | Cosa sono gli agenti e come si usano |
| Titolo EN | What are agents and how to use them |
| Difficoltà | 🟡 Intermediate |
| Lezioni | 5 |
| Tempo stimato | 30-40 min |
| Tier | Free |
| **Sblocco** | **≥ 1 referral convertito** (vedi §4 Referral) |
| Posizione mappa | Isola a sinistra di Path 2, nodo 8 (simmetrica a PathX) |

Argomenti lezioni: differenza agent mode vs chat, come funziona il loop agente, quando usare un agente vs un singolo prompt, tool calls e permessi, esempi pratici di task agentici.

---

### PathZ — Post Path 3

| Campo | Valore |
|---|---|
| Slug | `path-z` |
| Titolo IT | Il CLAUDE.md perfetto: dai all'AI il contesto che merita |
| Titolo EN | The perfect CLAUDE.md: give your AI the context it deserves |
| Difficoltà | 🟡 Intermediate |
| Lezioni | 4 |
| Tier | Pro (bonus avanzate richiedono Pro) |
| **Sblocco** | **XP ≥ 2.500** |
| Posizione mappa | Isola sinistra di Path 3 |

---

### PathW — Post Path 3

| Campo | Valore |
|---|---|
| Slug | `path-w` |
| Titolo IT | Prompt per il design: UI belle al primo tentativo |
| Titolo EN | Design prompting: beautiful UI on the first try |
| Difficoltà | 🟡 Intermediate |
| Lezioni | 4 |
| Tier | Pro |
| **Sblocco** | **Path 3 completata + XP ≥ 2.500** |
| Posizione mappa | Isola destra di Path 3 |

---

### PathQ — Post Path 4

| Campo | Valore |
|---|---|
| Slug | `path-q` |
| Titolo IT | Git per vibe coder: versioni e backup senza paura |
| Titolo EN | Git for vibe coders: versions and backups without fear |
| Difficoltà | 🟡 Intermediate |
| Lezioni | 4 |
| Tier | Pro |
| **Sblocco** | **XP ≥ 4.000** |
| Posizione mappa | Isola sinistra di Path 4 |

---

### PathR — Post Path 4

| Campo | Valore |
|---|---|
| Slug | `path-r` |
| Titolo IT | Costruisci il tuo MCP: aggiungi superpoteri all'AI |
| Titolo EN | Build your own MCP: add superpowers to your AI |
| Difficoltà | 🔴 Advanced |
| Lezioni | 5 |
| Tier | Pro |
| **Sblocco** | **XP ≥ 4.000 + streak ≥ 7 giorni consecutivi (qualsiasi momento)** |
| Posizione mappa | Isola destra di Path 4 |

---

### PathS — Post Path 5

| Campo | Valore |
|---|---|
| Slug | `path-s` |
| Titolo IT | Da app a SaaS: aggiungi pagamenti in 30 minuti |
| Titolo EN | From app to SaaS: add payments in 30 minutes |
| Difficoltà | 🔴 Advanced |
| Lezioni | 5 |
| Tier | Pro |
| **Sblocco** | **XP ≥ 6.000** |
| Posizione mappa | Isola sinistra di Path 5 |

---

### PathT — Post Path 5 (endgame)

| Campo | Valore |
|---|---|
| Slug | `path-t` |
| Titolo IT | La tua Prompt Library: arsenale riusabile per ogni progetto |
| Titolo EN | Your Prompt Library: a reusable arsenal for every project |
| Difficoltà | 🔴 Advanced |
| Lezioni | 6 |
| Tier | Pro |
| **Sblocco** | **Tutte e 5 le path principali completate** (achievement, non XP) |
| Posizione mappa | Isola centrale sopra Path 5 — posizione "endgame" sulla mappa |

PathT è la path finale — una raccolta curata dei migliori pattern di prompt visti in tutto il corso, da cui costruire la libreria personale dell'utente.

---

### Riepilogo unlock conditions

| Path | Sblocco | Tipo |
|---|---|---|
| PathX | XP ≥ 600 + Path 2 completata | XP threshold |
| PathY | ≥ 1 referral convertito | Social |
| PathZ | XP ≥ 2.500 | XP threshold |
| PathW | Path 3 completata + XP ≥ 2.500 | XP + achievement |
| PathQ | XP ≥ 4.000 | XP threshold |
| PathR | XP ≥ 4.000 + streak 7+ giorni | XP + achievement |
| PathS | XP ≥ 6.000 | XP threshold |
| PathT | Tutte le 5 path principali complete | Achievement |

---

## 4. Sistema Referral

### Il dubbio risolto: share vs conversione

**Non puoi tracciare se un utente ha condiviso un link.** Non tecnicamente possibile senza accesso al clipboard o ai social network dell'utente (e sarebbe un incubo privacy/GDPR).

**Quello che puoi tracciare:** se qualcuno si è iscritto usando il tuo codice referral. La soluzione è non premiare lo share ma la conversione.

### Meccanica

1. Ogni utente ha un **codice referral univoco** generato al signup (es. `STEFANO-4F2A`), stored su `users.referral_code`
2. Il link è: `https://learnpromptly.app/signup?ref=STEFANO-4F2A`
3. L'utente copia il link dalla dashboard (sezione "Invita un amico" o da Settings)
4. Quando qualcuno si iscrive con `?ref=STEFANO-4F2A`:
   - Il referral viene registrato in `user_referrals` (referrer_id, referee_id, created_at)
   - Il referrer riceve **+300 XP** (abbastanza da avvicinarsi alla soglia PathY se non ci è già)
   - Il referee riceve **+50 XP bonus** di benvenuto ("Ti ha invitato un amico!")
5. **PathY si sblocca** quando `user_referrals.count(referrer_id) >= 1`

### XP sul "generate link" (elemento di fiducia)

Per ridurre la frustrazione degli utenti che condividono ma non convertono: quando l'utente **genera/copia il link per la prima volta**, riceve +25 XP con il messaggio *"Link referral attivato! Guadagni 300 XP ogni volta che un amico si iscrive."* Questo è un atto di fiducia simbolico, ma non è abbastanza per sbloccare PathY da solo.

### UI del referral

In dashboard (sotto le path, o in una sezione "La tua community"):
```
┌────────────────────────────────────────────────────┐
│  🤝 Invita un amico                                │
│  Quando si iscrive, voi due guadagnate XP extra.   │
│                                                    │
│  Il tuo link:                                      │
│  [https://learnpromptly.app/signup?ref=STEFANO-4F2A]    │
│                     [Copia link]  [Condividi]      │
│                                                    │
│  👥 Amici invitati: 0/1 per sbloccare PathY        │
│  ⭐ PathY: "Cosa sono gli agenti e come si usano"  │
│     Manca 1 iscrizione → [Invita ora]              │
└────────────────────────────────────────────────────┘
```

Il bottone "Condividi" usa la **Web Share API** (`navigator.share`) dove disponibile (mobile) con fallback a clipboard.

### Prevenzione abuse

- Un codice referral non può essere usato sulla stessa email del referrer
- Rate limit: max 10 referral XP reward per account (anti-farm) — ma è difficile che un utente onesto ci arrivi
- I referral da email disposables o indirizzi identici vengono ignorati silenziosamente

---

## 5. Delta Data Model

Modifiche al data model esistente in `PROMPTLY.md`.

### Tabella `users` — nuovi campi

```typescript
// Aggiungere a UserProfile in types/index.ts

referral_code: string              // Generato al signup, es. "STEFANO-4F2A"
referral_link_activated_at: string | null  // Prima volta che ha copiato il link
total_referrals_converted: number  // Cache counter per performance
xp_level: number                   // Livello calcolato (1-7), cached/computed
last_level_up_notified: number     // Ultimo livello per cui è stato mostrato il modal
```

### Nuova tabella `user_referrals`

```sql
create table user_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references users(id) on delete cascade,
  referee_id uuid references users(id) on delete cascade,
  xp_awarded_referrer integer default 300,
  xp_awarded_referee integer default 50,
  created_at timestamptz default now(),
  unique(referee_id)  -- un utente può essere referral di una sola persona
);
```

### Estensione `learning_paths` — bonus path

```typescript
// Aggiungere a LearningPath in types/index.ts

is_bonus: boolean                  // true per PathX, PathY, ..., PathT
unlock_condition: UnlockCondition | null

// Nuovo tipo:
export interface UnlockCondition {
  type: 'xp_threshold' | 'achievement' | 'social' | 'composite'
  xp_required?: number
  achievement_key?: 'path_completed' | 'streak_7' | 'all_paths_completed'
  achievement_path_slug?: PathSlug
  social_type?: 'referral_converted'
  social_min_count?: number
  // composite: AND di più condizioni
  all_of?: UnlockCondition[]
}
```

### Nuova tabella `map_layout`

I dati di posizione dei nodi nella mappa sono in file JSON statici (`content/map-layout.json`), non nel DB. Non serve una tabella per questo.

### Nuovi eventi PostHog

```
map_node_clicked               { lesson_id, path_slug, is_bonus }
map_bonus_path_unlock_viewed   { path_slug, unlock_type }
level_up                       { from_level, to_level, robot_name, total_xp }
referral_link_copied           { source: 'dashboard' | 'settings' | 'share_api' }
referral_converted             { referrer_id_hashed, xp_awarded }
bonus_path_unlocked            { path_slug, unlock_type, total_xp_at_unlock }
bonus_path_started             { path_slug }
```

---

## 6. Componenti — Mappa completa V2

Aggiornamento alla struttura componenti di `PROMPTLY.md`:

```
components/promptly/
├── [ESISTENTI — invariati]
│   ├── ProgressBar.tsx
│   ├── StreakDisplay.tsx
│   ├── ExerciseFillBlank.tsx
│   ├── ExerciseFreeForm.tsx
│   ├── HintBox.tsx
│   ├── XPToast.tsx
│   ├── DailyGoalRing.tsx
│   ├── SaveButton.tsx
│   ├── LanguageToggle.tsx
│   ├── PWAInstallPrompt.tsx
│   ├── ProLockCard.tsx
│   └── SimulatedOutput.tsx
│
├── [DEPRECATI in V2]
│   ├── PathCard.tsx          → sostituito dalla mappa
│   └── LessonCard.tsx        → sostituito da MapNode (riusato nella path overview)
│
└── [NUOVI V2]
    │
    ├── # MAPPA
    ├── LearningMap.tsx           # Contenitore mappa, gestisce scroll + layout zone
    ├── MapSection.tsx            # Zona bioma per ogni path (sfondo + gradient)
    ├── MapNode.tsx               # Nodo singola lezione (stati: done/current/next/locked)
    ├── MapNodeBonus.tsx          # Nodo stella per bonus path
    ├── MapBonusBranch.tsx        # Connettore visivo dalla path principale alla bonus
    ├── MapRobotCursor.tsx        # Robot animato sul nodo corrente
    ├── MapUnlockTooltip.tsx      # Tooltip/popover con condizione sblocco
    │
    ├── # ROBOT AVATAR & LIVELLI
    ├── RobotAvatar.tsx           # SVG DiceBear bottts per il livello (size: sm/md/lg)
    ├── LevelBadge.tsx            # "[CIRCUIT] Vibe Coder" con robot thumb
    ├── LevelUpModal.tsx          # Modal celebrativo level-up
    ├── XPLevelBar.tsx            # Barra XP corrente → prossimo livello
    │
    ├── # REFERRAL
    ├── ReferralCard.tsx          # Card "Invita un amico" in dashboard
    └── ReferralShareButton.tsx   # Bottone con Web Share API + fallback clipboard
```

### Aggiornamenti a pagine esistenti

**`app/(app)/dashboard/page.tsx`:**
- Top bar: aggiunge `<LevelBadge>` + `<XPLevelBar>` accanto a streak e XP totale
- Contenuto principale: sostituisce PathCard list con `<LearningMap>`
- Sotto la mappa: `<ReferralCard>` (collassabile)

**`app/(app)/settings/page.tsx`:**
- Nuova sezione "Profilo": mostra `<RobotAvatar size="lg">` + livello + titolo
- Nuova sezione "Referral": link + statistiche conversioni

---

## 7. Implementazione — Roadmap fasi

### Fase 1 — Robot avatar e livelli XP (Quick win, bassa complessità)

- [ ] Installare `@dicebear/core` + `@dicebear/collection`
- [ ] Creare `lib/levels.ts` con lookup table XP → livello
- [ ] Creare `RobotAvatar.tsx` usando DiceBear bottts con seed per livello
- [ ] Creare `LevelBadge.tsx` e `XPLevelBar.tsx`
- [ ] Aggiornare top bar dashboard con badge + barra
- [ ] Aggiungere sezione profilo robot in Settings
- [ ] Creare `LevelUpModal.tsx` con trigger su XP update
- [ ] Aggiungere campi `xp_level` e `last_level_up_notified` a UserProfile
- [ ] Migration Supabase: aggiungere colonna `referral_code`, `xp_level`, `last_level_up_notified`

### Fase 2 — Sistema referral

- [ ] Generare `referral_code` univoco al signup (`nanoid` o simile)
- [ ] Creare tabella `user_referrals` in Supabase
- [ ] Aggiornare `/signup` per leggere `?ref=` e registrare referral
- [ ] Creare `app/api/referral/route.ts` per XP award + PathY unlock
- [ ] Creare `ReferralCard.tsx` + `ReferralShareButton.tsx`
- [ ] Aggiungere sezione referral in dashboard e settings
- [ ] Wiring PostHog eventi referral

### Fase 3 — Bonus path data model

- [ ] Aggiungere campi `is_bonus` + `unlock_condition` a `LearningPath`
- [ ] Aggiungere tipo `UnlockCondition` a `types/index.ts`
- [ ] Creare `lib/unlock.ts` con logica `checkUnlockCondition(userId, condition)` 
- [ ] Migration Supabase: aggiungere colonne bonus a `learning_paths`
- [ ] Seed delle 8 bonus path in DB (senza contenuto lezioni — placeholder "Coming soon")
- [ ] Creare endpoint `app/api/unlock/check/route.ts`

### Fase 4 — Mappa visiva (Alta complessità — fare in sprint dedicato)

- [ ] Creare `content/map-layout.json` con coordinate x/y per tutti i nodi (5 path + 8 bonus)
- [ ] Creare `MapSection.tsx` con CSS gradient + pattern SVG per ogni bioma
- [ ] Creare `MapNode.tsx` con tutti gli stati (fatto/corrente/prossimo/bloccato/bonus)
- [ ] Creare `MapBonusBranch.tsx` — connettore visivo
- [ ] Creare `MapRobotCursor.tsx` con idle animation
- [ ] Assemblare `LearningMap.tsx`
- [ ] Sostituire PathCard list in dashboard con LearningMap
- [ ] Test touch su iOS + Android (nodi ≥ 48px)
- [ ] Test performance mappa su mobile (SVG vs canvas decision)
- [ ] Animazione "avanzamento" robot al completamento lezione

### Fase 5 — Contenuto bonus path

- [ ] Scrivere contenuto PathX (4 lezioni, Free) EN + IT
- [ ] Scrivere contenuto PathY (5 lezioni, Free) EN + IT
- [ ] Scrivere contenuto PathZ, PathW (Pro, post Path 3 launch)
- [ ] Scrivere contenuto PathQ, PathR (Pro, post Path 4 launch)
- [ ] Scrivere contenuto PathS, PathT (Pro, post Path 5 launch)

---

## 8. Decisioni aperte

| Decisione | Opzioni | Raccomandazione |
|---|---|---|
| Mappa SVG vs Canvas | SVG: più facile, accessibile. Canvas: più performante per mappe grandi. | **SVG** per MVP — semplice da implementare e animare con CSS. Rivalutare se si aggiungono path animate complesse. |
| Robot: DiceBear vs custom | DiceBear: pronto subito. Custom: più coerente col brand. | **DiceBear bottts al lancio**, commissiona i custom robot quando hai 200+ utenti attivi. |
| Bonus path Tier | PathX e PathY free, le altre Pro. | **Confermato.** PathX e PathY sono parte del funnel retention free — non metterle dietro paywall. |
| PathY sblocco referral | 1 referral o 2+ referral? | **1 referral.** La prima conversione è già una barriera alta — non alzarla. |
| Animazione robot su mappa | CSS idle loop o nessuna? | CSS idle loop (leggero bob/blink) — aggiunge vita senza peso. |

---

*Dashboard V2 — versione 1.0. Aggiorna questo file quando vengono prese decisioni su design o implementazione.*
*Riferimento: `PROMPTLY.md` v2.2 per data model base, design system, e curriculum.*
