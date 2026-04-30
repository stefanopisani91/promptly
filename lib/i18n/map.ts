// UI strings for the Learning Map (Dashboard V2 — Phase 4).
// Bioma path titles/descriptions live here so the map can render them
// without re-importing every per-feature copy file.

import type { Lang, PathSlug } from "@/types";

export interface MapCopy {
  start: {
    label: string; // "★ START"
    hint: string; // "Inizia da qui"
  };
  paths: Record<
    PathSlug,
    {
      title: string;
      // Short evocative subtitle shown under the path name.
      tagline: string;
    }
  >;
  endgame: {
    eyebrow: string; // "ENDGAME"
    title: string; // "Prompt Library"
    teaser: string; // "Tutti i pattern del corso, in un'arsenale solo tuo."
  };
  legend: {
    completed: string;
    current: string;
    locked: string;
    pro: string;
    bonus: string;
  };
  modal: {
    closeAria: string;
    completedTitle: (lessonTitle: string) => string;
    completedXp: (xp: number) => string;
    completedReopenCta: string;
    completedReviewSub: string;
    proTitle: string;
    proSub: string;
    proCta: string;
    proPathTitle: (pathTitle: string) => string;
    proPathDesc: (pathTitle: string) => string;
    bonusEyebrow: string;
    bonusUnlockedSub: string;
    bonusUnlockedComingSoon: string;
    bonusLockedSub: string;
    bonusGoCta: string;
    bonusOkCta: string;
  };
  pathProgress: (completed: number, total: number) => string;
  pathPro: string; // "Pro path"
  pathLockedHint: (prereqTitle: string) => string;
  scrollHint: string; // "Scorri verso l'alto per scoprire i prossimi mondi"
}

const it: MapCopy = {
  start: {
    label: "★ START",
    hint: "Inizia da qui",
  },
  paths: {
    mindset: { title: "Mindset", tagline: "Il villaggio. Da dove tutto comincia." },
    prompt: { title: "Prompt", tagline: "La foresta. Dove le parole prendono forma." },
    build: { title: "Build", tagline: "La città. Dove costruisci sul serio." },
    debug: { title: "Debug", tagline: "L'officina. Dove rimetti le cose in moto." },
    ship: { title: "Ship", tagline: "Lo spazio. Dove arrivi al pubblico." },
  },
  endgame: {
    eyebrow: "ENDGAME",
    title: "Prompt Library",
    teaser: "L'arsenale finale. Sblocca completando tutti i 5 percorsi.",
  },
  legend: {
    completed: "Completata",
    current: "Adesso",
    locked: "Bloccata",
    pro: "Pro",
    bonus: "Bonus",
  },
  modal: {
    closeAria: "Chiudi",
    completedTitle: (lessonTitle) => `${lessonTitle} — Completata`,
    completedXp: (xp) => `+${xp.toLocaleString("it-IT")} XP guadagnati`,
    completedReopenCta: "Riapri lezione",
    completedReviewSub: "Vuoi rileggere o rifare l'esercizio? Nessun problema.",
    proTitle: "Sblocca Pro per continuare",
    proSub:
      "Path 3-5 ti portano dall'idea a un'app online — con feedback AI su ogni prompt.",
    proCta: "Scopri Pro",
    proPathTitle: (pathTitle) => `${pathTitle} — Pro`,
    proPathDesc: (pathTitle) =>
      `${pathTitle} è parte del piano Pro. Sblocca per accedere a tutte le lezioni e al feedback AI.`,
    bonusEyebrow: "BONUS PATH",
    bonusUnlockedSub: "Pronto per partire — clicca \"Vai\" per esplorarla.",
    bonusUnlockedComingSoon:
      "Sbloccata! Il contenuto sta arrivando — ti avvisiamo non appena è pronto.",
    bonusLockedSub: "Continua a guadagnare progressi per sbloccarla.",
    bonusGoCta: "Vai",
    bonusOkCta: "OK",
  },
  pathProgress: (completed, total) => `${completed}/${total} lezioni`,
  pathPro: "Pro",
  pathLockedHint: (prereqTitle) =>
    `Completa ${prereqTitle} per sbloccare questo percorso.`,
  scrollHint: "Scorri verso l'alto per scoprire i prossimi mondi",
};

const en: MapCopy = {
  start: {
    label: "★ START",
    hint: "Start here",
  },
  paths: {
    mindset: { title: "Mindset", tagline: "The village. Where everything starts." },
    prompt: { title: "Prompt", tagline: "The forest. Where words take shape." },
    build: { title: "Build", tagline: "The city. Where you build for real." },
    debug: { title: "Debug", tagline: "The workshop. Where you fix things." },
    ship: { title: "Ship", tagline: "Space. Where it reaches the world." },
  },
  endgame: {
    eyebrow: "ENDGAME",
    title: "Prompt Library",
    teaser: "The final arsenal. Unlocks once you complete all 5 paths.",
  },
  legend: {
    completed: "Done",
    current: "Now",
    locked: "Locked",
    pro: "Pro",
    bonus: "Bonus",
  },
  modal: {
    closeAria: "Close",
    completedTitle: (lessonTitle) => `${lessonTitle} — Done`,
    completedXp: (xp) => `+${xp.toLocaleString("en-US")} XP earned`,
    completedReopenCta: "Reopen lesson",
    completedReviewSub: "Want to reread or redo the exercise? Go ahead.",
    proTitle: "Unlock Pro to continue",
    proSub:
      "Path 3-5 take you from idea to a deployed app — with AI feedback on every prompt.",
    proCta: "Explore Pro",
    proPathTitle: (pathTitle) => `${pathTitle} — Pro`,
    proPathDesc: (pathTitle) =>
      `${pathTitle} is part of the Pro plan. Unlock to access every lesson and AI feedback.`,
    bonusEyebrow: "BONUS PATH",
    bonusUnlockedSub: "Ready when you are — click \"Go\" to start.",
    bonusUnlockedComingSoon:
      "Unlocked! Content is on the way — we'll let you know the moment it's ready.",
    bonusLockedSub: "Keep making progress to unlock it.",
    bonusGoCta: "Go",
    bonusOkCta: "OK",
  },
  pathProgress: (completed, total) => `${completed}/${total} lessons`,
  pathPro: "Pro",
  pathLockedHint: (prereqTitle) =>
    `Finish ${prereqTitle} to unlock this path.`,
  scrollHint: "Scroll up to discover the next worlds",
};

export function getMapCopy(lang: Lang): MapCopy {
  return lang === "it" ? it : en;
}
