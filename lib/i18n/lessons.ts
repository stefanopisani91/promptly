import type { Lang, PathSlug } from "@/types";
import { getMindset02DynamicPlaceholders } from "@/lib/lessons/mindset-02-data";

export interface PathDisplay {
  title: string;
  tagline: string;
}

export interface LessonsCopy {
  pathOverview: {
    progressLabel: (current: number, total: number) => string;
    continueCta: string;
    startCta: string;
    reviewCta: string;
    lockedBanner: (prereqTitle: string) => string;
    comingSoonLessonLabel: string;
    completedBadge: string;
    estimatedMinutes: (n: number) => string;
    backToDashboardCta: string;
  };
  lessonPage: {
    breadcrumb: (pathTitle: string) => string;
    lessonOf: (n: number, total: number) => string;
    theoryHeading: string;
    exerciseHeading: string;
    promptLabel: string;
    checkAnswer: string;
    showHint: string;
    hintLabel: string;
    revealLabel: string;
    revealedNotice: string;
    explanationLabel: string;
    attemptOf: (n: number, total: number) => string;
    correctMessage: string;
    wrongInline: string;
    blankPlaceholder: string;
    blankAriaLabel: (n: number) => string;
    backToPathCta: string;
  };
  // V2 — open_question, archetype_quiz, completion CTA. The open_question
  // copy is used for the inline AI commentary widget; archetype_quiz copy
  // wraps the multi-step quiz; completion CTA marks a V2 lesson done.
  //
  // ALL fields are static strings (no functions). Templates use {token}
  // placeholders that the client substitutes at render time. This is the
  // mandatory pattern for anything crossing into Client Components — see
  // PROMPTLY.md regression notes (commit 09d78a2 + Round 3a digest
  // 293253662) and the same convention in lessonPage.attemptOf which is
  // pre-resolved into an array at the page level.
  v2: {
    openQuestion: {
      submitCta: string;
      submitting: string;
      submittedLabel: string;
      placeholderFallback: string;
      // Template: "{current} / {max}"
      charCounterTemplate: string;
      networkError: string;
      apiError: string;
      missingKeyError: string;
      retryCta: string;
      skipCta: string;
      skippedNotice: string;
    };
    archetypeQuiz: {
      // Template: "Domanda {n} di {total}" / "Question {n} of {total}"
      questionOfTemplate: string;
      pickOneHint: string;
      revealCta: string;
      revealedTitle: string;
      // Template: "+{xp} XP bonus"
      bonusXpTemplate: string;
      retakeCta: string;
    };
    completion: {
      finishCta: string;
      alreadyCompleted: string;
    };
  };
  // V3 — card-step lesson with Spark mascot. All values are static strings;
  // templates use {token} placeholders the client substitutes at render
  // time, mirroring the convention enforced by the V2 fields above.
  v3: {
    header: {
      // "{current} / {total}"
      stepCounterTemplate: string;
      exitLabel: string;
      vignetteCloseLabel: string;
    };
    navigation: {
      backCta: string;
      nextCta: string;
      finishCta: string;
      cliffhangerLabel: string;
      pathHrefLabel: string;
      // Eyebrow shown on the completion card when the user has just
      // replayed an already-completed lesson and earned no extra XP.
      replayBadge: string;
    };
    inputStep: {
      submitCta: string;
      submitting: string;
      // "{current} / {max}"
      charCounterTemplate: string;
      networkError: string;
      apiError: string;
      retryCta: string;
      youLabel: string;
      sparkLabel: string;
    };
    rewardStep: {
      // "+{xp} XP"
      xpBonusTemplate: string;
      archetypeEyebrow: string;
    };
    interactiveStep: {
      hint: string;
      // "Tentativo {current} / {max}"
      attemptCounterTemplate: string;
      placeholder: string;
      submitCta: string;
      submitting: string;
      retryCta: string;
      finalCta: string;
      networkError: string;
      rateLimitError: string;
      apiError: string;
      awaitingPrompt: string;
      // Mobile-only tab labels in the interactive step. Desktop shows
      // both panels side by side and ignores these.
      sparkTabLabel: string;
      siteTabLabel: string;
      reactions: {
        vague: string;
        photoOnly: string;
        twoBugs: string;
        allBugsLowScore: string;
        allBugsHighScore: string;
        finalEncouragePartial: string;
        finalEncourageFull: string;
        secondAttemptHintPhoto: string;
        secondAttemptHintImproved: string;
        thirdAttemptDirect: string;
      };
    };
    // Lesson 2 — CLAUDE.md editor widget.
    claudemdEditor: {
      intro: string;
      selectProjectLabel: string;
      selectedLabel: string;
      sectionPlaceholderHint: string;
      // Per-section: "{current} / {max}"
      charCounterTemplate: string;
      // Unified bottom-of-editor counter: "{current} / {max} caratteri
      // totali" (or "chars total" in EN). Different from the per-section
      // template because Lesson 2 uses the unified one and future lessons
      // may want either or both.
      totalCharCounterTemplate: string;
      // "Tentativo {current} / {max}"
      attemptCounterTemplate: string;
      // Visible text + aria-label for the "compiled" badge that
      // appears next to a section title once it crosses the
      // minCharsForBadge threshold.
      sectionFilledBadgeText: string;
      sectionFilledBadgeAriaLabel: string;
      // Per-project placeholder copy for the "stack" and "rules" sections,
      // resolved for the user's locale. Pre-resolved here so the component
      // doesn't need to carry a lang prop. Sections whose `kind` doesn't
      // match these (e.g. "what" / "workflow") fall through to the static
      // placeholder shipped in the lesson JSON.
      sectionPlaceholdersByProject: {
        stack: Record<string, string>;
        rules: Record<string, string>;
      };
      submitCta: string;
      submitting: string;
      retryCta: string;
      finalCta: string;
      awaitingPrompt: string;
      outOfAttempts: string;
      networkError: string;
      apiError: string;
      rateLimitError: string;
      // Surfaced when the server rejects the editor text via the
      // injection pre-filter (signal logged to spark_safety_log).
      invalidInputError: string;
      // Per-user daily cap on the CLAUDE.md grader. Distinct from the
      // per-lesson 3 attempts cap (which is exposed as "outOfAttempts").
      dailyQuotaExhausted: string;
      editorTabLabel: string;
      sparkTabLabel: string;
    };
    // Lesson 3 — Context-prompt editor widget (parallel to claudemdEditor
    // but graded on the 4 levels of context — project / code / constraints /
    // examples). Same animation effects, different rubric copy.
    contextEditor: {
      intro: string;
      selectScenarioLabel: string;
      emptyPromptLabel: string;
      // Sub-label clarifying the empty box is a read-only example.
      emptyPromptSubtitle: string;
      // Mobile-only collapsed CTA on the empty box ("tap to expand").
      emptyPromptExpandLabel: string;
      richPromptLabel: string;
      // Eyebrow + arrow helper shown above the editable box until the
      // user focuses it for the first time.
      writeHereLabel: string;
      // Multi-line placeholder shown in the rich-prompt textarea before the
      // user types. Encodes the 4 levels as a soft scaffold; whitespace is
      // significant — the textarea uses `whitespace-pre-line` to preserve
      // the line breaks so the user sees the structure.
      richPromptPlaceholder: string;
      totalCharCounterTemplate: string;
      attemptCounterTemplate: string;
      submitCta: string;
      submitting: string;
      retryCta: string;
      finalCta: string;
      awaitingPrompt: string;
      outOfAttempts: string;
      networkError: string;
      apiError: string;
      rateLimitError: string;
      invalidInputError: string;
      dailyQuotaExhausted: string;
      editorTabLabel: string;
      sparkTabLabel: string;
      // Localised labels for the 4 dimension bars shown in Spark's panel
      // after evaluation. Keys map 1:1 to ContextLayer.
      layerLabels: {
        project: string;
        code: string;
        constraints: string;
        examples: string;
      };
    };
    chat: {
      launcherLabel: string;
      modalTitle: string;
      // "{remaining} / {limit} messaggi rimasti"
      modalSubtitleTemplate: string;
      closeLabel: string;
      placeholder: string;
      sendCta: string;
      sending: string;
      // Big bold headline shown inside the empty chat hero (above
      // emptyHint). Localised so EN sessions don't see IT copy.
      emptyHero: string;
      emptyHint: string;
      quotaExhausted: string;
      // Shown when the per-day cap (across all lessons) is reached.
      // Different from quotaExhausted (per-lesson) — moving to another
      // lesson won't help.
      dailyQuotaExhausted: string;
      networkError: string;
      apiError: string;
      unauthorized: string;
      hintExamples: string[];
    };
    // Glossario Vivo — strings consumed by the GlossaryProvider /
    // GlossaryPopover (see Glossario_Vivo_Blueprint.md). The dictionary
    // entries themselves live in lib/glossary/glossary.ts (IT+EN per term);
    // these are the chrome around the popover.
    glossary: {
      // Header eyebrow ("Spark spiega" / "Spark explains")
      popoverEyebrow: string;
      // CTA at the bottom of the popover that opens SparkChat with a
      // prefilled draft.
      deeperCta: string;
      // Aria-label for the X close button.
      closeLabel: string;
      // Aria-label for the mobile bottom-sheet drag handle.
      bottomSheetGrabberLabel: string;
      // Template that builds the prefilled chat message. {term} is
      // replaced with the localised label of the clicked term.
      prefillTemplate: string;
    };
    // Lesson-specific copy injected at server-render time. Lives here
    // because it's translated alongside the rest of the lesson UI; the
    // values themselves are consumed by lib/lessons/v3/personalize.ts
    // when the page rewrites a step based on the user's profile.
    mindset01: {
      projectRecall: {
        // Replaces the original input-step intro line.
        intro: string;
        // Used when the user filled `project_description` in onboarding.
        recall: (project: string) => string;
        // Used when the user picked "exploring" in onboarding (no idea yet).
        exploring: string;
      };
    };
    // Lesson 2 — server-rendered personalisation strings injected by
    // lib/lessons/v3/personalize.ts based on preferred_tool / experience_level.
    mindset02: {
      step5: {
        // Cos'è un IDE AI — lunghezza variabile per livello.
        beginner: string[];
        triedFailed: string[];
        workingOnIt: string[];
        advanced: string[];
      };
      step8: {
        // Anticipazione concetto chiave — varia con preferred_tool.
        // Default usato quando preferred_tool è null o non riconosciuto.
        default: string[];
        // Build the personalised paragraphs at runtime — the tool name and
        // its config-file label come from the catalog (lib/onboarding/tools.ts).
        withTool: (toolName: string, configFile: string) => string[];
      };
    };
    // Lesson 3 — server-rendered personalisation strings injected by
    // lib/lessons/v3/personalize.ts based on project_description (step 11
    // "applied-example") and preferred_tool (step 12 "quickwin-intro" tip).
    mindset03: {
      step11: {
        // Generic example shown when the user is exploring (no project yet).
        // Returns the full paragraph block for the step.
        exploring: string[];
        // Project-recall variant: weaves the user's actual project_description
        // into the same example. Caller passes the raw description string.
        withProject: (project: string) => string[];
      };
      // Tool-specific PS appended to the quickwin-intro step when the user
      // has a preferred_tool. When `withTool` returns null, we fall back to
      // the static `default` paragraphs from the JSON.
      step12: {
        default: string[];
        withTool: (toolName: string) => string[];
      };
    };
  };
  outro: {
    title: string;
    xpEarned: (xp: number) => string;
    nextLessonCta: string;
    backToPathCta: string;
    pathCompletedTitle: string;
    pathCompletedSub: string;
  };
  toast: {
    xpLabel: (xp: number) => string;
    dismissLabel: string;
  };
  navigationLabel: string;
  pathDisplay: Record<PathSlug, PathDisplay>;
  proPathBadge: string;
  proPathSub: string;
  continueCard: {
    eyebrow: string;
    startEyebrow: string;
    fallbackTitle: string;
    cta: string;
    startCta: string;
  };
}

const it: LessonsCopy = {
  pathOverview: {
    progressLabel: (c, t) => `${c}/${t} lezioni completate`,
    continueCta: "Continua →",
    startCta: "Inizia →",
    reviewCta: "Rivedi",
    lockedBanner: (prereq) => `🔒 Completa ${prereq} per sbloccare questo percorso.`,
    comingSoonLessonLabel: "In arrivo",
    completedBadge: "Completata",
    estimatedMinutes: (n) => `${n} min`,
    backToDashboardCta: "← Dashboard",
  },
  lessonPage: {
    breadcrumb: (path) => `Percorso: ${path}`,
    lessonOf: (n, t) => `Lezione ${n} di ${t}`,
    theoryHeading: "Teoria",
    exerciseHeading: "Mettiti alla prova",
    promptLabel: "Completa la frase",
    checkAnswer: "Controlla risposta",
    showHint: "Suggerimento",
    hintLabel: "Suggerimento",
    revealLabel: "Risposta rivelata",
    revealedNotice: "XP dimezzato perché la risposta è stata rivelata.",
    explanationLabel: "Spiegazione",
    attemptOf: (n, t) => `Tentativo ${n} di ${t}`,
    correctMessage: "Corretto! ✓",
    wrongInline: "Non ancora. Riprova.",
    blankPlaceholder: "…",
    blankAriaLabel: (n) => `Spazio ${n}`,
    backToPathCta: "← Torna al percorso",
  },
  outro: {
    title: "Lezione completata.",
    xpEarned: (xp) => `+${xp} XP`,
    nextLessonCta: "Prossima lezione →",
    backToPathCta: "Torna al percorso",
    pathCompletedTitle: "Percorso completato.",
    pathCompletedSub: "Hai sbloccato il percorso successivo.",
  },
  toast: {
    xpLabel: (xp) => `+${xp} XP`,
    dismissLabel: "Chiudi",
  },
  navigationLabel: "Navigazione lezione",
  pathDisplay: {
    mindset: {
      title: "Mindset",
      tagline: "Pensa come un vibe coder prima di scrivere un prompt.",
    },
    prompt: {
      title: "Prompt",
      tagline: "Un prompt è una specifica. Imparala e l’AI ti seguirà.",
    },
    build: {
      title: "Build",
      tagline: "Costruisci progetti reali, un prompt alla volta.",
    },
    debug: {
      title: "Debug",
      tagline: "L’AI rompe le cose. Tu impari a sistemarle a parole.",
    },
    ship: {
      title: "Ship",
      tagline: "Da localhost al mondo.",
    },
  },
  proPathBadge: "Pro · in arrivo",
  proPathSub: "Disponibile dopo aver completato i percorsi gratuiti.",
  continueCard: {
    eyebrow: "Continua dove eri rimasto",
    startEyebrow: "Inizia il viaggio",
    fallbackTitle: "Cos’è il vibe coding?",
    cta: "Riprendi →",
    startCta: "Inizia la prima lezione →",
  },
  v2: {
    openQuestion: {
      submitCta: "Invia",
      submitting: "Sto leggendo…",
      submittedLabel: "La tua risposta",
      placeholderFallback: "Scrivi qui la tua risposta…",
      charCounterTemplate: "{current} / {max}",
      networkError: "Connessione assente. Controlla la rete e riprova.",
      apiError:
        "Il commento non è disponibile in questo momento. Puoi andare avanti — il commento è opzionale.",
      missingKeyError: "Servizio AI non disponibile. Riprova più tardi.",
      retryCta: "Riprova",
      skipCta: "Salta",
      skippedNotice:
        "Hai saltato la domanda. Puoi tornare e rispondere quando vuoi.",
    },
    archetypeQuiz: {
      questionOfTemplate: "Domanda {n} di {total}",
      pickOneHint: "Scegli un’opzione per andare avanti.",
      revealCta: "Scopri il tuo archetipo →",
      revealedTitle: "Il tuo archetipo",
      bonusXpTemplate: "+{xp} XP bonus",
      retakeCta: "Rifai il quiz",
    },
    completion: {
      finishCta: "Completa la lezione →",
      alreadyCompleted: "Hai già completato questa lezione.",
    },
  },
  v3: {
    header: {
      stepCounterTemplate: "Passo {current} / {total}",
      exitLabel: "Esci dalla lezione",
      vignetteCloseLabel: "Chiudi pensiero",
    },
    navigation: {
      backCta: "Indietro",
      nextCta: "Avanti",
      finishCta: "Concludi",
      cliffhangerLabel: "Continua",
      pathHrefLabel: "Torna al percorso",
      replayBadge: "Hai ripassato la lezione.",
    },
    inputStep: {
      submitCta: "Invia",
      submitting: "Sto leggendo…",
      charCounterTemplate: "{current} / {max}",
      networkError: "Sono offline. Non è colpa tua. Riprova quando hai rete.",
      apiError: "Non riesco a risponderti adesso. Andiamo avanti — il commento è opzionale.",
      retryCta: "Riprova",
      youLabel: "tu",
      sparkLabel: "spark",
    },
    rewardStep: {
      xpBonusTemplate: "+{xp} XP",
      archetypeEyebrow: "Il tuo archetipo",
    },
    interactiveStep: {
      hint: "Io non vedo il sito come lo vedi tu. Descrivimi cosa noti.",
      attemptCounterTemplate: "Tentativo {current} / {max}",
      placeholder: "Scrivi qui il prompt che useresti…",
      submitCta: "Invia a Spark",
      submitting: "Sto valutando…",
      retryCta: "Riprova",
      finalCta: "Continua →",
      networkError: "Sono offline. Non è colpa tua. Riprova quando hai rete.",
      rateLimitError: "Troppi tentativi ravvicinati. Dammi un momento.",
      apiError: "Qualcosa non ha funzionato. Non è colpa tua. Riprova tra poco.",
      awaitingPrompt: "Aspetto il tuo prompt. Guarda il sito e dimmi cosa non torna.",
      sparkTabLabel: "Spark",
      siteTabLabel: "Sito",
      reactions: {
        vague: "Aspetta. Hai scritto qualcosa, ma posso solo tirare a indovinare. È come se mi chiedessi «cucinami qualcosa» senza dirmi cosa hai nel frigo. Guarda di nuovo il sito di Lucia: cosa vedi che non funziona?",
        photoOnly: "Ok, qualcosa hai visto. Hai notato la foto rotta. L'ho sistemata — la vedi adesso? Ma c'è altro che non va. Continua a guardare con attenzione.",
        twoBugs: "Quasi. Hai trovato due dei tre problemi. Ho sistemato entrambi. Manca ancora un elemento. Ti do un indizio: c'è qualcosa che dovrebbe essere visibile e non lo è.",
        allBugsLowScore: "Hai notato tutti i problemi, complimenti per la vista. Ma il prompt è ancora vago. Mi hai detto cosa è rotto, non come sistemarlo. Riformula: cosa vuoi che IO faccia con quello che hai notato?",
        allBugsHighScore: "Ecco. Questo è un prompt vero. Mi hai detto cosa vedi, cosa vuoi, e mi hai dato i dettagli per non sbagliare. Guarda — ho sistemato tutto. Hai appena diretto un'AI come una professionista.",
        finalEncouragePartial: "Va bene così. Hai imparato la cosa più importante: per farmi funzionare devi dirmi cosa fare. Tornerai qui in futuro e farai un prompt perfetto.",
        finalEncourageFull: "Hai fatto un lavoro vero. Te lo segno mentalmente — sei già più avanti di quello che pensi.",
        secondAttemptHintPhoto: "Meglio. Stavolta mi hai dato qualcosa di concreto. L'ho sistemato. Continua così — guarda gli altri elementi della pagina.",
        secondAttemptHintImproved: "Buon lavoro. Stai aggiungendo specificità. Ora il prompt è più completo. Manca ancora qualcosa.",
        thirdAttemptDirect: "Ultimo tentativo. Te lo dico chiaro: ci sono tre problemi sul sito di Lucia. Foto. Titolo. Bottone. Adesso che li sai tutti, scrivimi un prompt completo per sistemarli.",
      },
    },
    claudemdEditor: {
      intro: "Scegli uno dei tre progetti, poi scrivi il tuo CLAUDE.md. Lo leggo io e ti dico cosa funziona e cosa manca.",
      selectProjectLabel: "Scegli il progetto",
      selectedLabel: "Selezionato",
      sectionPlaceholderHint: "Scrivi qui le tue 4 sezioni. Tieni separati i blocchi con un'a capo.",
      charCounterTemplate: "{current} / {max} caratteri",
      totalCharCounterTemplate: "{current} / {max} caratteri totali",
      attemptCounterTemplate: "Tentativo {current} / {max}",
      sectionFilledBadgeText: "compilata",
      sectionFilledBadgeAriaLabel: "Sezione compilata",
      sectionPlaceholdersByProject: getMindset02DynamicPlaceholders("it"),
      submitCta: "Invia a Spark",
      submitting: "Sto leggendo…",
      retryCta: "Riprova",
      finalCta: "Continua →",
      awaitingPrompt: "Scegli un progetto e scrivi le 4 sezioni. Poi te lo commento.",
      outOfAttempts: "Va bene così. Hai dato il massimo per oggi. Quello che hai imparato resta.",
      networkError: "Sono offline. Non è colpa tua. Riprova quando hai rete.",
      apiError: "Qualcosa non ha funzionato. Riprova tra poco.",
      rateLimitError: "Troppi tentativi ravvicinati. Dammi un momento.",
      invalidInputError: "Quel testo non posso valutarlo. Riformula nelle 4 sezioni: cosa, stack, regole, workflow.",
      dailyQuotaExhausted: "Per oggi hai esaurito le valutazioni che posso farti. Torna domani — il tuo testo lo tieni tu.",
      editorTabLabel: "Editor",
      sparkTabLabel: "Spark",
    },
    contextEditor: {
      intro: "Scegli uno scenario. A destra hai il prompt vuoto come riferimento. A sinistra trasformalo aggiungendo i 4 livelli di contesto.",
      selectScenarioLabel: "Scegli lo scenario",
      emptyPromptLabel: "PROMPT VUOTO",
      emptyPromptSubtitle: "(esempio, non modificabile)",
      emptyPromptExpandLabel: "Tocca per espandere",
      richPromptLabel: "IL TUO PROMPT",
      writeHereLabel: "Scrivi qui sotto i 4 livelli",
      richPromptPlaceholder: "Aggiungi i 4 livelli di contesto. Esempio:\n\n[1. PROGETTO]\nStiamo costruendo… (descrivi cosa)\n\n[2. CODICE/FILE]\nI file esistenti sono… / La struttura è…\n\n[3. VINCOLI]\nNON fare X. NON modificare Y.\n\n[4. ESEMPI]\nRiusa il pattern di [file simile esistente].",
      totalCharCounterTemplate: "{current} / {max} caratteri",
      attemptCounterTemplate: "Tentativo {current} / {max}",
      submitCta: "Invia a Spark",
      submitting: "Sto leggendo…",
      retryCta: "Riprova",
      finalCta: "Continua →",
      awaitingPrompt: "Scegli uno scenario e scrivi il prompt ricco. Poi te lo commento.",
      outOfAttempts: "Va bene così. Hai dato il massimo per oggi. Quello che hai imparato resta.",
      networkError: "Sono offline. Non è colpa tua. Riprova quando hai rete.",
      apiError: "Qualcosa non ha funzionato. Riprova tra poco.",
      rateLimitError: "Troppi tentativi ravvicinati. Dammi un momento.",
      invalidInputError: "Quel testo non posso valutarlo. Riformulalo come prompt vero, con i 4 livelli di contesto.",
      dailyQuotaExhausted: "Per oggi hai esaurito le valutazioni che posso farti. Torna domani — il tuo prompt lo tieni tu.",
      editorTabLabel: "Editor",
      sparkTabLabel: "Spark",
      layerLabels: {
        project: "progetto",
        code: "codice",
        constraints: "vincoli",
        examples: "esempi",
      },
    },
    chat: {
      launcherLabel: "Chiedi a Spark",
      modalTitle: "Spark",
      modalSubtitleTemplate: "{remaining} di {limit} messaggi rimasti in questa lezione",
      closeLabel: "Chiudi chat",
      placeholder: "Scrivi a Spark…",
      sendCta: "Invia",
      sending: "Sto pensando…",
      emptyHero: "Chiedimi pure!",
      emptyHint: "Chiedimi quello che vuoi sulla lezione, sul vibe coding, su quello che ti blocca.",
      quotaExhausted: "Hai usato tutti i messaggi per questa lezione. Riprovi nella prossima.",
      dailyQuotaExhausted: "Per oggi abbiamo parlato abbastanza. Torna domani.",
      networkError: "Connessione assente. Riprova.",
      apiError: "Non riesco a risponderti adesso. Riprova tra un momento.",
      unauthorized: "Devi essere loggato per chattare con me.",
      hintExamples: [
        "Cosa significa «fare un prompt specifico»?",
        "Perché hai detto che non sei intelligente?",
        "Da dove vengo io? Dimmi qualcosa di te.",
      ],
    },
    glossary: {
      popoverEyebrow: "Spark spiega",
      deeperCta: "Vuoi che approfondisca?",
      closeLabel: "Chiudi spiegazione",
      bottomSheetGrabberLabel: "Trascina per chiudere",
      prefillTemplate:
        "Mi puoi spiegare meglio cos'è {term}? Non mi è chiaro al 100%.",
    },
    mindset01: {
      projectRecall: {
        intro: "Adesso parliamo di te.",
        recall: (project) =>
          `Mi dicesti che vuoi costruire "${project}". Lavoreremo su quello come esempio.`,
        exploring:
          "Tu stai esplorando, va bene. Useremo l'esempio di Lucia, che vuole costruire FrigoMagico — la vedrai tra poco.",
      },
    },
    mindset02: {
      step5: {
        beginner: [
          "Senti. L'[[term:ide]]IDE[[/term]] è il posto dove scrivi codice. Non è una novità — esiste dagli anni '60.",
          "L'IDE AI è la stessa cosa, ma con un'AI dentro che vede tutto quello che fai. Vede i file, vede gli errori, vede il contesto. Quando le chiedi qualcosa, non parte da zero.",
          "Tre nomi che sentirai sempre nel 2026: Cursor, Windsurf, Claude Code. Sono i più usati.",
        ],
        triedFailed: [
          "L'[[term:ide]]IDE AI[[/term]] è il posto dove scrivi e l'AI vede tutto: file, errori, contesto. Niente più copia-incolla tra tab diverse.",
          "Tu hai già provato qualcosa, quindi sai com'è quando l'AI dimentica il file precedente. Ecco — un IDE AI risolve quel pezzo lì.",
          "Tre nomi del 2026: Cursor, Windsurf, Claude Code. Cugini di sangue.",
        ],
        workingOnIt: [
          "Tu lo sai già cos'è un [[term:ide]]IDE[[/term]]. Quello che cambia con l'AI è che non parla a vuoto — vede tutto il contesto del progetto.",
          "Niente più copia-incolla. È l'unica vera differenza, ed è enorme.",
        ],
        advanced: [
          "Ti risparmio le definizioni — sai già cos'è un [[term:ide]]IDE AI[[/term]] e perché vede il contesto.",
          "Andiamo dritti al pezzo che molti dei tuoi colleghi non sanno davvero: come si configura.",
        ],
      },
      step8: {
        default: [
          "Adesso ti dico una cosa che pochi sanno e che cambia tutto.",
          "Non importa quale IDE AI usi. Tutti hanno lo stesso problema: l'AI dimentica chi sei tra una conversazione e l'altra.",
          "C'è un trucco per risolverlo. È un file. Si chiama [[term:claude-md]]CLAUDE.md[[/term]], AGENTS.md, o cursor rules — dipende dal tool. Ma il principio è sempre lo stesso.",
        ],
        withTool: (toolName, configFile) => [
          "Adesso ti dico una cosa che pochi sanno e che cambia tutto.",
          `${toolName} ha lo stesso problema di tutti gli altri IDE AI: dimentica chi sei tra una conversazione e l'altra.`,
          `C'è un trucco per risolverlo. In ${toolName} si chiama \`${configFile}\`. In altri tool ha nomi diversi — [[term:claude-md]]CLAUDE.md[[/term]], AGENTS.md, windsurfrules. Ma il principio è lo stesso.`,
        ],
      },
    },
    mindset03: {
      step11: {
        exploring: [
          "Ti faccio un esempio con un progetto-tipo.",
          "Immagina di chiedere all'AI «aggiungi una [[term:funzione]]funzione[[/term]] di login».",
          "Versione SENZA contesto: «aggiungi una funzione di login». L'AI improvvisa di sana pianta — magari ti tira fuori una login con OAuth Google quando tu volevi solo email/password.",
          "Versione CON contesto: «Stiamo costruendo un'app web semplice. Aggiungi login email/password. Riusa lo stile delle altre form in /components/forms. Niente OAuth per ora.» L'AI fa esattamente quello che vuoi tu.",
        ],
        withProject: (project) => [
          "Ti faccio un esempio col TUO progetto.",
          `Mi dicesti che vuoi costruire "${project}". Bene. Immagina di chiedere all'AI «aggiungi una [[term:funzione]]funzione[[/term]] di login».`,
          "Versione SENZA contesto: «aggiungi una funzione di login». L'AI inventa di sana pianta — magari ti tira fuori una login con OAuth Google quando tu volevi solo email/password.",
          `Versione CON contesto: «Stiamo costruendo ${project}. Aggiungi login email/password. Riusa lo stile delle altre form in /components/forms. Niente OAuth per ora.» L'AI fa esattamente quello che vuoi tu.`,
        ],
      },
      step12: {
        default: [
          "Adesso ti tocca.",
          "Ti darò un prompt scarno. Tu lo dovrai trasformare aggiungendo i 4 livelli di contesto.",
          "Non serve essere perfetti. Serve essere RICCHI. Andiamo.",
        ],
        withTool: (toolName) => [
          "Adesso ti tocca.",
          "Ti darò un prompt scarno. Tu lo dovrai trasformare aggiungendo i 4 livelli di contesto.",
          "Non serve essere perfetti. Serve essere RICCHI. Andiamo.",
          `PS: in ${toolName} parte del contesto puoi passarlo coi tag dei file (@filename, drag-and-drop, o quello che il tool offre). È un trucco del mestiere — te lo ricordo come bonus.`,
        ],
      },
    },
  },
};

const en: LessonsCopy = {
  pathOverview: {
    progressLabel: (c, t) => `${c}/${t} lessons completed`,
    continueCta: "Continue →",
    startCta: "Start →",
    reviewCta: "Review",
    lockedBanner: (prereq) => `🔒 Complete ${prereq} to unlock this path.`,
    comingSoonLessonLabel: "Coming soon",
    completedBadge: "Completed",
    estimatedMinutes: (n) => `${n} min`,
    backToDashboardCta: "← Dashboard",
  },
  lessonPage: {
    breadcrumb: (path) => `Path: ${path}`,
    lessonOf: (n, t) => `Lesson ${n} of ${t}`,
    theoryHeading: "Theory",
    exerciseHeading: "Test yourself",
    promptLabel: "Complete the sentence",
    checkAnswer: "Check answer",
    showHint: "Hint",
    hintLabel: "Hint",
    revealLabel: "Answer revealed",
    revealedNotice: "XP halved because the answer was revealed.",
    explanationLabel: "Explanation",
    attemptOf: (n, t) => `Attempt ${n} of ${t}`,
    correctMessage: "Correct! ✓",
    wrongInline: "Not quite. Try again.",
    blankPlaceholder: "…",
    blankAriaLabel: (n) => `Blank ${n}`,
    backToPathCta: "← Back to path",
  },
  outro: {
    title: "Lesson complete.",
    xpEarned: (xp) => `+${xp} XP`,
    nextLessonCta: "Next lesson →",
    backToPathCta: "Back to path",
    pathCompletedTitle: "Path completed.",
    pathCompletedSub: "You unlocked the next path.",
  },
  toast: {
    xpLabel: (xp) => `+${xp} XP`,
    dismissLabel: "Dismiss",
  },
  navigationLabel: "Lesson navigation",
  pathDisplay: {
    mindset: {
      title: "Mindset",
      tagline: "Think like a vibe coder before you write a single prompt.",
    },
    prompt: {
      title: "Prompt",
      tagline: "A prompt is a specification. Learn it and the AI follows.",
    },
    build: {
      title: "Build",
      tagline: "Ship real projects, one prompt at a time.",
    },
    debug: {
      title: "Debug",
      tagline: "The AI will break things. You'll learn to fix them with words.",
    },
    ship: {
      title: "Ship",
      tagline: "From localhost to the world.",
    },
  },
  proPathBadge: "Pro · coming soon",
  proPathSub: "Unlocks after you finish the free paths.",
  continueCard: {
    eyebrow: "Continue where you left off",
    startEyebrow: "Start your journey",
    fallbackTitle: "What is vibe coding?",
    cta: "Resume →",
    startCta: "Start the first lesson →",
  },
  v2: {
    openQuestion: {
      submitCta: "Send",
      submitting: "Reading…",
      submittedLabel: "Your answer",
      placeholderFallback: "Type your answer here…",
      charCounterTemplate: "{current} / {max}",
      networkError: "No connection. Check the network and retry.",
      apiError:
        "The comment isn't available right now. You can keep going — the comment is optional.",
      missingKeyError: "AI service unavailable. Please try again later.",
      retryCta: "Retry",
      skipCta: "Skip",
      skippedNotice:
        "You skipped this question. You can come back and answer whenever you want.",
    },
    archetypeQuiz: {
      questionOfTemplate: "Question {n} of {total}",
      pickOneHint: "Pick one option to continue.",
      revealCta: "Reveal your archetype →",
      revealedTitle: "Your archetype",
      bonusXpTemplate: "+{xp} bonus XP",
      retakeCta: "Retake the quiz",
    },
    completion: {
      finishCta: "Complete the lesson →",
      alreadyCompleted: "You've already completed this lesson.",
    },
  },
  v3: {
    header: {
      stepCounterTemplate: "Step {current} / {total}",
      exitLabel: "Exit lesson",
      vignetteCloseLabel: "Close thought",
    },
    navigation: {
      backCta: "Back",
      nextCta: "Next",
      finishCta: "Finish",
      cliffhangerLabel: "Continue",
      pathHrefLabel: "Back to path",
      replayBadge: "You replayed this lesson.",
    },
    inputStep: {
      submitCta: "Send",
      submitting: "Reading…",
      charCounterTemplate: "{current} / {max}",
      networkError: "I'm offline. Not your fault. Try again when you're back.",
      apiError: "I can't reply right now. Let's keep moving — the comment is optional.",
      retryCta: "Retry",
      youLabel: "you",
      sparkLabel: "spark",
    },
    rewardStep: {
      xpBonusTemplate: "+{xp} XP",
      archetypeEyebrow: "Your archetype",
    },
    interactiveStep: {
      hint: "I don't see the site the way you do. Tell me what catches your eye.",
      attemptCounterTemplate: "Try {current} / {max}",
      placeholder: "Write the prompt you'd use…",
      submitCta: "Send to Spark",
      submitting: "Evaluating…",
      retryCta: "Retry",
      finalCta: "Continue →",
      networkError: "I'm offline. Not your fault. Try again when you're back.",
      rateLimitError: "Too many tries too fast. Give me a moment.",
      apiError: "Something didn't work. Not your fault. Try again in a bit.",
      awaitingPrompt: "Waiting on your prompt. Look at the site and tell me what's off.",
      sparkTabLabel: "Spark",
      siteTabLabel: "Site",
      reactions: {
        vague: "Wait. You wrote something, but I can only guess. It's like asking me to «cook something» without telling me what's in the fridge. Look at Lucia's site again — what's not working?",
        photoOnly: "Okay, you spotted something. You noticed the broken photo. I fixed it — see it now? But there's more. Keep looking carefully.",
        twoBugs: "Almost. You found two of the three problems. Fixed both. Still one element missing. Hint: there's something that should be visible but isn't.",
        allBugsLowScore: "You spotted every problem — good eye. But the prompt is still vague. You told me what's broken, not how to fix it. Try again: what do you want ME to do with what you noticed?",
        allBugsHighScore: "There it is. That's a real prompt. You told me what you see, what you want, and gave me the details to get it right. Look — everything's fixed. You just directed an AI like a pro.",
        finalEncouragePartial: "It's fine. You learned the most important thing: to make me work, you have to tell me what to do. You'll come back to this and write a perfect prompt.",
        finalEncourageFull: "You did real work. I'm noting it — you're further along than you think.",
        secondAttemptHintPhoto: "Better. This time you gave me something concrete. Fixed. Keep going — look at the other elements on the page.",
        secondAttemptHintImproved: "Good. You're adding specificity. The prompt is more complete now. Still missing one thing.",
        thirdAttemptDirect: "Last try. I'll be straight: there are three problems on Lucia's site. Photo. Title. Button. Now that you know all three, write me a complete prompt to fix them.",
      },
    },
    claudemdEditor: {
      intro: "Pick one of the three projects, then write your CLAUDE.md. I'll read it and tell you what works and what's missing.",
      selectProjectLabel: "Pick a project",
      selectedLabel: "Selected",
      sectionPlaceholderHint: "Write your 4 sections here. Keep blocks apart with a blank line.",
      charCounterTemplate: "{current} / {max} chars",
      totalCharCounterTemplate: "{current} / {max} chars total",
      attemptCounterTemplate: "Try {current} / {max}",
      sectionFilledBadgeText: "filled",
      sectionFilledBadgeAriaLabel: "Section filled",
      sectionPlaceholdersByProject: getMindset02DynamicPlaceholders("en"),
      submitCta: "Send to Spark",
      submitting: "Reading…",
      retryCta: "Retry",
      finalCta: "Continue →",
      awaitingPrompt: "Pick a project and fill the 4 sections. Then I'll comment.",
      outOfAttempts: "It's fine. You gave today your best. What you learned sticks.",
      networkError: "I'm offline. Not your fault. Try again when you're back.",
      apiError: "Something went wrong. Try again in a bit.",
      rateLimitError: "Too many tries too fast. Give me a moment.",
      invalidInputError: "I can't grade that text. Rewrite it inside the 4 sections: what, stack, rules, workflow.",
      dailyQuotaExhausted: "You've used all the evaluations I can give you today. Come back tomorrow — your text stays with you.",
      editorTabLabel: "Editor",
      sparkTabLabel: "Spark",
    },
    contextEditor: {
      intro: "Pick a scenario. The empty prompt is on the right as a reference. Transform it on the left by adding the 4 levels of context.",
      selectScenarioLabel: "Pick a scenario",
      emptyPromptLabel: "EMPTY PROMPT",
      emptyPromptSubtitle: "(example, read-only)",
      emptyPromptExpandLabel: "Tap to expand",
      richPromptLabel: "YOUR PROMPT",
      writeHereLabel: "Write the 4 levels below",
      richPromptPlaceholder: "Add the 4 levels of context. Example:\n\n[1. PROJECT]\nWe're building… (describe what)\n\n[2. CODE/FILES]\nThe existing files are… / The structure is…\n\n[3. CONSTRAINTS]\nDon't do X. Don't modify Y.\n\n[4. EXAMPLES]\nReuse the pattern in [similar existing file].",
      totalCharCounterTemplate: "{current} / {max} chars",
      attemptCounterTemplate: "Try {current} / {max}",
      submitCta: "Send to Spark",
      submitting: "Reading…",
      retryCta: "Retry",
      finalCta: "Continue →",
      awaitingPrompt: "Pick a scenario and write the rich prompt. Then I'll comment.",
      outOfAttempts: "It's fine. You gave today your best. What you learned sticks.",
      networkError: "I'm offline. Not your fault. Try again when you're back.",
      apiError: "Something went wrong. Try again in a bit.",
      rateLimitError: "Too many tries too fast. Give me a moment.",
      invalidInputError: "I can't grade that text. Rewrite it as a real prompt, with the 4 levels of context.",
      dailyQuotaExhausted: "You've used all the evaluations I can give you today. Come back tomorrow — your prompt stays with you.",
      editorTabLabel: "Editor",
      sparkTabLabel: "Spark",
      layerLabels: {
        project: "project",
        code: "code",
        constraints: "constraints",
        examples: "examples",
      },
    },
    chat: {
      launcherLabel: "Ask Spark",
      modalTitle: "Spark",
      modalSubtitleTemplate: "{remaining} of {limit} messages left in this lesson",
      closeLabel: "Close chat",
      placeholder: "Write to Spark…",
      sendCta: "Send",
      sending: "Thinking…",
      emptyHero: "Ask away!",
      emptyHint: "Ask me anything about the lesson, vibe coding, or whatever's blocking you.",
      quotaExhausted: "You've used all your messages for this lesson. Try again in the next one.",
      dailyQuotaExhausted: "We've talked enough for today. Come back tomorrow.",
      networkError: "No connection. Retry.",
      apiError: "I can't reply right now. Try again in a moment.",
      unauthorized: "You need to be logged in to chat with me.",
      hintExamples: [
        "What does «a specific prompt» actually mean?",
        "Why did you say you're not smart?",
        "Where do you come from? Tell me about yourself.",
      ],
    },
    glossary: {
      popoverEyebrow: "Spark explains",
      deeperCta: "Want me to dig deeper?",
      closeLabel: "Close explanation",
      bottomSheetGrabberLabel: "Drag to close",
      prefillTemplate:
        "Can you explain {term} a bit more? I'm not 100% sure I get it.",
    },
    mindset01: {
      projectRecall: {
        intro: "Now let's talk about you.",
        recall: (project) =>
          `You told me you want to build "${project}". We'll use that as our example.`,
        exploring:
          "You're exploring, that's fine. We'll use Lucia's FrigoMagico as our example — you'll see it shortly.",
      },
    },
    mindset02: {
      step5: {
        beginner: [
          "Listen. An [[term:ide]]IDE[[/term]] is the place you write code. Nothing new — it's been around since the 1960s.",
          "An AI IDE is the same thing, but with an AI living inside that sees everything you do. It sees files, errors, context. When you ask for something, it doesn't start from zero.",
          "Three names you'll keep hearing in 2026: Cursor, Windsurf, Claude Code. The most used ones.",
        ],
        triedFailed: [
          "An [[term:ide]]AI IDE[[/term]] is the place where you write, and the AI sees everything: files, errors, context. No more copy-paste between tabs.",
          "You've already tried something, so you know what it's like when the AI forgets the previous file. That's exactly what an AI IDE fixes.",
          "Three 2026 names: Cursor, Windsurf, Claude Code. Blood cousins.",
        ],
        workingOnIt: [
          "You know what an [[term:ide]]IDE[[/term]] is already. What changes with AI inside is that it doesn't talk in the dark — it sees the whole project context.",
          "No more copy-paste. It's the only real difference, and it's huge.",
        ],
        advanced: [
          "I'll skip the definitions — you know what an [[term:ide]]AI IDE[[/term]] is and why it sees the context.",
          "Let's go straight to the part most of your peers don't actually know: how you configure it.",
        ],
      },
      step8: {
        default: [
          "Now I'll tell you something few people know that changes everything.",
          "Doesn't matter which AI IDE you use. They all have the same problem: the AI forgets who you are between conversations.",
          "There's a trick to fix it. It's a file. Called [[term:claude-md]]CLAUDE.md[[/term]], AGENTS.md, or cursor rules — depends on the tool. But the principle is the same.",
        ],
        withTool: (toolName, configFile) => [
          "Now I'll tell you something few people know that changes everything.",
          `${toolName} has the same problem as every other AI IDE: it forgets who you are between conversations.`,
          `There's a trick to fix it. In ${toolName} it's called \`${configFile}\`. In other tools it has different names — [[term:claude-md]]CLAUDE.md[[/term]], AGENTS.md, windsurfrules. But the principle is the same.`,
        ],
      },
    },
    mindset03: {
      step11: {
        exploring: [
          "Let me show you with a typical project.",
          "Imagine asking the AI «add a login [[term:funzione]]function[[/term]]».",
          "Version WITHOUT context: «add a login function». The AI improvises wildly — maybe gives you OAuth Google when you wanted plain email/password.",
          "Version WITH context: «We're building a simple web app. Add email/password login. Reuse the style of the other forms in /components/forms. No OAuth for now.» The AI does exactly what you wanted.",
        ],
        withProject: (project) => [
          "Let me show you with YOUR project.",
          `You told me you want to build "${project}". Good. Imagine asking the AI «add a login [[term:funzione]]function[[/term]]».`,
          "Version WITHOUT context: «add a login function». The AI invents wildly — maybe gives you OAuth Google when you wanted plain email/password.",
          `Version WITH context: «We're building ${project}. Add email/password login. Reuse the style of the other forms in /components/forms. No OAuth for now.» The AI does exactly what you wanted.`,
        ],
      },
      step12: {
        default: [
          "Now it's your turn.",
          "I'll give you a thin prompt. You have to transform it by adding the 4 levels of context.",
          "You don't need to be perfect. You need to be RICH. Let's go.",
        ],
        withTool: (toolName) => [
          "Now it's your turn.",
          "I'll give you a thin prompt. You have to transform it by adding the 4 levels of context.",
          "You don't need to be perfect. You need to be RICH. Let's go.",
          `PS: in ${toolName} you can pass part of the context with file tags (@filename, drag-and-drop, whatever the tool supports). Trick of the trade — bonus tip.`,
        ],
      },
    },
  },
};

export function getLessonsCopy(lang: Lang): LessonsCopy {
  return lang === "it" ? it : en;
}
