// UI strings for bonus paths (Dashboard V2 — Phase 3).
//
// Path titles/descriptions live next to the metadata in lib/bonus-paths.ts
// (already bilingual). This file covers the *unlock progress* and "Coming
// soon" labels that wrap them — copy that's UI-state-driven rather than
// path-specific.

import type { Lang, PathSlug, UnlockState } from "@/types";

export interface BonusPathsCopy {
  badge: {
    bonus: string;
    free: string;
    pro: string;
    comingSoon: string;
    unlocked: string;
  };
  unlock: {
    locked: string;
    needXp: (missing: number) => string;
    needStreak: (days: number) => string;
    needReferrals: (count: number) => string;
    needPath: (pathTitle: string) => string;
    needPaths: (pathTitles: string[]) => string;
  };
  difficulty: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  // Display labels for the canonical PathSlug values, used inside the
  // "complete X to unlock" copy. Keep these in sync with the path titles
  // shown elsewhere on the dashboard.
  pathName: Record<PathSlug, string>;
}

const it: BonusPathsCopy = {
  badge: {
    bonus: "Bonus path",
    free: "Gratis",
    pro: "Pro",
    comingSoon: "In arrivo",
    unlocked: "Sbloccata 🎉",
  },
  unlock: {
    locked: "Bloccata",
    needXp: (missing) =>
      `Mancano ${missing.toLocaleString("it-IT")} XP per sbloccarla`,
    needStreak: (days) =>
      `Serve una streak di almeno ${days} giorni (anche in passato)`,
    needReferrals: (count) =>
      count === 1 ? "Invita 1 amico per sbloccarla" : `Invita ${count} amici per sbloccarla`,
    needPath: (pathTitle) => `Completa il percorso ${pathTitle} per sbloccarla`,
    needPaths: (pathTitles) =>
      `Completa: ${pathTitles.join(", ")} per sbloccarla`,
  },
  difficulty: {
    beginner: "🟢 Principiante",
    intermediate: "🟡 Intermedio",
    advanced: "🔴 Avanzato",
  },
  pathName: {
    mindset: "Mindset",
    prompt: "Prompt",
    build: "Build",
    debug: "Debug",
    ship: "Ship",
  },
};

const en: BonusPathsCopy = {
  badge: {
    bonus: "Bonus path",
    free: "Free",
    pro: "Pro",
    comingSoon: "Coming soon",
    unlocked: "Unlocked 🎉",
  },
  unlock: {
    locked: "Locked",
    needXp: (missing) =>
      `${missing.toLocaleString("en-US")} XP away from unlocking`,
    needStreak: (days) =>
      `Reach a ${days}-day streak (any time) to unlock`,
    needReferrals: (count) =>
      count === 1 ? "Invite 1 friend to unlock" : `Invite ${count} friends to unlock`,
    needPath: (pathTitle) => `Finish the ${pathTitle} path to unlock`,
    needPaths: (pathTitles) => `Finish: ${pathTitles.join(", ")} to unlock`,
  },
  difficulty: {
    beginner: "🟢 Beginner",
    intermediate: "🟡 Intermediate",
    advanced: "🔴 Advanced",
  },
  pathName: {
    mindset: "Mindset",
    prompt: "Prompt",
    build: "Build",
    debug: "Debug",
    ship: "Ship",
  },
};

export function getBonusPathsCopy(lang: Lang): BonusPathsCopy {
  return lang === "it" ? it : en;
}

/**
 * Render the UnlockState (from lib/unlock.ts) into a single human-readable
 * sentence. Picks the most binding constraint when multiple are present.
 */
export function describeUnlockState(
  state: UnlockState,
  copy: BonusPathsCopy,
): string {
  if (state.unlocked) return copy.badge.unlocked;
  if (state.missing_paths && state.missing_paths.length > 0) {
    const titles = state.missing_paths.map((slug) => copy.pathName[slug]);
    return titles.length === 1
      ? copy.unlock.needPath(titles[0])
      : copy.unlock.needPaths(titles);
  }
  if (state.missing_referrals && state.missing_referrals > 0) {
    return copy.unlock.needReferrals(state.missing_referrals);
  }
  if (state.missing_streak && state.missing_streak > 0) {
    // Streak text already encodes "any time"; show the target threshold,
    // not the missing delta — the delta is meaningless when longest_streak
    // can't be increased retroactively.
    return copy.unlock.needStreak(state.missing_streak);
  }
  if (state.missing_xp && state.missing_xp > 0) {
    return copy.unlock.needXp(state.missing_xp);
  }
  return copy.unlock.locked;
}
