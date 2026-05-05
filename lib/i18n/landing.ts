import type { Lang } from "@/types";
import type { LuciaDemoCopy } from "@/lib/landing-demo/types";
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
    ctaBug: string;
    reminder: string;
    mockup: {
      url: string;
      lessonTitle: string;
      lessonStep: string;
      sparkLabel: string;
      cardEyebrow: string;
      cardTitle: string;
      cardBody: string;
      chip1: string;
      chip2: string;
      xpToast: string;
    };
  };
  problem: {
    eyebrow: string;
    title: string;
    sub: string;
    steps: {
      iconSlug: "idea" | "wrench" | "loop";
      kickerEyebrow?: string;
      title: string;
      description: string;
      kickerEnd?: string;
    }[];
    conclusion: {
      line1: string;
      microExpertise: string;
      bridge: string;
    };
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
  demo: LuciaDemoCopy;
  socialProof: {
    eyebrow: string;
    title: string;
    sub: string;
    counter: string;
    /** Three product-screenshot cards. Each one is a real moment from
     * the app. The image src is a path under /public/brand/preview-*.png
     * declared in the consuming component (kept out of the copy so the
     * copy stays text-only). */
    previews: {
      kicker: string;
      title: string;
      caption: string;
    }[];
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
    socialLinks: {
      label: string; // visible name + aria-label
      href: string;
      platform: "twitter" | "linkedin" | "github";
    }[];
    rights: string;
    builtWith: string;
  };
}

export function getLandingCopy(lang: Lang): LandingCopy {
  return lang === "it" ? landingCopyIt : landingCopyEn;
}
