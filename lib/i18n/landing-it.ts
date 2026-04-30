import type { LandingCopy } from "./landing";

export const landingCopyIt: LandingCopy = {
  meta: {
    title: "Promptly — Impara a costruire con le parole, non con il codice",
    description:
      "Il primo corso interattivo di vibe coding. Trasforma le tue idee in app vere, senza scrivere codice. Inizia gratis con 14 lezioni.",
  },
  header: {
    login: "Accedi",
    cta: "Inizia gratis",
    openMenu: "Apri il menu",
    closeMenu: "Chiudi il menu",
  },
  hero: {
    eyebrow: "IMPARA A USARE L'AI PER COSTRUIRE",
    headline: "Trasforma le tue idee in app vere.\nSenza scrivere una riga di codice.",
    sub: "Promptly ti insegna a parlare con l'AI per costruire software vero. Lezioni brevi, esercizi pratici, risultati che vedi crescere ogni giorno.",
    ctaPrimary: "Inizia gratis",
    ctaSecondary: "Vedi un esempio",
    reminder: "14 lezioni gratis · No carta di credito · 5 minuti al giorno",
    mockup: {
      url: "promptly.app/lezione/1",
      lessonTitle: "Cos'è il vibe coding?",
      lessonStep: "Lezione 1 · Esercizio",
      promptLabel: "Completa la definizione",
      promptText: "Vibe coding è la pratica di costruire ___ usando ___ invece di scrivere codice manualmente.",
      blank1: "software",
      blank2: "linguaggio naturale",
      check: "Controlla risposta",
      correct: "Corretto! ✓",
      xpToast: "+150 XP ⚡",
    },
  },
  problem: {
    title: "Hai un'idea, ma il codice ti blocca.",
    subtitle: "Suona familiare?",
    cards: [
      {
        emoji: "📌",
        quote: "Vorrei costruire la mia idea, ma non so programmare.",
      },
      {
        emoji: "🌪",
        quote: "Ho provato i corsi di coding, ma sono lunghi e astratti.",
      },
      {
        emoji: "🤖",
        quote: "L'AI sembra promettente, ma non so come usarla davvero.",
      },
    ],
  },
  solution: {
    title: "Promptly ti insegna a costruire con le parole.",
    steps: [
      {
        number: "01",
        eyebrow: "IMPARA",
        iconSlug: "mindset",
        title: "Capisci come parlare all'AI",
        sub: "Ogni concetto in 5 minuti. Niente teoria astratta — solo cose che userai subito.",
      },
      {
        number: "02",
        eyebrow: "PROVA",
        iconSlug: "prompt",
        title: "Esercitati con prompt veri",
        sub: "Esercizi interattivi che ti correggono. Sbagliare è permesso — anzi, è il modo in cui imparerai meglio.",
      },
      {
        number: "03",
        eyebrow: "COSTRUISCI",
        iconSlug: "build",
        title: "Realizza il tuo primo progetto",
        sub: "Dalla prima riga al deploy. A fine corso avrai un'app vera, online, funzionante. E saprai come ricominciare con la prossima.",
      },
    ],
  },
  curriculum: {
    title: "Il percorso completo, in 5 tappe.",
    sub: "38 lezioni totali. Inizia oggi con le prime 14 gratis.",
    cards: [
      {
        number: "Percorso 1",
        iconSlug: "mindset",
        level: "beginner",
        title: "La Mente del Vibe Coder",
        meta: "6 lezioni · 30–50 min",
        tier: "free",
        tierLabel: "Gratis",
        startHere: "Inizia da qui",
      },
      {
        number: "Percorso 2",
        iconSlug: "prompt",
        level: "beginner",
        title: "Il Prompt",
        meta: "8 lezioni · 50–90 min",
        tier: "free",
        tierLabel: "Gratis",
      },
      {
        number: "Percorso 3",
        iconSlug: "build",
        level: "intermediate",
        title: "Costruisci",
        meta: "10 lezioni · 90–150 min",
        tier: "pro",
        tierLabel: "Pro",
      },
      {
        number: "Percorso 4",
        iconSlug: "debug",
        level: "advanced",
        title: "Risolvi i Bug",
        meta: "6 lezioni · 50–80 min",
        tier: "pro",
        tierLabel: "Pro",
      },
      {
        number: "Percorso 5",
        iconSlug: "ship",
        level: "advanced",
        title: "Pubblica al Mondo",
        meta: "8 lezioni · 70–110 min",
        tier: "pro",
        tierLabel: "Pro",
      },
    ],
  },
  exercise: {
    title: "Prova una lezione, ora.",
    sub: "Una vera mini-lezione. Nessun login.",
    url: "promptly.app/lezione/1",
    lessonStep: "Lezione 1 · Esercizio interattivo",
    lessonTitle: "Cos'è il vibe coding?",
    promptLabel: "Completa la definizione",
    promptText:
      "Vibe coding è la pratica di costruire ___ usando ___ invece di scrivere codice manualmente.",
    blanks: [
      {
        accepted: ["software", "applicazioni", "app", "software vero", "programmi"],
        hints: [
          "Cosa vorresti creare quando hai un'idea?",
          "Pensa a quello che apri quando tocchi un'icona sul telefono — come lo chiameresti?",
          "software",
        ],
      },
      {
        accepted: [
          "linguaggio naturale",
          "il linguaggio naturale",
          "parole",
          "frasi",
          "prompt",
          "le parole",
        ],
        hints: [
          "Come stai leggendo questa frase ora?",
          "Quando spieghi un'idea a un amico, in che modo lo fai?",
          "linguaggio naturale",
        ],
      },
    ],
    microcopy: {
      verify: "Verifica",
      hint: "Suggerimento",
      hintLabel: "Suggerimento",
      revealLabel: "Risposta",
      blankLabel: "Spazio",
      attemptOf: "Tentativo {n} di 3",
      wrongInline: "Quasi! Riprova — o chiedi un suggerimento.",
      revealedNotice: "Abbiamo riempito noi gli spazi. Premi Verifica per continuare.",
      completedTitle: "Bravo! Hai appena fatto vibe coding.",
      completedSub: "Continua con altre 13 lezioni gratis. Ti aspettano.",
      completedCta: "Iscriviti gratis",
      ariaInputBlank: "Spazio vuoto {n}",
      ariaFeedback: "Stato esercizio",
    },
  },
  evaluator: {
    badge: "Live Demo",
    modeLabel: "valutazione locale",
    title: "Quanto è efficace",
    titleEm: "il tuo prompt?",
    sub: "Leggi il bug. Scrivi il prompt che useresti per chiedere aiuto a un'AI. Ricevi un feedback strutturato.",
    bug: {
      code: `async function showUserNames() {\n  const users = await fetchUsers();\n  const names = users.map(u =>\n    u.name.toUpperCase()\n  );\n  setUserNames(names);\n}`,
      error: `Uncaught (in promise) TypeError:\nCannot read properties of undefined\n(reading 'toUpperCase')\n    at showUserNames (app.js:4)`,
      hint: "A volte funziona, a volte crasha. Stiamo caricando utenti da un'API.",
    },
    bashTab: "bash — debug-session",
    cmdCat: "$ cat app.js",
    cmdRun: "$ npm run dev",
    editorTab: "prompt.md",
    resultTab: "result.json",
    evalLabel: "RISULTATO",
    evaluatingLabel: "VALUTAZIONE",
    adviceLabel: "CONSIGLIO",
    textareaPlaceholder:
      "// Scrivi qui il prompt che invieresti all'AI\n// per risolvere il bug a sinistra...",
    ariaTextarea: "Scrivi il tuo prompt qui",
    ariaScore: "Punteggio totale del prompt",
    ariaBar: "Punteggio dimensione",
    runBtn: "valuta prompt",
    runningBtn: "analisi in corso...",
    resetBtn: "riprova",
    statusReady: "pronto",
    statusEvaluating: "analisi...",
    statusEvaluated: "valutato",
    charsLabel: "caratteri",
    scoreLabels: {
      excellent: "ECCELLENTE",
      good: "BUONO",
      improve: "DA MIGLIORARE",
      insufficient: "INSUFFICIENTE",
    },
    dimensions: {
      chiarezza: {
        label: "chiarezza",
        desc: "errore esatto",
        advice:
          "Includi sempre l'errore esatto come testo (es. 'TypeError: Cannot read properties...') invece di descriverlo a parole.",
      },
      contesto: {
        label: "contesto",
        desc: "ambiente / codice",
        advice:
          "Spiega cosa fa il codice e in che ambiente gira: framework, async, da dove arrivano i dati. Senza contesto l'AI tira a indovinare.",
      },
      obiettivo: {
        label: "obiettivo",
        desc: "cosa vuoi",
        advice:
          "Dichiara cosa vuoi ottenere e chiedi anche una spiegazione. 'Sistemalo' non basta: di' come dovrebbe comportarsi.",
      },
      protezione: {
        label: "protezione",
        desc: "vincoli",
        advice:
          "Aggiungi vincoli: 'non modificare il resto', 'fai la modifica minima', 'spiegami cosa cambi e perché'.",
      },
    },
    consiglio: {
      excellent:
        "Prompt eccellente: l'AI ha tutto il necessario per darti una soluzione ragionata e sicura. Continua così.",
      excellentWithWeak:
        "Prompt molto buono. Per renderlo perfetto, rinforza la {dim}: {advice}",
      good: "Buon prompt. Per portarlo all'eccellenza, lavora sulla {dim}: {advice}",
      medium: "Punto debole: {dim}. {advice}",
      low: "Il prompt è troppo generico. {advice}",
    },
    footer:
      "Un piccolo assaggio di Promptly — l'app che ti insegna a fare vibe coding davvero.",
  },
  socialProof: {
    eyebrow: "COMUNITÀ",
    title: "Una comunità che inizia oggi.",
    sub: "Stiamo raccogliendo le prime storie. Vuoi essere tra i protagonisti?",
    counter: "Tra i primi studenti del programma",
    placeholder: "Le storie dei nostri studenti arrivano presto",
  },
  faq: {
    title: "Domande frequenti.",
    sub: "Tutto quello che vuoi sapere prima di iniziare.",
    items: [
      {
        q: "Cos'è il vibe coding?",
        a: "È il modo di costruire software parlando con l'AI in linguaggio naturale, invece di scrivere codice riga per riga. Tu descrivi cosa vuoi, l'AI lo crea.",
      },
      {
        q: "Devo già saper programmare?",
        a: "No. Promptly nasce per chi parte da zero. Se sai scrivere un'email, sai abbastanza per iniziare.",
      },
      {
        q: "Quanto costa?",
        a: "Le prime 14 lezioni sono gratis, sempre. Per il percorso completo c'è il piano Pro, attivabile dopo aver provato gratis.",
      },
      {
        q: "Quanto tempo serve per finire il corso?",
        a: "5 minuti al giorno per circa 6 settimane, se vuoi prendertela con calma. Più veloce se sei di fretta — il ritmo lo decidi tu.",
      },
      {
        q: "Cosa mi serve per iniziare?",
        a: "Un browser e 5 minuti. Niente da installare, niente carta di credito.",
      },
      {
        q: "Funziona davvero anche per chi non è 'tecnico'?",
        a: "Sì — anzi, è il caso d'uso che ci interessa di più. Il corso è progettato per chi non ha mai aperto un editor di codice.",
      },
      {
        q: "Quale AI userò durante le lezioni?",
        a: "Lavoreremo con i modelli più diffusi (Claude, ChatGPT). Ti insegniamo i principi, non un singolo strumento.",
      },
      {
        q: "Alla fine del corso avrò un progetto vero?",
        a: "Sì. L'ultima tappa è 'Pubblica al Mondo': esci con un'app online, funzionante, che hai costruito tu.",
      },
      {
        q: "Posso disdire Pro quando voglio?",
        a: "Sì, in un click dalle impostazioni. Niente penali, niente domande.",
      },
      {
        q: "Come sono strutturate le lezioni?",
        a: "Ogni lezione è una micro-storia: una spiegazione breve, un esercizio interattivo, un risultato che vedi subito. Niente video da 30 minuti.",
      },
      {
        q: "C'è una community?",
        a: "Sì, abbiamo uno spazio per chi sta seguendo il corso — per condividere progetti, fare domande, vedere cosa stanno costruendo gli altri.",
      },
      {
        q: "Da quale lezione devo iniziare?",
        a: "Dalla prima — 'La Mente del Vibe Coder'. È pensata per chi parte da zero, e ti dà il modo di pensare giusto per tutto il resto del corso.",
      },
    ],
  },
  closingCta: {
    title: "Pronto a costruire la tua prima app?",
    sub: "Inizia gratis. Niente carta. Niente tempo perso.",
    cta: "Inizia gratis",
    reminder: "14 lezioni · 5 minuti al giorno · Costruisci subito",
  },
  footer: {
    columns: {
      product: {
        heading: "Prodotto",
        links: [
          { label: "Come funziona", href: "#solution" },
          { label: "Curriculum", href: "#curriculum" },
        ],
      },
      resources: {
        heading: "Risorse",
        links: [
          { label: "Aiuto", href: "mailto:support@promptly.app" },
          { label: "Contatti", href: "mailto:hello@promptly.app" },
        ],
      },
      legal: {
        heading: "Legale",
        links: [
          { label: "Privacy", href: "/it/privacy" },
          { label: "Termini", href: "/it/terms" },
          { label: "Cookie", href: "/it/cookie" },
        ],
      },
    },
    socialHeading: "Seguici",
    rights: "© 2026 Promptly · Tutti i diritti riservati",
    builtWith: "Costruito con ❤ in Italia",
  },
};
