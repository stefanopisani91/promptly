// Shared types for the "Lucia" landing demo (replaces the old PromptEvaluator).
// The demo is a public landing-page experience: the user reads a broken
// homepage, writes a prompt asking AI for help, gets a structured evaluation
// from gpt-4o-mini, and watches the homepage repair itself depending on the
// score + which bugs they actually mentioned.

import type { Lang } from "@/types";

/** The 3 visible bugs the user is supposed to spot in the homepage. */
export type BugId = "foto" | "overflow" | "bottone";

/** Four scoring dimensions (kept identical to the previous evaluator so the
 * result-panel UI stays familiar). */
export type DimensionKey = "chiarezza" | "contesto" | "obiettivo" | "protezione";

/** What the API returns after a successful evaluation. */
export interface LuciaEvaluation {
  chiarezza: number;
  contesto: number;
  obiettivo: number;
  protezione: number;
  /** Computed server-side from base + bonuses for determinism. */
  totale: number;
  consiglio: string;
  bugs_menzionati: BugId[];
  lingua: Lang;
}

/** Raw shape returned by the LLM — the API layer derives `totale` from
 * these fields plus the bonus signals so the calibration is deterministic. */
export interface LuciaRawEvaluation {
  chiarezza: number;
  contesto: number;
  obiettivo: number;
  protezione: number;
  consiglio: string;
  bugs_menzionati: BugId[];
  lingua: Lang;
  /** True when the user listed at least 3 OPERATIONAL constraints (framework,
   * dependencies, diff scope, design system, animations). NOT for vague
   * phrases like "modifiche minime" or "non rompere altri elementi". */
  has_3_plus_operational_constraints: boolean;
  /** True when the user explicitly asked for an explanation of the fix
   * (e.g. "spiegami cosa hai cambiato e perché"). */
  asks_fix_explanation: boolean;
}

/** Score band derived from `totale` — drives label + colour + animation tier. */
export type ScoreBand = "review" | "improve" | "good" | "great" | "perfect";

export function bandFromScore(score: number): ScoreBand {
  if (score >= 95) return "perfect";
  if (score >= 81) return "great";
  if (score >= 61) return "good";
  if (score >= 41) return "improve";
  return "review";
}

/** Which bugs the homepage should render as "fixed" — derived by the decision
 * matrix from (totale, bugs_menzionati). */
export interface FixedBugs {
  foto: boolean;
  overflow: boolean;
  bottone: boolean;
}

export const NO_BUGS_FIXED: FixedBugs = {
  foto: false,
  overflow: false,
  bottone: false,
};

/** Outcome of the decision matrix — fed to the homepage + result panel. */
export interface DemoOutcome {
  fixed: FixedBugs;
  /** Show the cinematic "all repaired" sequence + fireworks + final CTA card. */
  victory: boolean;
  /** Key into copy.messages — what to show under the result panel. */
  messageKey:
    | "scoreLow"
    | "scoreMidOnePhotoOnly"
    | "scoreMidPartialOneLeft"
    | "scoreMidAllBugs"
    | "scoreHighPartial"
    | "scoreHighAll";
  /** Count of bugs the user did NOT mention (for the "scoreHighPartial" copy). */
  missedCount: number;
}

// Bonus weights enforced server-side. The LLM's totale field (if any) is
// ignored — only the raw dimensions + bonus signals it returns are used.
export const BONUS_ALL_3_BUGS = 5;
export const BONUS_3_PLUS_OPERATIONAL_CONSTRAINTS = 5;
export const BONUS_FIX_EXPLANATION = 3;

/** Minimum band we award when the user has at least one bug identified
 * but otherwise scored very low. The reasoning: they showed enough intent
 * to spot a real problem on Lucia's homepage, so they deserve "DA
 * MIGLIORARE" (41+) rather than "DA RIVEDERE". A genuinely empty prompt
 * (no bugs) stays in the low band. */
export const ONE_BUG_FLOOR = 41;

/** Compute the final 0-100 score from raw dimensions + bonus signals. */
export function computeTotale(
  chiarezza: number,
  contesto: number,
  obiettivo: number,
  protezione: number,
  bugsMentioned: BugId[],
  has3PlusOperationalConstraints: boolean,
  asksFixExplanation: boolean,
): number {
  const base =
    chiarezza * 0.25 +
    contesto * 0.25 +
    obiettivo * 0.3 +
    protezione * 0.2;
  let bonus = 0;
  if (bugsMentioned.length === 3) bonus += BONUS_ALL_3_BUGS;
  if (has3PlusOperationalConstraints)
    bonus += BONUS_3_PLUS_OPERATIONAL_CONSTRAINTS;
  if (asksFixExplanation) bonus += BONUS_FIX_EXPLANATION;

  let totale = Math.round(base) + bonus;

  // One-bug floor — see ONE_BUG_FLOOR above.
  if (bugsMentioned.length >= 1 && totale < ONE_BUG_FLOOR) {
    totale = ONE_BUG_FLOOR;
  }

  return Math.min(100, totale);
}

/** Pure decision logic — no side effects. Tested independently. */
export function deriveOutcome(
  totale: number,
  bugs: BugId[],
): DemoOutcome {
  const mentioned = new Set<BugId>(bugs);
  const allBugs: BugId[] = ["foto", "overflow", "bottone"];
  const allMentioned = allBugs.every((b) => mentioned.has(b));
  const missedCount = allBugs.filter((b) => !mentioned.has(b)).length;

  // Below 61 → nothing repairs.
  if (totale < 61) {
    return {
      fixed: NO_BUGS_FIXED,
      victory: false,
      messageKey: "scoreLow",
      missedCount,
    };
  }

  // Score 61-84: only mentioned bugs get fixed (and only if the user spotted
  // the photo at minimum — the photo is the obvious one).
  if (totale < 85) {
    const fixed: FixedBugs = {
      foto: mentioned.has("foto"),
      overflow: mentioned.has("overflow"),
      bottone: mentioned.has("bottone"),
    };
    if (allMentioned) {
      return { fixed, victory: false, messageKey: "scoreMidAllBugs", missedCount };
    }
    if (mentioned.size <= 1) {
      // Only one bug mentioned (likely the photo, or just one of the others).
      return {
        fixed,
        victory: false,
        messageKey: "scoreMidOnePhotoOnly",
        missedCount,
      };
    }
    return {
      fixed,
      victory: false,
      messageKey: "scoreMidPartialOneLeft",
      missedCount,
    };
  }

  // Score 85+: full cinematic if all 3 bugs were called out.
  if (allMentioned) {
    return {
      fixed: { foto: true, overflow: true, bottone: true },
      victory: true,
      messageKey: "scoreHighAll",
      missedCount: 0,
    };
  }
  // High score but missed some bugs — fix only the ones mentioned, no fireworks.
  return {
    fixed: {
      foto: mentioned.has("foto"),
      overflow: mentioned.has("overflow"),
      bottone: mentioned.has("bottone"),
    },
    victory: false,
    messageKey: "scoreHighPartial",
    missedCount,
  };
}

// ---------------------------------------------------------------------------
// Copy shape — every piece of UI text the demo renders. Defined here so both
// landing-it.ts and landing-en.ts can be type-checked against the same
// contract.
// ---------------------------------------------------------------------------

export interface LuciaDemoCopy {
  badge: string;
  title: string;
  titleEm: string;
  subtitle: string;

  homepage: {
    /** Browser-style address shown in the pill at the top of the unified
     * site/console card. Plain text, no protocol, no padlock. */
    addressBar: string;
    /** Per-language brand of the fictional app — IT: "FRIGOMAGICO", EN: "MEALGENIUS". */
    appName: string;
    nav: { howItWorks: string; pricing: string; getStarted: string };
    luciaHeadline: string;
    luciaSubheadline: string;
    photoLabel: string;
    /** Short numeric badge ("404") shown over the broken photo. */
    errorBadge: string;
    projectTitle: string;
    /** The decorative DOWNLOAD button — bug 3 (white-on-white). */
    ctaButton: string;
    footer: string;
    ariaIllustration: string;
    ariaHeaderIllustration: string;
  };

  console: {
    errorLine1: string;
    errorLine2: string;
  };

  editor: {
    windowTitle: string;
    placeholder: string;
    statusReady: string;
    statusEvaluating: string;
    statusEvaluated: string;
    charsLabel: string;
    btnEvaluate: string;
    btnEvaluating: string;
    btnRetry: string;
    /** Pattern with literal "{score}" — replaced at render time. */
    previousAttempt: string;
    ariaTextarea: string;
    ariaScore: string;
    ariaBar: string;
  };

  result: {
    evalLabel: string;
    adviceLabel: string;
    scoreLabels: Record<ScoreBand, string>;
    dimensions: Record<DimensionKey, { label: string; desc: string }>;
  };

  messages: {
    scoreLow: string;
    scoreMidOnePhotoOnly: string;
    scoreMidPartialOneLeft: string;
    scoreMidAllBugs: string;
    /** Pattern with "{count}" — replaced at render time. */
    scoreHighPartial: string;
    /** Pattern with "{score}" — replaced at render time. */
    scoreHighAllTitle: string;
    scoreHighAllSub: string;
    ctaFinal: string;
    limitTitle: string;
    limitSub: string;
    limitCta: string;
  };

  errors: {
    network: string;
    rateLimit: string;
    tooLong: string;
    invalidPrompt: string;
    generic: string;
    empty: string;
  };

  /** Inline AI/privacy disclosure shown right under the demo. Required by
   * Art. 13 GDPR + AI Act Art. 50 transparency. */
  disclosure: {
    /** Plain text before the privacy link. Should mention: AI involved,
     * processor + US transfer, "don't include personal data". */
    text: string;
    linkLabel: string;
  };

  footer: string;
}
