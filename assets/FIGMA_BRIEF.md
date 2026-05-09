# Promptly — Brief asset per Figma

Documento operativo per rifare in Figma (Make / AI / a mano) il logo Promptly + tutte le sue varianti e tutti gli asset visivi presenti nella home della landing.

Le sezioni sono pensate per essere copia-incollate **una alla volta** come prompt nel pannello Figma Make / AI. Il blocco "Sistema brand" va sempre incollato per primo (definisce palette + tipografia + regole) — gli altri prompt presuppongono che quel contesto sia attivo.

---

## 0. Sistema brand (incolla sempre per primo)

```
Brand: Promptly. Italian edtech app that teaches non-developers how to think and
build with AI. Tone: warm, intelligent, calm, hand-crafted. Not corporate, not
"techy neon". Vibe: "Duolingo per AI" + "Aceternity-style minimal" + "il calore
di un'illustrazione Notion".

Use these design tokens, no others:

PALETTE
- Primary orange:        #E8703F   (the brand pivot)
- Primary hover (deeper):#C8521F
- Primary light (cream): #FFF4EF
- Primary deep (rust):   #A23E12
- Background:            #FAFAFA
- Surface:               #FFFFFF
- Surface muted:         #F5F5F5
- Border:                #E5E5E5
- Text primary:          #0A0A0A
- Text secondary:        #525252
- Text muted:            #A3A3A3
- Success:               #16A34A   (only for confirmations)
- Warning gold:          #EAB308   (XP)
- Pro purple:            #7C3AED   (only for Pro tier badge)

TYPOGRAPHY
- Headings / wordmark: Plus Jakarta Sans, Bold, letter-spacing +2 on caps.
- UI / body:           Inter, 400 / 500 / 600.
- Mono / code:         JetBrains Mono.
Wordmark "PROMPTLY" must always be ALL CAPS in Plus Jakarta Sans Bold,
letter-spacing 2px.

GEOMETRY
- Stroke 2 / 2.5 px on a 48px artboard, scale proportional.
- Radii: 8 small, 14 medium, 999 pill.
- All shapes must have rounded ends (stroke-linecap: round, linejoin: round).
- No drop shadow on the logo. No gradients on the logo. Ever.
- Icons live in a 48x48 viewBox with a 4px safety padding.

DO / DON'T
- DO use flat fills, optical balance, generous white space.
- DO keep the "smile" in the brain mark: it is the brand's signature gesture.
- DON'T use neon, glitch, holographic, AI-blob, or chrome aesthetics.
- DON'T add tagline lockups except for the OG image.
- Export everything as SVG, geometry only (no rasters, no filters).
```

---

## 1. Logo Promptly — concept master

Da incollare **subito dopo** il blocco "Sistema brand". Definisce il nuovo simbolo che poi tutte le varianti riusano.

```
Redesign the Promptly logo. Keep the existing concept — a stylized lowercase /
uppercase "P" whose internal counter (the round hole) hosts a tiny smiling
brain — but elevate it. Today's version reads as a placeholder; we want a final
mark that is geometric, confident, and still warm.

Concept rules:
1. The "P" is the silhouette. Build it with the same skeleton as a Plus Jakarta
   Sans Bold capital P, but custom-drawn so the counter is a true circle (not
   a kerning artifact). The vertical stem ends with a soft, quasi-rectangular
   foot that hints at "grounded thinking".
2. Inside the counter: a brain rendered as 4-6 elegant strokes, not a literal
   organ. Two hemispheres, three wrinkles per side, and a single curved
   "smile" stroke at the bottom — the smile is non-negotiable, it is the
   brand's signature.
3. The brain must read as "spark of thought" at 24px and as "smiling brain"
   at 96px+. Optical-test both sizes.
4. Single colour: #E8703F on transparent. The brain and its smile share the
   same orange. The counter stays empty (background shows through), so the
   mark works on white, cream and orange-light surfaces without alteration.
5. No outline, no shadow, no halo. Pure geometric flat.

Deliver a 200x200 master SVG (`logo-symbol.svg`).
```

---

## 2. Varianti del logo (tutte da rifare)

Ogni voce è un prompt indipendente: incolla il blocco brand + il blocco "Logo Promptly — concept master" e poi questo.

### 2.1 `logo-symbol.svg` (master simbolo)

```
Output the master symbol: 200x200 viewBox, transparent background, the P+brain
mark only, centred with an 18px optical padding on every side. Export as a
single optimised SVG, no <text>, no <filter>.
```

### 2.2 `logo-horizontal.svg` (header desktop, footer)

```
Horizontal lockup. 720x200 viewBox. Symbol on the left at 200x200, vertical
midline aligned with the wordmark cap-height baseline.
Wordmark: "PROMPTLY", Plus Jakarta Sans Bold, 72px, fill #1F2937 (text primary
warmer), letter-spacing 2px, vertically centred.
Optical gap between symbol and wordmark: equal to the height of the P stem.
This is THE primary lockup — used in the marketing header, the marketing
footer, and email signatures. Must look balanced on both #FAFAFA and #FFFFFF.
```

### 2.3 `logo-full.svg` (splash, certificati, slide cover)

```
Vertical lockup. 400x480 viewBox. Symbol top-centred at 200x200, wordmark below
in the same Plus Jakarta Sans Bold 68px, fill #1F2937, letter-spacing 2px,
text-anchor middle. Vertical rhythm: 24px between symbol baseline and
wordmark cap-line. Generous bottom padding so the lockup feels framed.
```

### 2.4 `logo-favicon.svg` (16-48px)

```
Favicon-grade variant. 64x64 viewBox. A solid orange (#E8703F) rounded square
14px-radius, with a simplified white P glyph inside (no brain wrinkles —
those disappear at 16px). Add a single 2.2px white dot in the counter to
keep the "thinking" hint. Optimise for 16px, 24px, 32px and 48px rasters.
```

### 2.5 `logo-mono-white.svg` (sfondi scuri / watermark)

```
Monochrome white version of the symbol. 200x200 viewBox. Same P silhouette
but rendered as a single fill="white" path, with the counter punched out via
even-odd fill-rule so the dark surface shows through. Inside the counter,
two small white dots (3.5px) suggest the brain hemispheres. No smile (it
disappears in mono — replace it visually with the dots).
```

### 2.6 `logo-mono-black.svg` (stampa B/N, fax)

```
Same construction as logo-mono-white.svg but fill="#1F2937". For print on
white paper, B/W documents and one-colour merch.
```

### 2.7 `wordmark.svg` (solo scritta)

```
Just the wordmark. 480x100 viewBox. "PROMPTLY", Plus Jakarta Sans Bold, 72px,
fill #1F2937, letter-spacing 2px, baseline at y=72. Used when the symbol is
already present nearby (e.g. on receipts, secondary headers).
```

### 2.8 `icon-192.svg` / `icon-512.svg` (PWA)

```
PWA icon. 1:1 viewBox (192 or 512). Solid #E8703F rounded-square background
(corner radius = side / 4.5), symbol centred in white using the mono-white
construction (white P with even-odd counter, two white dots inside).
Symbol occupies the central 60% of the canvas — leaves a generous orange
"safe zone" for masked icons.
```

### 2.9 `apple-touch-icon.svg` (180x180, no rounded corners)

```
Same as icon-512 but iOS-style: full-bleed orange #E8703F, NO corner radius
(iOS adds the squircle mask itself), white symbol centred occupying the
central 60%. Export as 180x180 SVG, then PNG.
```

### 2.10 `og-image.svg` (1200x630, social share)

```
Open Graph card. 1200x630 viewBox.
- Background: #F8F7F4 (off-white).
- Top-right: #FFF1EB circle, r=280, anchored at (1100, -50).
- Bottom-left: #FFF1EB circle, r=220, anchored at (80, 680).
- Symbol on the left, scaled 1.5x, anchored at (110, 165).
- To the right: wordmark "PROMPTLY" in Plus Jakarta Sans Bold 96px, fill
  #1F2937, then a tagline directly below: "Learn to build with words, not
  code." in Inter Medium 34px, fill #4B5563.
- Below the tagline: a 120x6 rounded-3 #E8703F underline accent.
- Italian variant: same layout, tagline becomes "Impara a costruire con le
  parole, non col codice."
```

---

## 3. Asset della HOME da rifare

Riferimento delle pagine della landing: `app/(marketing)/[lang]/page.tsx`. Le sezioni che caricano asset esterni (oltre al logo) sono **Solution**, **Curriculum**, **LuciaDemo**, **SocialProof**.

### 3.1 Path icons (Solution + Curriculum) — 5 icone

Sono cinque, tutte 48x48, allineate stilisticamente fra loro. Vivono già in `public/brand/icon-path-*.svg` e vengono renderizzate piccole (40-48px). Il restyle deve mantenere la **stessa griglia** ma alzare il livello: forme più decise, weight più costante, micro-dettaglio rimosso quando non si legge a 24px.

Prompt comune (incollalo prima di ciascuno):

```
Set of 5 educational path icons for Promptly, "biome" series. Each icon:
- 48x48 viewBox, 4px safety padding.
- Single accent fill #FFF1EB inside, 2px stroke #E8703F outside.
- Stroke-linecap: round, stroke-linejoin: round.
- One "spark detail" filled solid #E8703F (eyes, knob, antenna…).
- No gradient, no shadow, no text.
- Must read perfectly at 24px and stay charming at 96px.
The 5 icons share the SAME visual weight: same stroke, same corner radius,
same internal density. Treat them as a family, not individuals.
```

Poi i prompt singoli:

`icon-path-mindset.svg` — Path 1, "The Mindset"
```
A friendly lightbulb / idea icon. A bulb glass (circle) sitting on three
horizontal screw lines that get progressively shorter, with a tiny eyebrow-
shaped sparkle on top of the bulb. Reads as "ideas + clarity".
```

`icon-path-prompt.svg` — Path 2, "The Prompt"
```
A speech bubble with a blinking text cursor and three text lines of
decreasing length. The cursor is the spark detail (solid orange). Reads as
"the act of writing a prompt".
```

`icon-path-build.svg` — Path 3, "The Build"
```
Three stacked blocks (two on the bottom, one centred on top). Bottom blocks
are outlined; the top block is solid orange. Reads as "constructing".
Avoid Tetris vibes — it should feel like architecture, not a game.
```

`icon-path-debug.svg` — Path 4, "The Debug"
```
A friendly bug viewed from above. Oval body with a vertical centre line,
two short antennae arching up, three legs per side, two solid-orange dots as
eyes. The bug must look curious, not menacing. No exclamation marks.
```

`icon-path-ship.svg` — Path 5, "The Ship"
```
A small rocket ready to launch. Round-tipped fuselage, single porthole
(solid orange), two triangular fins, and a stylised flame in #F59E0B with a
#DC2626 outline. The flame is the only place a second colour is allowed in
the whole path-icon family.
```

### 3.2 `og-image.png` — social share

Vedi 2.10 sopra. Esporta sia SVG sorgente sia PNG 1200x630 (sostituisce `public/brand/og-image.png`).

### 3.3 `undraw_breakfast_rgx5.svg` — illustrazione header dentro la demo Lucia

Questo è un asset Undraw esterno, fuori brand. Va sostituito con un'illustrazione Promptly originale.

```
Custom flat-vector illustration to replace the Undraw "breakfast" placeholder
inside the Lucia landing-demo. 320x180 viewBox, transparent background.
Subject: a small bistro-table top-down scene that suggests "Lucia's
homepage": one stylized plate with a croissant, a coffee cup with steam,
a tiny notebook with the word "menu" hand-lettered, and a sprig of basil.
Style: soft cream + terracotta palette ONLY:
- #EFE4D7 (cream backdrop / table)
- #C97C5E (terracotta — main subject)
- #E5A883 (warm peach — secondary)
- #1A1A1A at 12% opacity for thin contour lines.
NO Promptly orange #E8703F here — the illustration belongs to Lucia's app
inside the demo, not to Promptly. Lines 1.4px, rounded, slightly imperfect
(hand-drawn feel). Output as a clean SVG with grouped paths.
```

### 3.4 `preview-lesson.png` / `preview-map.png` / `preview-demo.png` — Social Proof

Sono i tre screenshot del prodotto nella sezione "Inside Promptly". Il componente attualmente fa fallback a un gradient + icona quando i PNG mancano.

> Nota: idealmente questi tre asset andrebbero **catturati** dal prodotto reale (Lesson V3, Dashboard map, Demo Lucia) e non disegnati. Se serve un placeholder a tema in attesa degli screenshot reali, usa il prompt sotto.

```
Three product mockup illustrations, 4:3 aspect, 800x600 each, flat vector.
All three share:
- Soft surface #FFFFFF on a #FAFAFA outer frame.
- 14px corner radius on the outer frame.
- 1px #E5E5E5 inner border.
- Plus Jakarta Sans for headings inside the mockup, Inter for body.
- Promptly orange #E8703F used sparingly: one CTA, one accent.

(1) preview-lesson.png — A lesson "principle card": eyebrow micro-text, a
bold two-line title, a short paragraph, and an XP toast pill at the bottom
right with a ⚡ icon. Background tint: subtle #FFF4EF.

(2) preview-map.png — A learning map: 5 round node markers connected by a
soft dashed path, in 5 different biome colours (cream, sage, gray, olive,
charcoal — see globals.css biome tokens). The third node is "active" with
a Promptly-orange ring.

(3) preview-demo.png — A split-view demo: on the left a tiny browser chrome
with three macOS dots and a cream cartoon site (Lucia's homepage); on the
right a dark VS-Code-like panel with a single text input and a lime
(#C5F432) "VALUTA PROMPT" button. Reads as "type a prompt → see it
evaluated".
```

### 3.5 Hero — header / closing CTA

La hero non carica immagini esterne (è un mockup HTML/CSS interno, `HeroMockup.tsx`). **Non serve asset Figma.** L'unica immagine nell'header e nel footer della landing è `logo-horizontal.svg` — coperta dalla sezione 2.2.

---

## 4. Asset di gioco riusati nella landing (riferimento)

Questi non vengono mostrati direttamente nella home oggi, ma fanno parte del sistema brand e sarebbero consistenti se rifatti insieme. Bassa priorità per la landing, alta se in futuro li si vuole portare in homepage o nella OG card.

| File | Prompt sintetico |
|---|---|
| `badge-pro.svg` | Badge "PRO" pill, fondo #F5F3FF, scritta Plus Jakarta 12px Bold #7C3AED, micro stella full-#7C3AED a sinistra. |
| `badge-free.svg` | Badge "FREE" pill, fondo #F0FDF4, scritta Plus Jakarta 12px Bold #16A34A, nessun simbolo. |
| `icon-streak.svg` | Fiamma stilizzata, due tratti, fill #DC2626, nucleo #EAB308. 24x24. |
| `icon-streak-freeze.svg` | Fiocco a sei punte, stroke 2px #38BDF8, nucleo cerchio #EFF6FF. 24x24. |
| `icon-xp.svg` | Saetta minimal, fill solid #EAB308, single shape. 24x24. |

---

## 5. Cosa esportare da Figma

Per ciascun file SVG: **Frame → Export → SVG** con queste opzioni:

- "Outline text" attivo solo per `og-image.svg` (per evitare problemi font sui social).
- "Include id attribute" disattivo.
- "Simplify stroke" disattivo (rovina i join).
- Nessun filter, nessuna maschera bitmap.

Per i PNG (`og-image.png`, `apple-touch-icon.png`, eventuali `preview-*.png`):
- 1x e 2x.
- sRGB.
- PNG-24 (no PNG-8, evita banding sull'orange).

Drop di destinazione nel repo:
- Master vettoriali → `assets/`
- Asset serviti dal sito Next.js → `public/brand/`

---

## 6. Test rapido di coerenza (post-export)

Prima di committare un nuovo asset:

1. Aprilo a 24px in un mockup `#FAFAFA` e a 96px in un mockup `#1A1A1A` — entrambe le viste devono restare leggibili.
2. Confronta il nuovo asset accanto a `logo-horizontal.svg`: stesso peso ottico? Stessa famiglia di curve?
3. Verifica che l'arancione sia esattamente `#E8703F` (non `#E97042` o varianti). Niente HSL "vicini".
4. Apri l'SVG in editor e controlla che non ci siano `<image>`, `<filter>`, `<mask>` o tag `<text>` non outlinati (eccetto `og-image.svg`).

Se tutti e quattro i check passano, l'asset è on-brand.
