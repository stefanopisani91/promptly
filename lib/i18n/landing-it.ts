import type { LandingCopy } from "./landing";

export const landingCopyIt: LandingCopy = {
  meta: {
    title: "Vibe Coding: corso interattivo gratis",
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
      lessonStep: "Lezione 1 · 3 di 7",
      sparkLabel: "Spark, la tua compagna di percorso",
      cardEyebrow: "PRINCIPIO",
      cardTitle: "Pensa per risultati,\nnon per passi.",
      cardBody:
        "Non dire all'AI come fare. Dille cosa vuoi ottenere — e lasciale scegliere la strada.",
      chip1: "Aspetta, e se sbaglio?",
      chip2: "Dammi un esempio",
      xpToast: "+150 XP",
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
  demo: {
    badge: "PROMPTLY · LIVE DEMO",
    title: "Quanto è efficace",
    titleEm: "il tuo prompt?",
    subtitle:
      "Hai appena creato la home page del tuo sito web. Sembra perfetta, ma c'è qualcosa che non va. Cosa scrivi all'AI per chiederle aiuto?",
    homepage: {
      addressBar: "frigomagico.app",
      appName: "FRIGOMAGICO",
      nav: {
        howItWorks: "Come funziona",
        pricing: "Prezzi",
        getStarted: "Inizia",
      },
      luciaHeadline: "Ciao, sono Lucia.",
      luciaSubheadline:
        "Lavoro nel marketing e sto costruendo FrigoMagico, l'app che ti suggerisce cosa cucinare in base a quello che hai nel frigo.",
      photoLabel: "foto profilo",
      errorBadge: "404",
      projectTitle:
        "FrigoMagico — l'app che trasforma quello che hai in frigo in cena perfetta in 3 minuti",
      ctaButton: "DOWNLOAD",
      footer: "© 2026 FRIGOMAGICO — Made by Lucia",
      ariaIllustration: "Illustrazione stilizzata di Lucia",
      ariaHeaderIllustration: "Illustrazione cartoon: cucinare con cibi freschi",
    },
    console: {
      errorLine1: "GET /assets/profilo.jpg 404 (Not Found)",
      errorLine2:
        "Failed to load resource: the server responded with a status of 404 (Not Found)",
    },
    editor: {
      windowTitle: "Code editor — prompt.md",
      placeholder:
        "Scrivi qui come chiederesti aiuto all'AI...\n\nSuggerimento: l'AI non vede la homepage.\nDevi descriverle tu cosa non funziona.",
      statusReady: "pronto",
      statusEvaluating: "valutazione in corso",
      statusEvaluated: "valutato",
      charsLabel: "caratteri",
      btnEvaluate: "valuta prompt",
      btnEvaluating: "valutazione in corso...",
      btnRetry: "riprova",
      previousAttempt: "tentativo precedente: {score}/100",
      ariaTextarea: "Scrivi il tuo prompt qui",
      ariaScore: "Punteggio totale del prompt",
      ariaBar: "Punteggio dimensione",
    },
    result: {
      evalLabel: "RISULTATO",
      adviceLabel: "CONSIGLIO",
      scoreLabels: {
        review: "DA RIVEDERE",
        improve: "DA MIGLIORARE",
        good: "BUONO",
        great: "OTTIMO",
        perfect: "PERFETTO",
      },
      dimensions: {
        chiarezza: { label: "chiarezza", desc: "errore esatto" },
        contesto: { label: "contesto", desc: "ambiente / codice" },
        obiettivo: { label: "obiettivo", desc: "cosa vuoi" },
        protezione: { label: "protezione", desc: "vincoli" },
      },
    },
    messages: {
      scoreLow:
        "L'AI non ha capito bene cosa fare. Migliora il prompt e riprova.",
      scoreMidOnePhotoOnly:
        "Buon prompt. Hai sistemato un bug, ma c'è ancora qualcosa che non va.",
      scoreMidPartialOneLeft:
        "Quasi! Hai notato i bug che hai menzionato. Ne è rimasto uno…",
      scoreMidAllBugs:
        "Bravo! Hai trovato tutti i bug. Per arrivare a un prompt perfetto, lavora sui dettagli che vedi nel consiglio.",
      scoreHighPartial:
        "Ottimo prompt, ma hai notato gli altri {count} problemi visibili?",
      scoreHighAllTitle:
        "Hai sistemato la homepage con un prompt da {score}/100.",
      scoreHighAllSub:
        "In Promptly impari a farlo per davvero, su progetti tuoi.",
      ctaFinal: "Provala gratis →",
      limitTitle: "Hai esplorato bene la demo!",
      limitSub:
        "Per continuare a imparare e migliorare i tuoi prompt, inizia il viaggio in Promptly.",
      limitCta: "Inizia gratis →",
    },
    errors: {
      network: "Connessione interrotta. Riprova tra qualche secondo.",
      rateLimit:
        "Hai raggiunto il limite di valutazioni. Riprova tra qualche minuto.",
      tooLong: "Il prompt è troppo lungo. Massimo 1500 caratteri.",
      invalidPrompt:
        "Non riusciamo a valutare questo prompt. Prova a riscriverlo.",
      generic: "Qualcosa è andato storto. Riprova.",
      empty: "Scrivi qualcosa prima di valutare.",
    },
    disclosure: {
      text:
        "Il prompt che invii viene elaborato da un'IA (OpenAI, USA) per generare la valutazione. Non inserire dati personali.",
      linkLabel: "Privacy Policy",
    },
    spark: {
      label: "Spark, la tua compagna",
      intro: "Lucia ha bisogno di una mano. Scrivi tu il prompt — io guardo.",
      thinking: "Sto leggendo. Un secondo.",
      victory: "Bingo. Sistemato. Ora lo sai fare anche tu.",
      low: "Non ancora. I bug sono tre — riguardali e riprova.",
      partial: "Quasi. Manca qualcosa. Rileggi gli errori e riscrivi.",
      partialPhotoOnly: "Hai visto la foto. È un buon inizio. Ma sul sito ci sono altri due problemi — un titolo che sfora e un bottone che non si legge.",
      partialOneLeft: "Ci sei quasi. Hai trovato due bug, ne manca solo uno. Indizio: c'è un elemento che dovrebbe vedersi e non si vede.",
      partialMidAllBugs: "Hai gli occhi giusti, hai visto tutti e 3 i bug. Aggiungi un piccolo dettaglio operativo — tipo «non aggiungere librerie» — e arrivi alla vittoria.",
      partialHighIncomplete: "Prompt forte. Però un bug è scappato — riguarda il sito, c'è ancora qualcosa che non torna.",
      editingAfterAttempt: "Sto qui. Quando hai un'idea nuova, scrivila.",
      limit: "Per ora basta. Iscriviti se vuoi continuare con me.",
    },
    writeHereOverlay: {
      desktop: "Scrivi qui il tuo prompt",
      mobile: "Scrivi qui",
    },
    footer:
      "Un piccolo assaggio di Promptly — l'app che ti insegna a fare vibe coding davvero.",
  },
  socialProof: {
    eyebrow: "PROMPTLY DENTRO",
    title: "Ecco com'è dentro.",
    sub: "Tre momenti veri del prodotto. Niente promesse — solo quello che vedrai dopo il primo click.",
    counter: "Tra i primi studenti del programma",
    previews: [
      {
        kicker: "LEZIONE",
        title: "Le card di una lezione, una alla volta.",
        caption:
          "Niente muri di testo. Un concetto per card, Spark che ti accompagna, e la tua risposta sempre a portata di mano.",
      },
      {
        kicker: "MAPPA",
        title: "Il tuo viaggio, una mappa.",
        caption:
          "Cinque biomi. Ogni lezione un nodo. Tu ti muovi sopra come un piccolo robot — e vedi sempre dove sei e dove vai.",
      },
      {
        kicker: "DEMO LIVE",
        title: "Sistema un sito vero, qui sopra.",
        caption:
          "L'esercizio della demo non è finto. È una lezione vera del Path 4, accessibile prima ancora di iscriverti.",
      },
    ],
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
    // Social URLs are placeholders today — user confirmed accounts are
    // coming "shortly". Link rel="noopener" + aria-label make them safe
    // even before the targets are live; broken links fail visibly which
    // is what we want during launch week.
    socialLinks: [
      { label: "X / Twitter", href: "https://x.com/promptly_app", platform: "twitter" },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/company/learnpromptly",
        platform: "linkedin",
      },
      { label: "GitHub", href: "https://github.com/stefanopisani91", platform: "github" },
    ],
    rights: "© 2026 Promptly · Tutti i diritti riservati",
    builtWith: "Costruito con ❤ in Italia",
  },
};
