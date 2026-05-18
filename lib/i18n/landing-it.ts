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
    eyebrow: "corso interattivo · in italiano · 14 lezioni gratis",
    headline: "Il vibe coding,",
    headlineHighlight: "insegnato per bene.",
    sub: "Promptly è il corso che ti porta da zero a un'app pubblicata, parlando con l'AI invece di scrivere codice. Cinque minuti al giorno con Spark, la tua compagna di percorso.",
    ctaPrimary: "Inizia gratis",
    ctaSecondary: "Provala adesso",
    reminder: "no carta · funziona da telefono · risultato dalla prima lezione",
    carousel: {
      ariaLabel: "Promptly su iPhone: sette schermate dell'app in carosello",
      slides: [
        "Onboarding di Promptly: Spark spiega il termine «IDE» in un popup del glossario, passo 5 di 14",
        "La mappa del percorso: il bioma villaggio di «Mindset» con le lezioni completate e il robot avatar",
        "La mappa del percorso scorsa fino all'Endgame: «La tua libreria di prompt», ancora bloccata",
        "La mappa del percorso: il bioma officina di «Debug» (Pro) con i percorsi bonus bloccati ai lati",
        "La mappa del percorso: il bioma foresta di «Prompt», in arrivo a giugno",
        "La dashboard di Promptly: obiettivo di oggi, messaggio di Spark, streak e XP totali",
        "Una lezione di Promptly: l'editor del file CLAUDE.md con le sezioni guidate da compilare",
      ],
    },
  },
  method: {
    kicker: "IL METODO",
    lead: "Niente video da guardare. Niente codice da scrivere. Solo **il modo giusto** per parlare con l'AI.",
    paragraphs: [
      {
        bold: "Ogni lezione dura 5 minuti.",
        body: "Apri Promptly, leggi una card, rispondi a una domanda. Spark — la compagna di percorso, non un wrapper di ChatGPT — ti spiega un principio e ti mette subito a costruire un esempio tuo.",
        quiet: "Sbagliare è permesso: dopo tre tentativi, ti mostra la risposta e ti spiega perché.",
      },
      {
        bold: "Non impari un'AI, impari il metodo.",
        body: "Le tecniche che vedrai funzionano con Claude, ChatGPT, Cursor, Copilot — e con qualunque modello uscirà dopo. Promptly insegna a pensare prima di chiedere, dare contesto, mettere vincoli, riconoscere quando l'AI sta sbagliando.",
        quiet: "È il modo in cui i developer veri usano l'AI.",
      },
    ],
  },
  meetSpark: {
    kicker: "LA COMPAGNA DI PERCORSO",
    name: "Lei si chiama Spark.",
    portraitCaption: "illustrazione da commissionare",
    paragraphs: [
      "Promptly non ha un chatbot. Ha **Spark** — una compagna di percorso con regole di voce sue, che ti spiega un concetto e ti mette subito a costruire. Parla in prima persona, in italiano vero, e non dice mai «geniale» o «bravissimo».",
      "Ti accompagna per 38 lezioni e te ne ricorda due quando hai dimenticato la prima. Quando sbagli, ti aiuta a capire **perché**. Quando hai dubbi, ti dà un esempio. Quando hai capito, si fa da parte.",
    ],
    rules: [
      { kind: "yes", label: "dolce ma diretta" },
      { kind: "yes", label: "parla in prima persona" },
      { kind: "no",  label: "motivazionale-da-LinkedIn" },
      { kind: "no",  label: "emoji decorative" },
      { kind: "no",  label: "«fantastico!»" },
    ],
  },
  curriculum: {
    kicker: "IL LIBRO",
    title: "Cinque capitoli. Trentotto lezioni.",
    sub: "Le prime due tappe (14 lezioni) sono gratis. Bastano per costruire il modo di pensare e i primi prompt veri. Le altre tre tappe le sblocchi quando ti serve.",
    cards: [
      {
        number: "Percorso 01",
        iconSlug: "mindset",
        level: "beginner",
        title: "La Mente del Vibe Coder",
        desc: "Il modo di pensare prima di toccare un'AI. Contesto, vincoli, come riconoscere un errore.",
        meta: "6 lezioni · 30–50 min",
        tier: "free",
        tierLabel: "Gratis",
        startHere: "Inizia da qui",
      },
      {
        number: "Percorso 02",
        iconSlug: "prompt",
        level: "beginner",
        title: "Il Prompt",
        desc: "Anatomia, struttura, e le otto formule che userai ogni giorno per chiedere all'AI quello che ti serve.",
        meta: "8 lezioni · 50–90 min",
        tier: "free",
        tierLabel: "Gratis",
      },
      {
        number: "Percorso 03",
        iconSlug: "build",
        level: "intermediate",
        title: "Costruisci",
        desc: "Dalla prima conversazione alla prima feature funzionante. Workflow reali su progetti reali.",
        meta: "10 lezioni · 90–150 min",
        tier: "pro",
        tierLabel: "Pro",
      },
      {
        number: "Percorso 04",
        iconSlug: "debug",
        level: "advanced",
        title: "Risolvi i Bug",
        desc: "Quando l'AI sbaglia, sbagli tu. I quattro errori tipici e come uscirne in due prompt.",
        meta: "6 lezioni · 50–80 min",
        tier: "pro",
        tierLabel: "Pro",
      },
      {
        number: "Percorso 05",
        iconSlug: "ship",
        level: "advanced",
        title: "Pubblica al Mondo",
        desc: "Esci con un'app online — un link da condividere, costruito interamente da te.",
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
      text: "Il tuo prompt è elaborato da OpenAI (USA). Non inserire dati personali.",
      linkLabel: "Privacy",
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
  tools: {
    kicker: "GLI STRUMENTI",
    title: "Funziona con tutti gli strumenti che già conosci.",
    sub: "Promptly insegna **il metodo**. Tu scegli con quale AI applicarlo — Cursor, Claude Code, Windsurf, Copilot, oppure i builder web come Bolt e v0. Quando aggiungeremo lezioni dedicate a ogni strumento, le troverai qui.",
    cards: [
      {
        slug: "cursor",
        name: "Cursor",
        desc: "L'IDE AI di Anysphere, fork di VS Code. Standard de facto per chi fa vibe coding ogni giorno.",
        badge: "lezioni in arrivo",
        ariaLabel: "Cursor — lezioni dedicate in arrivo",
      },
      {
        slug: "claude-code",
        name: "Claude Code",
        desc: "Il CLI agentic di Anthropic. Vive nel terminale e si integra con qualsiasi editor — il preferito di Spark.",
        badge: "lezioni in arrivo",
        ariaLabel: "Claude Code — lezioni dedicate in arrivo",
      },
      {
        slug: "windsurf",
        name: "Windsurf",
        desc: "L'IDE AI di Codeium. Alternativa diretta a Cursor con flussi «agentic» più aggressivi.",
        badge: "lezioni in arrivo",
        ariaLabel: "Windsurf — lezioni dedicate in arrivo",
      },
      {
        slug: "copilot",
        name: "GitHub Copilot",
        desc: "Il primo, e ancora il più diffuso. Vive dentro VS Code, JetBrains, Visual Studio e da terminale.",
        badge: "lezioni in arrivo",
        ariaLabel: "GitHub Copilot — lezioni dedicate in arrivo",
      },
      {
        slug: "bolt",
        name: "Bolt.new",
        desc: "Costruisci app dalla chat, in browser, zero setup. Di StackBlitz — perfetto per partire.",
        badge: "lezioni in arrivo",
        ariaLabel: "Bolt.new — lezioni dedicate in arrivo",
      },
      {
        slug: "v0",
        name: "v0 by Vercel",
        desc: "Genera UI React parlando in italiano. Si specializza in interfacce belle dal primo prompt.",
        badge: "lezioni in arrivo",
        ariaLabel: "v0 by Vercel — lezioni dedicate in arrivo",
      },
    ],
  },
  faq: {
    title: "Quello che resta da chiedere.",
    sub: "",
    items: [
      {
        q: "Devo saper programmare?",
        a: "No, è il caso d'uso ideale. Se sai scrivere un messaggio chiaro, sai già il 70% di quello che ti serve. Non installiamo niente, non chiediamo termini tecnici — insegniamo come pensare e come parlare all'AI.",
      },
      {
        q: "È davvero gratis?",
        a: "I primi due percorsi (14 lezioni) sono gratis per sempre, senza carta di credito. Per i tre percorsi successivi c'è Pro, ma lo attivi solo se vuoi continuare. Niente trial nascosto, niente rinnovi a sorpresa.",
      },
      {
        q: "Quale AI userò durante il corso?",
        a: "Promptly insegna i principi che funzionano con qualsiasi AI: Claude, ChatGPT, Cursor, Copilot. Gli esempi usano Claude perché oggi è il più adatto a progetti reali, ma le idee sono universali.",
      },
      {
        q: "Quanto tempo richiede?",
        a: "Cinque minuti al giorno. Con questo ritmo finisci in circa sei settimane le 38 lezioni totali. Se vuoi accelerare puoi farne più di una al giorno — il ritmo lo decidi tu.",
      },
      {
        q: "A fine corso avrò un'app online?",
        a: "Sì. L'ultimo percorso si chiama «Pubblica al Mondo»: esci con un'app vera, online, funzionante, costruita interamente da te tramite vibe coding. Non un esercizio chiuso nell'app, ma un link che puoi condividere.",
      },
      {
        q: "Posso annullare Pro quando voglio?",
        a: "Sì, in un click dalle impostazioni. Niente penali, niente domande, niente catene di email. Se disattivi Pro mantieni comunque l'accesso alle 14 lezioni gratuite.",
      },
    ],
  },
  closingCta: {
    title: "Iniziamo.\nPromptly è gratis fino al primo progetto pubblicato.",
    sub: "",
    cta: "Inizia adesso →",
    reminder: "no carta · 5 minuti al giorno · 14 lezioni gratis",
  },
  footer: {
    columns: {
      product: {
        heading: "Prodotto",
        links: [
          { label: "Come funziona", href: "#method" },
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
    socialLinks: [
      {
        label: "Instagram",
        href: "https://www.instagram.com/learnpromptly.app/",
        platform: "instagram",
      },
      {
        label: "TikTok",
        href: "https://www.tiktok.com/@learnpromptly.app",
        platform: "tiktok",
      },
      {
        label: "YouTube",
        href: "https://www.youtube.com/@LearnPromptlyApp",
        platform: "youtube",
      },
      {
        label: "Facebook",
        href: "https://www.facebook.com/Learnpromptly",
        platform: "facebook",
      },
    ],
    rights: "© 2026 Promptly · Tutti i diritti riservati",
    builtWith: "Costruito con ❤ in Italia",
  },
};
