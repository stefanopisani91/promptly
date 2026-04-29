# Promptly — Brand Assets

Set di SVG sorgente per il brand di Promptly. Tutti i file sono vettoriali, scalabili senza perdita, ed editabili in Figma / Illustrator / VS Code.

> **Nota:** queste sono versioni **stilizzate** create come segnaposto operativi. Se hai il file vettoriale ufficiale del logo (Figma / Illustrator / Affinity), sostituisci `logo-symbol.svg` e `logo-full.svg` con quei file mantenendo gli stessi nomi — il resto della struttura continua a funzionare.

---

## Inventario

### Logo (varianti principali)

| File | Uso | Dimensione consigliata |
|---|---|---|
| `logo-symbol.svg` | App icon, social avatar, navbar mobile, QR code center | Master scalabile |
| `logo-full.svg` | Splash screen, certificato PDF, slide deck cover (verticale) | ≥ 240px alto |
| `logo-horizontal.svg` | Header desktop, email signature, footer landing | ≥ 200px largo |
| `logo-favicon.svg` | Favicon browser, icone ≤ 48px | 16-48px |
| `logo-mono-white.svg` | Sfondi scuri, watermark, stampa monocromatica | Master scalabile |
| `logo-mono-black.svg` | Stampa B/N, fax, contesti austeri | Master scalabile |
| `wordmark.svg` | Solo scritta PROMPTLY (header secondari, copy creativo) | ≥ 120px largo |

### Icone PWA (per `public/` di Next.js)

| File | Uso |
|---|---|
| `icon-192.svg` | PWA `manifest.json` icon 192 |
| `icon-512.svg` | PWA `manifest.json` icon 512 (e splash screen iOS) |
| `apple-touch-icon.svg` | iOS Add to Home Screen (180×180, no rounded corners — iOS le aggiunge) |

### Open Graph

| File | Uso |
|---|---|
| `og-image.svg` | Social share card 1200×630 (Twitter, LinkedIn, Facebook, iMessage preview) |

### Badge & icone UI

| File | Uso |
|---|---|
| `badge-pro.svg` | Badge tier Pro (paywall, settings, navbar) |
| `badge-free.svg` | Badge tier Free (path 1-2) |
| `icon-streak.svg` | Indicatore streak (fiamma) |
| `icon-streak-freeze.svg` | Indicatore freeze settimanale (fiocco di neve) |
| `icon-xp.svg` | Indicatore XP (saetta) |

### Icone path

| File | Uso |
|---|---|
| `icon-path-mindset.svg` | Path 1 — The Mindset (lampadina) |
| `icon-path-prompt.svg` | Path 2 — The Prompt (chat bubble) |
| `icon-path-build.svg` | Path 3 — The Build (blocchi impilati) |
| `icon-path-debug.svg` | Path 4 — The Debug (bug) |
| `icon-path-ship.svg` | Path 5 — The Ship (razzo) |

---

## Palette colori usata

```
Brand orange       #E8703F
Pale orange        #FFF1EB
Deep orange        #A23E12
Pro purple         #7C3AED
Streak red         #DC2626
XP gold            #EAB308
Freeze cyan        #38BDF8
Text primary       #1F2937
Text secondary     #4B5563
Background         #F8F7F4
```

I valori vivono come CSS variables in `app/globals.css` — vedi `PROMPTLY.md` per la palette completa.

---

## Come esportare in PNG

Gli SVG sono il sorgente, ma per favicon, PWA icon e Open Graph servono PNG. Comandi di esempio (richiede ImageMagick o `rsvg-convert`):

```bash
# Favicon
rsvg-convert -w 32 -h 32 logo-favicon.svg -o favicon-32.png
rsvg-convert -w 16 -h 16 logo-favicon.svg -o favicon-16.png

# PWA icons
rsvg-convert -w 192 -h 192 icon-192.svg -o icon-192.png
rsvg-convert -w 512 -h 512 icon-512.svg -o icon-512.png

# Apple touch icon
rsvg-convert -w 180 -h 180 apple-touch-icon.svg -o apple-touch-icon.png

# Open Graph
rsvg-convert -w 1200 -h 630 og-image.svg -o og-image.png
```

In alternativa: aprire ogni SVG in Figma o Affinity e fare **Export as PNG @1x, @2x**.

I PNG esportati vanno copiati in `public/` (root di Next.js), non in `assets/`. La cartella `assets/` rimane il sorgente vettoriale.

---

## Regole d'uso del logo

1. **Spazio libero:** lasciare sempre intorno al logo un margine pari all'altezza dello stem della "P".
2. **Dimensione minima con scritta:** 120px largo. Sotto questa soglia → usa `logo-symbol.svg` (senza scritta).
3. **Dimensione minima del simbolo:** 24px. Sotto → `logo-favicon.svg`.
4. **Mai:** stretching, rotazioni, drop shadow, sostituzione del colore con tinte fuori palette, applicazione su sfondo fotografico senza container solido.
5. **Sfondi consigliati:** `--background (#F8F7F4)`, `--surface (#FFFFFF)`, o pieni in `--primary-light (#FFF1EB)`. Su sfondi scuri usa `logo-mono-white.svg`.

---

## Aggiornamento del set

Quando aggiungi nuove varianti (es. icone path 6+, badge premium, social-specific cards), aggiornale anche qui nel README. Il file `PROMPTLY.md` (root del progetto) ha la sezione *Brand Assets* che linka tutto.
