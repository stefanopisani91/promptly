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
    /** Inline highlight reso come <em> con sfondo accent-soft.
     * Se presente, viene inserito alla fine della headline (oppure usato dal
     * componente per evidenziare una parte specifica). */
    headlineHighlight?: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    reminder: string;
    /** Carosello iPhone: alt text per accessibilità delle 7 schermate.
     * Le immagini stesse vivono in `public/brand/mobile/` come WebP. */
    carousel: {
      ariaLabel: string;
      slides: string[]; // 7 alt strings, una per schermata
    };
  };
  method: {
    kicker: string;
    /** Lead headline. Il componente cerca pattern `**testo**` e li renderizza
     * come <em> con sfondo accent. */
    lead: string;
    paragraphs: {
      bold: string;
      body: string;
      quiet?: string;
    }[];
  };
  meetSpark: {
    kicker: string;
    name: string;
    portraitCaption: string;
    /** Paragrafi in voce. `**testo**` = bold, `«testo»` = spark-quote highlighted */
    paragraphs: string[];
    /** Chip "regole di voce" — kind decide il prefisso ✓/✕ */
    rules: { kind: "yes" | "no"; label: string }[];
  };
  tools: {
    kicker: string;
    title: string;
    sub: string;
    /** 6 IDE cards. `slug` identifica il tool per analytics + routing futuro. */
    cards: {
      slug: "cursor" | "claude-code" | "windsurf" | "copilot" | "bolt" | "v0";
      name: string;
      desc: string;
      badge: string;
      ariaLabel: string;
    }[];
  };
  curriculum: {
    /** Microtext sopra al titolo, stile editoriale. */
    kicker: string;
    title: string;
    sub: string;
    cards: {
      number: string;
      iconSlug: "mindset" | "prompt" | "build" | "debug" | "ship";
      level: "beginner" | "intermediate" | "advanced";
      title: string;
      /** Descrizione editoriale di una riga del percorso. */
      desc: string;
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
      platform: "instagram" | "tiktok" | "youtube" | "facebook";
    }[];
    rights: string;
    builtWith: string;
  };
}

export function getLandingCopy(lang: Lang): LandingCopy {
  return lang === "it" ? landingCopyIt : landingCopyEn;
}
