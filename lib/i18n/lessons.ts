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
  };
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
    exerciseHeading: "Esercizio",
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
  },
  pathDisplay: {
    mindset: {
      title: "Mindset",
      tagline: "Pensa come un vibe coder prima di scrivere un prompt.",
    },
    prompt: {
      title: "Prompt",
      tagline: "Un prompt è una specifica. Imparala e l'AI ti seguirà.",
    },
    build: {
      title: "Build",
      tagline: "Costruisci progetti reali, un prompt alla volta.",
    },
    debug: {
      title: "Debug",
      tagline: "L'AI rompe le cose. Tu impari a sistemarle a parole.",
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
    fallbackTitle: "Cos'è il vibe coding?",
    cta: "Riprendi →",
    startCta: "Inizia la prima lezione →",
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
    exerciseHeading: "Exercise",
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
  },
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
};

export function getLessonsCopy(lang: Lang): LessonsCopy {
  return lang === "it" ? it : en;
}
