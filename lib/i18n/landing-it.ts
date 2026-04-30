import type { LandingCopy } from "./landing";

export const landingCopyIt: LandingCopy = {
  meta: {
    title: "Vibe Coding: corso interattivo gratis · Promptly",
    description:
      "Impara il vibe coding con Promptly: parla con l'AI per costruire app vere senza scrivere codice. 14 lezioni gratis, 5 minuti al giorno. Inizia subito.",
  },
  header: {
    login: "Accedi",
    cta: "Inizia gratis",
    openMenu: "Apri il menu",
    closeMenu: "Chiudi il menu",
  },
  hero: {
    eyebrow: "VIBE CODING · IMPARA A COSTRUIRE CON L'AI",
    headline: "Trasforma le tue idee in app vere.\nSenza scrivere una riga di codice.",
    sub: "Promptly è il corso interattivo di vibe coding: impari a parlare con l'AI per costruire software vero. Lezioni brevi, esercizi pratici, risultati che vedi crescere ogni giorno.",
    ctaPrimary: "Inizia gratis",
    ctaSecondary: "Vedi un esempio",
    ctaBug: "fixa il bug",
    reminder: "14 lezioni gratis · No carta di credito · 5 minuti al giorno",
    mockup: {
      url: "learnpromptly.app/lezione/1",
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
    eyebrow: "Ti suona familiare?",
    title: "Il ciclo infinito\ndei bug del vibe coding.",
    sub: "La storia di chi prova a costruire con l'AI senza sapere come guidarla.",
    steps: [
      {
        iconSlug: "idea",
        title: "Hai un'idea geniale.",
        description:
          "L'AI sembra il modo perfetto per trasformarla in app. Inizi a fare vibe coding, pieno di entusiasmo.",
      },
      {
        iconSlug: "wrench",
        title: "Qualcosa si rompe.",
        description:
          "Scrivi un prompt all'AI per sistemare il bug. Sembra funzionare. Tiri un sospiro di sollievo e vai avanti.",
      },
      {
        iconSlug: "loop",
        kickerEyebrow: "Tre ore dopo, dieci prompt più tardi",
        title: "Ma ora si è rotto qualcos'altro.",
        description: "E poi un altro pezzo. E un altro ancora. Sei nello stesso punto.",
        kickerEnd: "O peggio.",
      },
    ],
    conclusion: {
      line1: "Non è colpa tua. Nessuno ti ha insegnato a guidare l'AI.",
      microExpertise: "È il problema #1 di chi inizia il vibe coding senza metodo.",
      bridge: "Ma si può imparare.",
    },
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
    url: "learnpromptly.app/lezione/1",
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
        q: "Cos'è il vibe coding e come funziona?",
        a: "Vibe coding significa costruire software parlando con un'AI in linguaggio naturale, invece di scrivere codice riga per riga. Tu descrivi cosa vuoi — un'app, un sito, un piccolo strumento — e l'AI lo crea con te. È il modo più veloce oggi per trasformare un'idea in qualcosa di reale, anche se non hai mai programmato.",
      },
      {
        q: "Posso imparare il vibe coding senza saper programmare?",
        a: "Sì, e anzi è il caso d'uso ideale. Promptly è pensato per chi parte da zero: se sai scrivere un messaggio chiaro, sai già il 70% di quello che ti serve per fare vibe coding. Non installiamo niente, non ti chiediamo termini tecnici — ti insegniamo come pensare e come parlare all'AI.",
      },
      {
        q: "Quanto costa il corso di vibe coding di Promptly?",
        a: "Le prime 14 lezioni di vibe coding sono gratis, sempre, senza carta di credito. Per il percorso completo (38 lezioni, esercizi avanzati, progetto finale online) c'è il piano Pro, che attivi solo se vuoi continuare. Nessun trial nascosto, nessun rinnovo automatico a sorpresa.",
      },
      {
        q: "In quanto tempo si impara il vibe coding?",
        a: "Bastano 5 minuti al giorno: con questo ritmo finisci in circa 6 settimane le 38 lezioni totali. Se vuoi accelerare puoi farne più di una al giorno — il ritmo lo decidi tu, e l'app ti tiene traccia dei progressi così non perdi lo slancio.",
      },
      {
        q: "Cosa serve per iniziare a costruire app con l'AI?",
        a: "Un browser e 5 minuti liberi: niente da installare, niente carta di credito, niente account su mille piattaforme. Apri Promptly, scegli la prima lezione di vibe coding e inizi subito a parlare con l'AI per costruire qualcosa di tuo.",
      },
      {
        q: "Il vibe coding funziona davvero per chi non è tecnico?",
        a: "Sì — è esattamente il pubblico per cui Promptly è stato costruito. Il corso non assume nessuna conoscenza pregressa di codice o terminale: parte dal modo di pensare, ti insegna a fare le domande giuste all'AI, e ti porta a costruire un'app vera passo dopo passo.",
      },
      {
        q: "Quale AI si usa per fare vibe coding (Claude, ChatGPT)?",
        a: "Lavoriamo principalmente con Claude (Anthropic) e ChatGPT (OpenAI), i due modelli più diffusi per il vibe coding. Ti insegniamo i principi del prompt engineering che valgono per qualsiasi AI: quando cambierà il modello dominante, saprai adattarti senza ricominciare da capo.",
      },
      {
        q: "A fine corso avrò un'app online costruita da me?",
        a: "Sì. L'ultima tappa del percorso si chiama 'Pubblica al Mondo': esci con un'app vera, online, funzionante, costruita interamente da te tramite vibe coding. Non un esercizio chiuso nell'app, ma un progetto che puoi condividere con un link.",
      },
      {
        q: "Posso annullare l'abbonamento Pro di Promptly quando voglio?",
        a: "Sì, in un click dalle impostazioni del tuo account. Niente penali, niente domande, niente catene di email per trattenerti. Se Pro non fa per te, lo disattivi e mantieni comunque l'accesso alle 14 lezioni gratuite.",
      },
      {
        q: "Come sono strutturate le lezioni di vibe coding di Promptly?",
        a: "Ogni lezione è una micro-storia di 5 minuti: una spiegazione breve del concetto, un esercizio interattivo dove provi davvero, un risultato che vedi subito. Niente video da 30 minuti, niente quiz a crocette — è tutto pratico, tutto orientato a costruire qualcosa.",
      },
      {
        q: "C'è una community di vibe coder dove confrontarsi?",
        a: "Sì, abbiamo uno spazio dedicato a chi sta seguendo Promptly: condividi i progetti che stai costruendo, fai domande quando l'AI ti blocca, vedi cosa stanno facendo gli altri vibe coder. Imparare in compagnia funziona meglio che in solitaria.",
      },
      {
        q: "Da dove iniziare a imparare il vibe coding da zero?",
        a: "Dalla prima lezione: 'La Mente del Vibe Coder'. È pensata proprio per chi parte da zero e ti dà il modo di pensare giusto per tutto il resto del corso — prima di toccare un'AI, capisci come ragionare. Da lì il percorso ti porta gradualmente a costruire la tua prima app.",
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
          { label: "Domande frequenti", href: "#faq" },
          { label: "Curriculum", href: "#curriculum" },
          { label: "Aiuto", href: "mailto:support@learnpromptly.app" },
          { label: "Contatti", href: "mailto:hello@learnpromptly.app" },
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
