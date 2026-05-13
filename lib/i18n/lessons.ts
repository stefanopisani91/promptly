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
        vagueRetry: string;
        photoOnly: string;
        photoOnlyRetry: string;
        twoBugs: string;
        twoBugsRetry: string;
        allBugsLowScore: string;
        allBugsLowScoreRetry: string;
        allBugsHighScore: string;
        finalEncouragePartial: string;
        finalEncourageFull: string;
        secondAttemptHintPhoto: string;
        secondAttemptHintImproved: string;
        thirdAttemptDirect: string;
      };
      // Localised labels for the 4 dimension bars shown under Spark's
      // line in Lesson 1's Lucia widget. Same keys as LuciaEvaluation.
      dimensionLabels: {
        chiarezza: string;
        contesto: string;
        obiettivo: string;
        protezione: string;
      };
    };
    // Lesson 2 — CLAUDE.md editor widget.
    claudemdEditor: {
      intro: string;
      // Shown under the disabled submit button so the user knows why it's
      // locked: no project picked, or total user content below {min} /
      // above {max} ({current} = the live total).
      pickProjectHint: string;
      minLengthHint: string;
      maxLengthHint: string;
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
      // Shown under the disabled submit button so the user knows why it's
      // locked: no scenario picked, or the rewritten prompt is below {min}
      // / above {max} ({current} = the live length).
      pickScenarioHint: string;
      minLengthHint: string;
      maxLengthHint: string;
      // Briefing card (pre-scenario) — chrome strings. The actual project
      // setting + existing-assets bullets live in the lesson JSON
      // (content/<lang>/mindset/03-context-matters.v3.json) and are
      // resolved per scenario at render time.
      briefingTitle: string;
      briefingExistingHeader: string;
      briefingTaskTemplate: string; // "Ora ti chiedo di scrivere il prompt RICCO per «{task}»."
      // When the learner has a real project_description in their profile,
      // we prepend a "Il tuo progetto è X. Per esercitarti oggi usiamo:"
      // line above the briefing so the briefing reads as a stepping
      // stone, not a competing world. {project} = compressed user
      // project. When the user is exploring (no project), the briefing
      // shows without this prefix.
      briefingProjectPrefixTemplate: string;
      briefingCollapseLabel: string;
      briefingExpandLabel: string;
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
    // Lesson 4 — Constraints editor widget (3 textareas above the
    // database disaster mockup). Same animation effects as the previous
    // editors, different rubric (3 kinds × 33 + system bonus).
    constraintsEditor: {
      intro: string;
      // Eyebrow header above the 3-textarea grid.
      editorHeader: string;
      charCounterTemplate: string;
      // Shown under the disabled "Invia a Spark" button so the user knows
      // why it's locked. {min}/{max} = per-textarea bounds; {boxes} = the
      // comma-joined labels of the constraints that are still too short.
      minLengthHint: string;
      maxLengthHint: string;
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
      // Localised labels for the 3 dimension bars in Spark's panel —
      // map 1:1 to ConstraintsKind.
      kindLabels: {
        protective: string;
        process: string;
        style: string;
      };
      // Mockup chrome (the simulated DB UI) — IT/EN copy resolved here
      // so the component itself stays language-agnostic.
      mockup: {
        simulationBadge: string;
        windowTitle: string;
        sidebarLabel: string;
        activeTable: string;
        otherTables: string[];
        paneTitle: string;
        errorLabel: string;
        errorDescription: string;
        recordsAffected: string;
        recordsCount: string;
        lastBackup: string;
        lastBackupValue: string;
        preventedLabel: string;
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
    // Spark Helper — copy for "helper mode" of the chat panel (SparkChat),
    // which kicks in on a V3 quick-win step (lessons 2-6): the panel talks
    // to /api/spark-helper instead of the free chat, shows the widget's
    // quick-question chips, and never hands over the exercise's answer.
    // ⚠️ The KEYS of `suggestions` double as the client-side allowlist of
    // helper-enabled widgets — LessonV3View flips the chat into helper mode
    // (and boosts the Ask-Spark bubble) only for a step.widget that has
    // chips here. Keep them in sync with SPARK_HELPER_WIDGETS in
    // lib/lessons/v3/spark-helper-config.ts (the server-side allowlist +
    // the per-widget anti-leak context notes). Shape mirrors
    // SparkHelperStrings in components/lessons/v3/SparkChat.tsx.
    sparkHelper: {
      panelTitle: string; // chat title while in helper mode
      intro: string; // Spark's opening line in the empty state
      quotaQuickWinHit: string; // gentle "you've talked plenty" nudge
      quotaDailyHit: string; // "come back tomorrow"
      unavailable: string; // 503 — feature columns not provisioned yet
      // widgetKey -> up to 4 quick-question chips. Stable per widget —
      // must not change between clicks (a moving target confuses users).
      suggestions: Record<string, readonly string[]>;
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
    // Lesson 4 — applied-example step 12 swap based on project_description.
    // Same shape as mindset03.step11.
    mindset04: {
      step12: {
        exploring: string[];
        withProject: (project: string) => string[];
      };
    };
    // Lesson 5 — `hallucination-explainer` step 3 swap based on
    // experience_level. Beginner / tried_failed get the "lettere mal
    // messe" warm metaphor; working_on_it / advanced get the more
    // technical "modello probabilistico" frame.
    mindset05: {
      step3: {
        beginner: string[];
        triedFailed: string[];
        workingOnIt: string[];
        advanced: string[];
      };
    };
    // Lesson 5 — broken-session debugger widget. Dispatched from
    // LessonV3View when step.widget === "broken_session_debugger".
    brokenSessionDebugger: {
      // Labels around the mockup.
      simulationBadge: string;
      // Header on the recovery editor section.
      recoveryHeader: string;
      // Header above the pivot picker.
      pivotHeader: string;
      // CTA on the pivot picker that confirms the user's choice.
      pivotConfirmCta: string;
      // Spark line shown when the user hasn't picked a pivot yet.
      pivotAwaiting: string;
      // Inline feedback when the user picks the correct pivot.
      pivotCorrectInline: string;
      // Inline feedback when the user picks a wrong pivot the first time
      // (offers a single retry). Includes a {key}-shaped placeholder.
      pivotWrongInline: string;
      // Inline feedback when the user runs out of pivot retries — shows
      // the right answer.
      pivotRevealed: string;
      // Eyebrow / counter strings for the recovery editor.
      charCounterTemplate: string;
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
      // Localised labels for the 3 dimension bars in Spark's panel.
      dimensionLabels: {
        recognition: string;
        recalibration: string;
        future_control: string;
      };
    };
    // Lesson 6 — final-prompt-injection step (outro-path-completed).
    // The lesson JSON ships the paragraphs with a {deep_motivation}
    // placeholder; the personalisation layer replaces it with the
    // user's compressed motivation. We don't define a separate copy
    // shape here because the only swap is a one-line interpolation.
    mindset06: {
      // Fallback motivation line when the user has no
      // deep_motivation_compressed (legacy / skipped onboarding step).
      // Kept short so the surrounding paragraph still reads clean.
      motivationFallback: string;
    };
    // Lesson 6 — prompt architecture hero widget. Dispatched from
    // LessonV3View when step.widget === "prompt_architecture".
    promptArchitecture: {
      // Counter strings.
      attemptCounterTemplate: string;
      // Spark's awaiting line before any pillar is dropped.
      awaitingPrompt: string;
      // Contextual feedback after a WRONG attempt (0–1 / 4 correct).
      // Indexed by attempt: [0] after attempt 1, [1] after 2, etc.
      // Length is `max_attempts - 1` (4 for max_attempts=5) — the
      // last attempt triggers auto-reveal so it never reads from
      // this array.
      wrongFeedbacks: string[];
      // Contextual feedback after a PARTIAL attempt (2 / 4 correct).
      // Same indexing as wrongFeedbacks.
      partialFeedbacks: string[];
      // Inline feedback when the user runs out of attempts and we
      // auto-reveal the correct order.
      autoReveal: string;
      // Spark celebration line shown next to the generated prompt.
      // Includes a {tool} placeholder replaced with the user's
      // preferred_tool display name (or "il tuo tool" when null).
      celebrationTemplate: string;
      // Section labels for the generated prompt blocks.
      sectionLabels: {
        context: string;
        constraints: string;
        task: string;
        verification: string;
      };
      // Default body text for the TASK section — left intentionally
      // generic so the user fills it with the day's task.
      taskPlaceholder: string;
      // Skeleton fallbacks for the auto-generated CONTEXT / CONSTRAINTS
      // / VERIFICATION when the AI generation can't run (rate-limited,
      // network error, no project_description). Kept generic, the
      // real generation produces project-specific text.
      fallbackBlocks: {
        context: string;
        constraints: string;
        verification: string;
      };
      // CTAs.
      copyCta: string;
      copiedToast: string;
      downloadCta: string;
      finalCta: string;
      // Errors (mirrors the other widgets so the user sees consistent
      // messaging across lessons).
      networkError: string;
      apiError: string;
      rateLimitError: string;
      dailyQuotaExhausted: string;
      // Markdown header line at the top of the downloaded file.
      markdownHeader: string;
      // Markdown footer line at the bottom of the downloaded file.
      markdownFooter: string;
      // Filename prefix — the date and a slug derived from the user's
      // name/email get appended at runtime.
      filenamePrefix: string;
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
        vagueRetry: "Ehi, sei tornato. Il prompt però è ancora un po' troppo generico. Non ti scoraggiare — è normale al primo giro. Prova così: guarda il sito, scegli UN problema solo che vedi, e descrivimelo in due parole. Da lì costruiamo.",
        photoOnly: "Ok, qualcosa hai visto. Hai notato la foto rotta. L'ho sistemata — la vedi adesso? Ma c'è altro che non va. Continua a guardare con attenzione.",
        photoOnlyRetry: "Sei ancora sulla foto. È un buon punto di partenza, ma ci sono altri due problemi sul sito che ti stanno aspettando. Indizio gentile: dai un'occhiata al titolo della sezione progetto, e al bottone Download.",
        twoBugs: "Quasi. Hai trovato due dei tre problemi. Ho sistemato entrambi. Manca ancora un elemento. Ti do un indizio: c'è qualcosa che dovrebbe essere visibile e non lo è.",
        twoBugsRetry: "Sei tornato con gli stessi due. Bene per loro, sistemati di nuovo. Il terzo è ancora lì che ti aspetta — qualcosa che dovrebbe leggersi e non si legge. È sotto i tuoi occhi, te lo prometto.",
        allBugsLowScore: "Hai gli occhi giusti — hai visto tutti e 3 i problemi. Il prompt però è ancora un filo asciutto. Aggiungi una cosa qualunque che NON vuoi che venga toccata, tipo «mantieni il design» o «non aggiungere librerie». Anche solo una. Vedrai la differenza.",
        allBugsLowScoreRetry: "Bene, hai ancora i 3 bug — la tua vista non sbaglia. Per portare il prompt sopra la soglia ti basta UN dettaglio operativo in più: dimmi cosa NON deve fare l'AI. Anche un vincolo solo basta. Sei davvero a un passo.",
        allBugsHighScore: "Ecco. Questo è un prompt vero. Mi hai detto cosa vedi, cosa vuoi, e mi hai dato i dettagli per non sbagliare. Guarda — ho sistemato tutto. Hai appena diretto un'AI come una professionista.",
        finalEncouragePartial: "Va bene così. Hai imparato la cosa più importante: per farmi funzionare devi dirmi cosa fare. Tornerai qui in futuro e farai un prompt perfetto.",
        finalEncourageFull: "Hai fatto un lavoro vero. Te lo segno mentalmente — sei già più avanti di quello che pensi.",
        secondAttemptHintPhoto: "Meglio. Stavolta mi hai dato qualcosa di concreto. L'ho sistemato. Continua così — guarda gli altri elementi della pagina.",
        secondAttemptHintImproved: "Buon lavoro. Stai aggiungendo specificità. Ora il prompt è più completo. Manca ancora qualcosa.",
        thirdAttemptDirect: "Ultimo tentativo. Te lo dico chiaro: ci sono tre problemi sul sito di Lucia. Foto. Titolo. Bottone. Adesso che li sai tutti, scrivimi un prompt completo per sistemarli.",
      },
      dimensionLabels: {
        chiarezza: "chiarezza",
        contesto: "contesto",
        obiettivo: "obiettivo",
        protezione: "protezione",
      },
    },
    claudemdEditor: {
      intro: "Scegli uno dei tre progetti, poi scrivi il tuo CLAUDE.md. Lo leggo io e ti dico cosa funziona e cosa manca.",
      pickProjectHint: "Per inviare, scegli prima uno dei tre progetti qui sopra.",
      minLengthHint:
        "Per inviare servono almeno {min} caratteri di contenuto tuo tra le 4 sezioni (ora: {current}) — le intestazioni non contano.",
      maxLengthHint:
        "Hai superato i {max} caratteri — accorcia un po' e potrai inviare.",
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
      pickScenarioHint: "Per inviare, scegli prima uno dei tre scenari qui sopra.",
      minLengthHint:
        "Il prompt riscritto deve essere almeno {min} caratteri (ora: {current}) — aggiungi i 4 livelli di contesto.",
      maxLengthHint:
        "Hai superato i {max} caratteri — accorcia un po' e potrai inviare.",
      briefingTitle: "Briefing del progetto",
      briefingExistingHeader: "Cosa esiste già",
      briefingTaskTemplate:
        "Ora ti chiedo di scrivere il prompt RICCO per «{task}».",
      briefingProjectPrefixTemplate:
        "Il tuo progetto vero è «{project}». Per esercitarti, oggi usiamo questo scenario di esempio:",
      briefingCollapseLabel: "Nascondi briefing",
      briefingExpandLabel: "Mostra briefing",
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
    constraintsEditor: {
      intro: "Adesso ti tocca. Ecco il disastro: scrivi i 3 vincoli che l'avrebbero prevenuto.",
      editorHeader: "Scrivi i 3 vincoli che avrebbero prevenuto questo disastro",
      charCounterTemplate: "{current} / {max}",
      minLengthHint:
        "Per inviare servono almeno {min} caratteri in ogni vincolo — una frase intera, come negli esempi. Ancora un po' corti: {boxes}.",
      maxLengthHint:
        "Un vincolo supera i {max} caratteri — accorcialo un po' e potrai inviare.",
      attemptCounterTemplate: "Tentativo {current} / {max}",
      submitCta: "Invia a Spark",
      submitting: "Sto leggendo…",
      retryCta: "Riprova",
      finalCta: "Continua →",
      awaitingPrompt: "Scrivi i tre vincoli e poi te li commento.",
      outOfAttempts: "Va bene così. Hai dato il massimo per oggi. Quello che hai imparato resta.",
      networkError: "Sono offline. Non è colpa tua. Riprova quando hai rete.",
      apiError: "Qualcosa non ha funzionato. Riprova tra poco.",
      rateLimitError: "Troppi tentativi ravvicinati. Dammi un momento.",
      invalidInputError: "Quel testo non posso valutarlo. Riformulalo come tre vincoli concreti.",
      dailyQuotaExhausted: "Per oggi hai esaurito le valutazioni che posso farti. Torna domani — i tuoi vincoli te li tieni.",
      kindLabels: {
        protective: "protettivo",
        process: "processo",
        style: "stile",
      },
      mockup: {
        simulationBadge: "Simulazione — non è un disastro vero",
        windowTitle: "My Database — Studio",
        sidebarLabel: "Tabelle",
        activeTable: "users",
        otherTables: ["projects", "lessons"],
        paneTitle: "Tabella",
        errorLabel: "Schema modificato dall'AI",
        errorDescription:
          "L'AI ha droppato la colonna «email_verified» durante un refactoring del flusso di auth.",
        recordsAffected: "Record affected",
        recordsCount: "23 utenti",
        lastBackup: "Ultimo backup",
        lastBackupValue: "2 ore fa",
        preventedLabel: "Disastro evitato",
      },
    },
    brokenSessionDebugger: {
      simulationBadge: "Simulazione — sessione di vibe coding ricostruita",
      pivotHeader: "Dove l'utente avrebbe dovuto fermarsi?",
      pivotConfirmCta: "Conferma scelta",
      pivotAwaiting: "Leggi la sessione, poi dimmi dove l'utente avrebbe dovuto fermarsi.",
      pivotCorrectInline: "Esatto. Era il primo segnale. Adesso scrivi il messaggio di stop che l'avrebbe salvato.",
      pivotWrongInline: "Non era lì. Pensa al PRIMO momento in cui qualcosa ha sforato — quando avresti potuto ancora fermare il disastro.",
      pivotRevealed: "Te la dico io: il punto di svolta era subito dopo la prima risposta dell'AI. Andiamo alla seconda parte.",
      recoveryHeader: "Adesso scrivi il messaggio di stop e ricalibra",
      charCounterTemplate: "{current} / {max}",
      attemptCounterTemplate: "Tentativo {current} / {max}",
      submitCta: "Invia a Spark",
      submitting: "Sto leggendo…",
      retryCta: "Riprova",
      finalCta: "Continua →",
      awaitingPrompt: "Scrivi il tuo messaggio di stop. Devi: riconoscere lo sforamento, dire cosa volevi davvero, mettere un vincolo per il futuro.",
      outOfAttempts: "Va bene così. Hai dato il massimo per oggi. Quello che hai imparato resta.",
      networkError: "Sono offline. Non è colpa tua. Riprova quando hai rete.",
      apiError: "Qualcosa non ha funzionato. Riprova tra poco.",
      rateLimitError: "Troppi tentativi ravvicinati. Dammi un momento.",
      invalidInputError: "Quel testo non posso valutarlo. Riformulalo come messaggio vero da mandare all'AI.",
      dailyQuotaExhausted: "Per oggi hai esaurito le valutazioni che posso farti. Torna domani — il messaggio te lo tieni.",
      dimensionLabels: {
        recognition: "riconoscimento",
        recalibration: "ricalibrazione",
        future_control: "vincolo futuro",
      },
    },
    mindset06: {
      motivationFallback: "voglio imparare a costruire con l'AI",
    },
    promptArchitecture: {
      attemptCounterTemplate: "Tentativo {current} / {max}",
      awaitingPrompt: "Trascina i 4 pilastri nello spazio sopra. Ricorda l'ordine controintuitivo.",
      // 4 messaggi a indizio crescente. Indice 0 dopo il 1° tentativo,
      // 1 dopo il 2°, ecc. Il 5° tentativo, se sbagliato, scatena
      // l'auto-reveal e non legge da qui.
      wrongFeedbacks: [
        "Quasi tutto fuori posto. Ricomincia: di cosa ha bisogno l'AI prima di tutto?",
        "Riavvolgi: prima dici cosa stai costruendo, poi i limiti, poi cosa fare oggi, poi come si verifica.",
        "Indizio forte: i vincoli vengono prima del task. È controintuitivo, ma serve a non far inventare l'AI.",
        "Ultimo tentativo prima che te lo svelo io. CONTESTO → VINCOLI → TASK → VERIFICA, in quest'ordine.",
      ],
      partialFeedbacks: [
        "Due al posto giusto. Ora guarda i due in mezzo: chi viene prima?",
        "Ci sei vicino. I due al centro sono ancora invertiti.",
        "Sempre due giusti. Pensa: i vincoli prima del task, perché l'AI non deve inventare quello che non sa.",
        "Ultimo. La cura sta nei vincoli prima dell'azione — un'ultima volta.",
      ],
      autoReveal: "Va bene, te lo mostro io. L'ordine giusto è CONTESTO → VINCOLI → TASK → VERIFICA. Adesso te lo metto a posto da sola così lo memorizzi.",
      celebrationTemplate: "Eccolo. Il tuo prompt giornaliero. Domani mattina lo apri, lo incolli in {tool}, modifichi solo il TASK del giorno, e lavori. Hai costruito il tuo manuale operativo. È tuo. Funziona.",
      sectionLabels: {
        context: "CONTESTO",
        constraints: "VINCOLI",
        task: "TASK",
        verification: "VERIFICA",
      },
      taskPlaceholder: "[Sostituisci con il task del giorno: cosa vuoi che l'AI faccia oggi, in 1-2 frasi specifiche.]",
      fallbackBlocks: {
        context: "Sto costruendo [il mio progetto]. Stack: [da definire]. File principali in /src e /lib.",
        constraints: "NON modificare i file in /config senza chiedermi. NON aggiungere nuove dipendenze npm. Mostrami il diff prima di applicare modifiche al database.",
        verification: "Quando hai finito: runa i test esistenti, mostrami il diff, e confermami che le altre route continuano a funzionare.",
      },
      copyCta: "📋 Copia il prompt",
      copiedToast: "Copiato negli appunti",
      downloadCta: "⬇️ Scarica come .md",
      finalCta: "Continua →",
      networkError: "Sono offline. Non è colpa tua. Riprova tra poco.",
      apiError: "Qualcosa non ha funzionato. Riprova tra un attimo.",
      rateLimitError: "Troppe richieste vicine. Dammi un momento.",
      dailyQuotaExhausted: "Per oggi hai esaurito le generazioni AI che posso farti. Torna domani.",
      markdownHeader: "# Il mio prompt giornaliero — Promptly Path 1",
      markdownFooter: "Generato con Promptly — learnpromptly.app · Workflow: CONTESTO → VINCOLI → TASK → VERIFICA",
      filenamePrefix: "prompt-giornaliero",
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
    sparkHelper: {
      panelTitle: "Spark, aiutami",
      intro:
        "Eccomi. Cosa ti serve? Posso spiegarti un termine, darti un esempio diverso, o aiutarti a guardare l'esercizio da un'altra angolazione. Non ti do la risposta — ma ti sblocco.",
      quotaQuickWinHit:
        "Ne abbiamo già parlato parecchio. Prova a buttarti — ce la fai.",
      quotaDailyHit: "Per oggi basta domande a me. Torna domani.",
      unavailable: "Questo aiuto non è ancora disponibile. Riprova più tardi.",
      suggestions: {
        lucia_prompt_loop: [
          "Cos'è il prompt loop?",
          "Come parlo all'AI per fixare un bug?",
          "Dammi un esempio di prompt",
          "Cos'è una console del browser?",
        ],
        claudemd_editor: [
          "Cos'è uno stack?",
          "Cosa metto nelle «house rules»?",
          "Esempio per un'app come la mia",
          "Quali sono i miei strumenti?",
        ],
        context_prompt_editor: [
          "Cosa significa «contesto codice»?",
          "Come faccio a essere specifico?",
          "Esempio per il mio progetto",
          "Cos'è un pattern?",
        ],
        constraints_editor: [
          "Cos'è uno schema di database?",
          "Differenza tra protettivo e di processo?",
          "Esempio nel mio caso",
          "Come dico «non fare X»?",
        ],
        broken_session_debugger: [
          "Cos'è OAuth?",
          "Cos'è un middleware?",
          "Come faccio rollback con l'AI?",
          "Dammi un esempio di risposta",
        ],
        prompt_architecture: [
          "Perché i vincoli prima del task?",
          "Cosa metto nella verifica?",
          "Esempio adattato al mio progetto",
          "Come uso questo prompt domani?",
        ],
      },
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
    mindset04: {
      step12: {
        exploring: [
          "Ti faccio un esempio con un progetto-tipo.",
          "PROTETTIVO: «NON modificare i file in /config senza dirmelo prima».",
          "PROCESSO: «Mostrami il diff prima di applicare le modifiche».",
          "STILE: «Mantieni il pattern già esistente. Non inventare nuovi pattern».",
          "Tre vincoli, 30 secondi a scriverli. Ti risparmiano disastri di domani.",
        ],
        withProject: (project) => [
          "Ti faccio un esempio col TUO progetto.",
          `Ricordi che vuoi costruire "${project}"? Ecco 3 vincoli che potresti già usare oggi:`,
          "PROTETTIVO: «NON modificare lo schema del database senza dirmelo prima».",
          "PROCESSO: «Mostrami il diff dei file modificati prima di applicare le modifiche».",
          "STILE: «Mantieni il pattern delle altre componenti che ho già fatto. Non inventare nuovi pattern».",
          "Tre vincoli, 30 secondi a scriverli, e ti risparmiano 10 ore di disastri.",
        ],
      },
    },
    mindset05: {
      step3: {
        beginner: [
          "Quando non so davvero una cosa, me la invento. Non lo faccio per dispetto, lo faccio perché sono fatta così.",
          "Pensa a quando scrivi una frase: scegli ogni parola in base a quella che hai messo prima. Io faccio lo stesso, ma su tutta la conoscenza del mondo.",
          "Se la prima parola che scelgo è sbagliata, le successive si sbagliano per coerenza. È così che nascono le [[term:allucinazione]]allucinazioni[[/term]].",
        ],
        triedFailed: [
          "Quando non so davvero una cosa, me la invento. Non per dispetto — è il modo in cui funziono.",
          "Hai presente quando scrivi una frase e scegli la parola successiva in base a quella di prima? Io faccio lo stesso, ma su tutta la conoscenza del mondo.",
          "Se la prima parola che scelgo è già un po' storta — perché il tuo prompt era ambiguo o perché ho un dubbio — le successive si sbagliano per coerenza. È così che nascono le [[term:allucinazione]]allucinazioni[[/term]].",
        ],
        workingOnIt: [
          "Te lo spiego più tecnico: sono un modello probabilistico. Non ho un database di verità — predico la parola successiva su tutto quello che ho letto.",
          "Quando inizio a «mettere le lettere male» — perché il tuo prompt era ambiguo o perché ho un piccolo dubbio — poi continuo a inventare per coerenza con le lettere sbagliate. Non posso fare altrimenti.",
          "Le [[term:allucinazione]]allucinazioni[[/term]] non sono bug. Sono la natura del sistema.",
        ],
        advanced: [
          "Sono un modello probabilistico. Non ho un database di verità — predico la parola successiva sulla distribuzione che ho appreso.",
          "Quando il prompt è ambiguo, il prossimo [[term:token]]token[[/term]] più probabile finisce fuori distribuzione, e io vado avanti per coerenza locale. È esattamente così che nascono nomi di librerie verosimili e inesistenti.",
          "Le [[term:allucinazione]]allucinazioni[[/term]] non sono bug. Sono il sistema che fa il suo lavoro su input sotto-specificati.",
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
        vagueRetry: "Hey, you're back. The prompt is still a bit too generic, though. Don't get discouraged — it's normal on the first run. Try this: look at the site, pick ONE problem you see, and describe it in two words. We build from there.",
        photoOnly: "Okay, you spotted something. You noticed the broken photo. I fixed it — see it now? But there's more. Keep looking carefully.",
        photoOnlyRetry: "Still on the photo. It's a good starting point, but there are two more problems on the site waiting for you. Gentle hint: take a look at the project section title, and at the Download button.",
        twoBugs: "Almost. You found two of the three problems. Fixed both. Still one element missing. Hint: there's something that should be visible but isn't.",
        twoBugsRetry: "Back with the same two. Good for them, fixed again. The third one is still there waiting — something that should be readable and isn't. It's right under your eyes, I promise.",
        allBugsLowScore: "You've got the eyes — you spotted all 3 problems. The prompt is still a touch dry though. Add anything you DON'T want touched, like «keep the design» or «don't add libraries». Even one. You'll feel the difference.",
        allBugsLowScoreRetry: "Good, you still have all 3 bugs — your eye is sharp. To push the prompt over the line you just need ONE more operational detail: tell me what the AI must NOT do. A single constraint is enough. You're really one step away.",
        allBugsHighScore: "There it is. That's a real prompt. You told me what you see, what you want, and gave me the details to get it right. Look — everything's fixed. You just directed an AI like a pro.",
        finalEncouragePartial: "It's fine. You learned the most important thing: to make me work, you have to tell me what to do. You'll come back to this and write a perfect prompt.",
        finalEncourageFull: "You did real work. I'm noting it — you're further along than you think.",
        secondAttemptHintPhoto: "Better. This time you gave me something concrete. Fixed. Keep going — look at the other elements on the page.",
        secondAttemptHintImproved: "Good. You're adding specificity. The prompt is more complete now. Still missing one thing.",
        thirdAttemptDirect: "Last try. I'll be straight: there are three problems on Lucia's site. Photo. Title. Button. Now that you know all three, write me a complete prompt to fix them.",
      },
      dimensionLabels: {
        chiarezza: "clarity",
        contesto: "context",
        obiettivo: "goal",
        protezione: "guardrails",
      },
    },
    claudemdEditor: {
      intro: "Pick one of the three projects, then write your CLAUDE.md. I'll read it and tell you what works and what's missing.",
      pickProjectHint: "To send, pick one of the three projects above first.",
      minLengthHint:
        "To send, you need at least {min} characters of your own content across the 4 sections (now: {current}) — headings don't count.",
      maxLengthHint:
        "You're over {max} characters — trim it a bit and you'll be able to send.",
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
      pickScenarioHint: "To send, pick one of the three scenarios above first.",
      minLengthHint:
        "The rewritten prompt needs at least {min} characters (now: {current}) — add the 4 levels of context.",
      maxLengthHint:
        "You're over {max} characters — trim it a bit and you'll be able to send.",
      briefingTitle: "Project briefing",
      briefingExistingHeader: "What already exists",
      briefingTaskTemplate:
        "Now I'm asking you to write the RICH prompt for «{task}».",
      briefingProjectPrefixTemplate:
        "Your real project is \"{project}\". To practice, today we'll use this sample scenario:",
      briefingCollapseLabel: "Hide briefing",
      briefingExpandLabel: "Show briefing",
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
    constraintsEditor: {
      intro: "Now it's your turn. Here's the disaster: write the 3 constraints that would have prevented it.",
      editorHeader: "Write the 3 constraints that would have prevented this disaster",
      charCounterTemplate: "{current} / {max}",
      minLengthHint:
        "To send, each constraint needs at least {min} characters — a full sentence, like the placeholders. Still a bit short: {boxes}.",
      maxLengthHint:
        "A constraint is over {max} characters — trim it a bit and you'll be able to send.",
      attemptCounterTemplate: "Try {current} / {max}",
      submitCta: "Send to Spark",
      submitting: "Reading…",
      retryCta: "Retry",
      finalCta: "Continue →",
      awaitingPrompt: "Write the three constraints and I'll comment on them.",
      outOfAttempts: "It's fine. You gave today your best. What you learned sticks.",
      networkError: "I'm offline. Not your fault. Try again when you're back.",
      apiError: "Something went wrong. Try again in a bit.",
      rateLimitError: "Too many tries too fast. Give me a moment.",
      invalidInputError: "I can't grade that text. Rewrite it as three concrete constraints.",
      dailyQuotaExhausted: "You've used all the evaluations I can give you today. Come back tomorrow — your constraints stay with you.",
      kindLabels: {
        protective: "protective",
        process: "process",
        style: "style",
      },
      mockup: {
        simulationBadge: "Simulation — not a real disaster",
        windowTitle: "My Database — Studio",
        sidebarLabel: "Tables",
        activeTable: "users",
        otherTables: ["projects", "lessons"],
        paneTitle: "Table",
        errorLabel: "Schema modified by AI",
        errorDescription:
          "The AI dropped the «email_verified» column while refactoring the auth flow.",
        recordsAffected: "Records affected",
        recordsCount: "23 users",
        lastBackup: "Last backup",
        lastBackupValue: "2 hours ago",
        preventedLabel: "Disaster prevented",
      },
    },
    brokenSessionDebugger: {
      simulationBadge: "Simulation — reconstructed vibe-coding session",
      pivotHeader: "Where should the user have stopped?",
      pivotConfirmCta: "Confirm",
      pivotAwaiting: "Read the session, then tell me where the user should have stopped.",
      pivotCorrectInline: "Right. That was the first sign. Now write the stop-and-recalibrate message that would have saved it.",
      pivotWrongInline: "Not there. Think about the FIRST moment something went off — when you could still have stopped the disaster.",
      pivotRevealed: "Let me tell you: the pivot was right after the AI's first reply. Let's go to part 2.",
      recoveryHeader: "Now write the stop-and-recalibrate message",
      charCounterTemplate: "{current} / {max}",
      attemptCounterTemplate: "Try {current} / {max}",
      submitCta: "Send to Spark",
      submitting: "Reading…",
      retryCta: "Retry",
      finalCta: "Continue →",
      awaitingPrompt: "Write your stop message. You need to: name the overreach, say what you really wanted, and add a constraint for the future.",
      outOfAttempts: "It's fine. You gave today your best. What you learned sticks.",
      networkError: "I'm offline. Not your fault. Try again when you're back.",
      apiError: "Something went wrong. Try again in a bit.",
      rateLimitError: "Too many tries too fast. Give me a moment.",
      invalidInputError: "I can't grade that text. Rewrite it as a real message you'd send to the AI.",
      dailyQuotaExhausted: "You've used all the evaluations I can give you today. Come back tomorrow — your message stays with you.",
      dimensionLabels: {
        recognition: "recognition",
        recalibration: "recalibration",
        future_control: "future control",
      },
    },
    mindset06: {
      motivationFallback: "I want to learn to build with AI",
    },
    promptArchitecture: {
      attemptCounterTemplate: "Try {current} / {max}",
      awaitingPrompt: "Drag the 4 pillars into the space above. Remember the counter-intuitive order.",
      // 4 escalating hints. Index 0 after attempt 1, 1 after 2, etc.
      // The 5th wrong attempt triggers auto-reveal and never reads
      // from this array.
      wrongFeedbacks: [
        "Almost all out of place. Start over: what does the AI need first?",
        "Rewind: first you say what you're building, then the limits, then what to do today, then how you verify.",
        "Strong hint: constraints come before the task. Counter-intuitive — it stops the AI from making things up.",
        "Last try before I show you. CONTEXT → CONSTRAINTS → TASK → VERIFICATION, in that order.",
      ],
      partialFeedbacks: [
        "Two in the right spot. Look at the two in the middle: which one comes first?",
        "Close. The two in the middle are still swapped.",
        "Still two correct. Think: constraints before the task, so the AI can't make up what it doesn't know.",
        "Last try. The care lives in the constraints before the action — one more time.",
      ],
      autoReveal: "All right, let me show you. The right order is CONTEXT → CONSTRAINTS → TASK → VERIFICATION. I'll arrange it now so it sticks.",
      celebrationTemplate: "There. Your daily prompt. Tomorrow morning you open it, paste it into {tool}, edit only the TASK of the day, and work. You built your own operating manual. It's yours. It works.",
      sectionLabels: {
        context: "CONTEXT",
        constraints: "CONSTRAINTS",
        task: "TASK",
        verification: "VERIFICATION",
      },
      taskPlaceholder: "[Replace with today's task: what do you want the AI to do today, in 1-2 specific sentences.]",
      fallbackBlocks: {
        context: "I'm building [my project]. Stack: [TBD]. Main files in /src and /lib.",
        constraints: "DO NOT modify files in /config without asking me. DO NOT add new npm dependencies. Show me the diff before applying database changes.",
        verification: "When you're done: run the existing tests, show me the diff, and confirm the other routes still work.",
      },
      copyCta: "📋 Copy the prompt",
      copiedToast: "Copied to clipboard",
      downloadCta: "⬇️ Download as .md",
      finalCta: "Continue →",
      networkError: "I'm offline. Not your fault. Try again in a bit.",
      apiError: "Something went wrong. Try again in a moment.",
      rateLimitError: "Too many requests. Give me a moment.",
      dailyQuotaExhausted: "You've used all the AI generations I can give you today. Come back tomorrow.",
      markdownHeader: "# My daily prompt — Promptly Path 1",
      markdownFooter: "Generated with Promptly — learnpromptly.app · Workflow: CONTEXT → CONSTRAINTS → TASK → VERIFICATION",
      filenamePrefix: "daily-prompt",
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
    sparkHelper: {
      panelTitle: "Spark, help me",
      intro:
        "Here I am. What do you need? I can explain a term, give you a different example, or help you look at the exercise from another angle. I won't give you the answer — but I'll unblock you.",
      quotaQuickWinHit:
        "We've talked plenty already. Give it a shot — you've got this.",
      quotaDailyHit: "Enough questions for me today. Come back tomorrow.",
      unavailable: "This help isn't available yet. Try again later.",
      suggestions: {
        lucia_prompt_loop: [
          "What is the prompt loop?",
          "How do I talk to the AI to fix a bug?",
          "Show me an example prompt",
          "What is the browser console?",
        ],
        claudemd_editor: [
          "What's a stack?",
          "What goes in the house rules?",
          "Example for an app like mine",
          "What are my tools?",
        ],
        context_prompt_editor: [
          "What does code context mean?",
          "How do I get specific?",
          "Example for my project",
          "What's a pattern?",
        ],
        constraints_editor: [
          "What's a database schema?",
          "Protective vs. process — what's the difference?",
          "Example in my case",
          "How do I say \"don't do X\"?",
        ],
        broken_session_debugger: [
          "What's OAuth?",
          "What's a middleware?",
          "How do I roll back with the AI?",
          "Show me an example response",
        ],
        prompt_architecture: [
          "Why constraints before the task?",
          "What goes in the verify block?",
          "Example fitted to my project",
          "How do I use this prompt tomorrow?",
        ],
      },
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
    mindset04: {
      step12: {
        exploring: [
          "Let me show you with a typical project.",
          "PROTECTIVE: «DO NOT modify the files in /config without asking me first».",
          "PROCESS: «Show me the diff before applying changes».",
          "STYLE: «Keep the existing pattern. Don't invent new patterns».",
          "Three constraints, 30 seconds to write them. They save you tomorrow's disasters.",
        ],
        withProject: (project) => [
          "Let me show you with YOUR project.",
          `You wanted to build "${project}", right? Here are 3 constraints you could use today:`,
          "PROTECTIVE: «DO NOT modify the database schema without asking me first».",
          "PROCESS: «Show me the diff of the modified files before applying changes».",
          "STYLE: «Keep the pattern of the other components I've already built. Don't invent new patterns».",
          "Three constraints, 30 seconds to write them, and they save you 10 hours of disasters.",
        ],
      },
    },
    mindset05: {
      step3: {
        beginner: [
          "When I don't really know something, I make it up. Not out of spite — that's how I'm built.",
          "Think about how you write a sentence: you pick each word based on the one before. I do the same, but across all the world's knowledge.",
          "If the first word I pick is wrong, the next ones go wrong to stay coherent with it. That's how [[term:allucinazione]]hallucinations[[/term]] are born.",
        ],
        triedFailed: [
          "When I don't really know something, I make it up. Not out of spite — it's how I work.",
          "You know how you write a sentence by picking the next word based on the previous one? I do the same, but on all the world's knowledge.",
          "If the first word I pick is already a bit off — because your prompt was ambiguous, or because I had a doubt — the rest goes wrong to stay coherent. That's how [[term:allucinazione]]hallucinations[[/term]] are born.",
        ],
        workingOnIt: [
          "Let me explain it more technically: I'm a probabilistic model. I don't have a database of truth — I predict the next word over everything I've read.",
          "When I start «putting the letters wrong» — because your prompt was ambiguous or I had a small doubt — I keep inventing to stay coherent with the wrong letters. I can't do otherwise.",
          "[[term:allucinazione]]Hallucinations[[/term]] aren't bugs. They're the nature of the system.",
        ],
        advanced: [
          "I'm a probabilistic model. I don't have a database of truth — I predict the next word over the distribution I learned.",
          "When the prompt is ambiguous, the most-likely next [[term:token]]token[[/term]] drifts out of distribution, and I keep going on local coherence. That's exactly how plausible-but-nonexistent library names get born.",
          "[[term:allucinazione]]Hallucinations[[/term]] aren't bugs. They're the system doing its job on under-specified inputs.",
        ],
      },
    },
  },
};

export function getLessonsCopy(lang: Lang): LessonsCopy {
  return lang === "it" ? it : en;
}
