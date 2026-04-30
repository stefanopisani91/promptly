// UI strings for the level system — robot title row, XP bar, level-up modal.
// Per PROMPTLY.md rule #1, no string in components should be inline.
// Per the project's i18n pattern, we expose `getLevelsCopy(lang)` rather than
// editing en.ts/it.ts (which don't exist in this project).

import type { Lang } from "@/types";

export interface LevelsCopy {
  badge: {
    // "[CIRCUIT] Vibe Coder" rendering — pieces left to the component so it
    // can layout robot icon + name + title.
    levelLabel: (level: number) => string;
  };
  xpBar: {
    // "1.850 / 2.500 XP"
    progress: (current: number, target: number) => string;
    // "Prossimo: NEXUS"
    nextLabel: (robotName: string) => string;
    maxLabel: string; // "⚡ OMEGA — Livello massimo raggiunto"
  };
  levelUp: {
    eyebrow: string; // "LEVEL UP"
    title: (titleForLevel: string) => string; // "You're now a Vibe Coder!"
    sub: (robotName: string) => string; // "Your robot has evolved into CIRCUIT"
    cta: string; // "Continua a imparare"
    closeAria: string;
  };
}

const it: LevelsCopy = {
  badge: {
    levelLabel: (level) => `Livello ${level}`,
  },
  xpBar: {
    progress: (current, target) =>
      `${current.toLocaleString("it-IT")} / ${target.toLocaleString("it-IT")} XP`,
    nextLabel: (robotName) => `Prossimo: ${robotName}`,
    maxLabel: "⚡ OMEGA — Livello massimo raggiunto",
  },
  levelUp: {
    eyebrow: "LEVEL UP",
    title: (titleForLevel) => `Sei diventato ${titleForLevel}!`,
    sub: (robotName) => `Il tuo robot si è evoluto in ${robotName}`,
    cta: "Continua a imparare",
    closeAria: "Chiudi",
  },
};

const en: LevelsCopy = {
  badge: {
    levelLabel: (level) => `Level ${level}`,
  },
  xpBar: {
    progress: (current, target) =>
      `${current.toLocaleString("en-US")} / ${target.toLocaleString("en-US")} XP`,
    nextLabel: (robotName) => `Next: ${robotName}`,
    maxLabel: "⚡ OMEGA — Maximum level reached",
  },
  levelUp: {
    eyebrow: "LEVEL UP",
    title: (titleForLevel) => `You're now a ${titleForLevel}!`,
    sub: (robotName) => `Your robot evolved into ${robotName}`,
    cta: "Keep learning",
    closeAria: "Close",
  },
};

export function getLevelsCopy(lang: Lang): LevelsCopy {
  return lang === "it" ? it : en;
}
