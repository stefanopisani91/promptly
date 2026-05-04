import type { Lang, PathSlug } from "@/types";

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
    chat: {
      launcherLabel: string;
      modalTitle: string;
      // "{remaining} / {limit} messaggi rimasti"
      modalSubtitleTemplate: string;
      closeLabel: string;
      placeholder: string;
      sendCta: string;
      sending: string;
      emptyHint: string;
      quotaExhausted: string;
      networkError: string;
      apiError: string;
      unauthorized: string;
      hintExamples: string[];
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
    title: "Lezione completata! 🎉",
    xpEarned: (xp) => `+${xp} XP ⚡`,
    nextLessonCta: "Prossima lezione →",
    backToPathCta: "Torna al percorso",
    pathCompletedTitle: "🏁 Percorso completato!",
    pathCompletedSub: "Hai sbloccato il percorso successivo.",
  },
  toast: {
    xpLabel: (xp) => `+${xp} XP ⚡`,
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
      networkError: "Connessione assente. Riprova quando hai rete.",
      apiError: "Spark non risponde adesso. Andiamo avanti.",
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
      networkError: "Connessione assente. Riprova.",
      rateLimitError: "Troppi tentativi ravvicinati. Aspetta un momento.",
      apiError: "Qualcosa è andato storto. Riprova tra poco.",
      awaitingPrompt: "Aspetto il tuo prompt. Guarda il sito e dimmi cosa non torna.",
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
    chat: {
      launcherLabel: "Chiedi a Spark",
      modalTitle: "Spark",
      modalSubtitleTemplate: "{remaining} di {limit} messaggi rimasti in questa lezione",
      closeLabel: "Chiudi chat",
      placeholder: "Scrivi a Spark…",
      sendCta: "Invia",
      sending: "Sto pensando…",
      emptyHint: "Chiedimi qualcosa sulla lezione, sul vibe coding, su quello che ti blocca. Risposte brevi, in personaggio.",
      quotaExhausted: "Hai usato tutti i messaggi per questa lezione. Riprovi nella prossima.",
      networkError: "Connessione assente. Riprova.",
      apiError: "Non riesco a risponderti adesso. Riprova tra un momento.",
      unauthorized: "Devi essere loggato per chattare con me.",
      hintExamples: [
        "Cosa significa «fare un prompt specifico»?",
        "Perché hai detto che non sei intelligente?",
        "Da dove vengo io? Dimmi qualcosa di te.",
      ],
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
    title: "Lesson complete! 🎉",
    xpEarned: (xp) => `+${xp} XP ⚡`,
    nextLessonCta: "Next lesson →",
    backToPathCta: "Back to path",
    pathCompletedTitle: "🏁 Path completed!",
    pathCompletedSub: "You unlocked the next path.",
  },
  toast: {
    xpLabel: (xp) => `+${xp} XP ⚡`,
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
      networkError: "No connection. Retry when you're back online.",
      apiError: "Spark isn't replying right now. Let's keep moving.",
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
      networkError: "No connection. Retry.",
      rateLimitError: "Too many tries too fast. Hold on a moment.",
      apiError: "Something went wrong. Try again in a bit.",
      awaitingPrompt: "Waiting on your prompt. Look at the site and tell me what's off.",
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
    chat: {
      launcherLabel: "Ask Spark",
      modalTitle: "Spark",
      modalSubtitleTemplate: "{remaining} of {limit} messages left in this lesson",
      closeLabel: "Close chat",
      placeholder: "Write to Spark…",
      sendCta: "Send",
      sending: "Thinking…",
      emptyHint: "Ask me about the lesson, vibe coding, or whatever's blocking you. Short answers, in character.",
      quotaExhausted: "You've used all your messages for this lesson. Try again in the next one.",
      networkError: "No connection. Retry.",
      apiError: "I can't reply right now. Try again in a moment.",
      unauthorized: "You need to be logged in to chat with me.",
      hintExamples: [
        "What does «a specific prompt» actually mean?",
        "Why did you say you're not smart?",
        "Where do you come from? Tell me about yourself.",
      ],
    },
  },
};

export function getLessonsCopy(lang: Lang): LessonsCopy {
  return lang === "it" ? it : en;
}
