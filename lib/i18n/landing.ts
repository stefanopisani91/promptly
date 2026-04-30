import type { Lang } from "@/types";
import type { EvaluatorCopy } from "@/lib/evaluator/types";
import { landingCopyIt } from "./landing-it";
import { landingCopyEn } from "./landing-en";

export interface LandingCopy {
  meta: {
    title: string;
    description: string;
  };
  header: {
    login: string;
    cta: string;
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    eyebrow: string;
    headline: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    reminder: string;
    mockup: {
      url: string;
      lessonTitle: string;
      lessonStep: string;
      promptLabel: string;
      promptText: string;
      blank1: string;
      blank2: string;
      check: string;
      correct: string;
      xpToast: string;
    };
  };
  problem: {
    title: string;
    subtitle: string;
    cards: { emoji: string; quote: string }[];
  };
  solution: {
    title: string;
    steps: {
      number: string;
      eyebrow: string;
      iconSlug: "mindset" | "prompt" | "build";
      title: string;
      sub: string;
    }[];
  };
  curriculum: {
    title: string;
    sub: string;
    cards: {
      number: string;
      iconSlug: "mindset" | "prompt" | "build" | "debug" | "ship";
      level: "beginner" | "intermediate" | "advanced";
      title: string;
      meta: string;
      tier: "free" | "pro";
      tierLabel: string;
      startHere?: string;
    }[];
  };
  exercise: {
    title: string;
    sub: string;
    url: string;
    lessonStep: string;
    lessonTitle: string;
    promptLabel: string;
    promptText: string;
    blanks: {
      accepted: string[];
      hints: [string, string, string];
    }[];
    microcopy: {
      verify: string;
      hint: string;
      hintLabel: string;
      revealLabel: string;
      blankLabel: string;
      attemptOf: string;
      wrongInline: string;
      revealedNotice: string;
      completedTitle: string;
      completedSub: string;
      completedCta: string;
      ariaInputBlank: string;
      ariaFeedback: string;
    };
  };
  evaluator: EvaluatorCopy;
  socialProof: {
    eyebrow: string;
    title: string;
    sub: string;
    counter: string;
    placeholder: string;
  };
  faq: {
    title: string;
    sub: string;
    items: { q: string; a: string }[];
  };
  closingCta: {
    title: string;
    sub: string;
    cta: string;
    reminder: string;
  };
  footer: {
    columns: {
      product: { heading: string; links: { label: string; href: string }[] };
      resources: {
        heading: string;
        links: { label: string; href: string }[];
      };
      legal: { heading: string; links: { label: string; href: string }[] };
    };
    socialHeading: string;
    rights: string;
    builtWith: string;
  };
}

export function getLandingCopy(lang: Lang): LandingCopy {
  return lang === "it" ? landingCopyIt : landingCopyEn;
}
