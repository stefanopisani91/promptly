// Lesson 2 (mindset-02) — per-project placeholder copy for the
// CLAUDE.md interactive editor.
//
// Why a dedicated file instead of pushing this into the lesson JSON:
//   - The placeholders depend on a runtime selection (selectedProject)
//     and on the user's locale, a 2D matrix the JSON shape doesn't model.
//   - Keeping them as code lets a future round add validators / linters
//     (e.g. enforce that every project key in claudemd_config.projects has
//     a matching entry here) without touching content.
//
// The two static (non-dynamic) section placeholders — "Cosa stiamo
// costruendo" and "Come voglio lavorare con l'AI" — stay in the JSON,
// where they belong: a single source per lesson per locale.

import type { Lang } from "@/types";

export type Mindset02ProjectKey = "ecommerce" | "habits" | "website";

export function isMindset02ProjectKey(
  value: unknown,
): value is Mindset02ProjectKey {
  return value === "ecommerce" || value === "habits" || value === "website";
}

const STACK_PLACEHOLDERS: Record<Lang, Record<Mindset02ProjectKey, string>> = {
  it: {
    ecommerce:
      "Es: una piattaforma che permette pagamenti online sicuri e gestione di max 50 prodotti.",
    habits:
      "Es: un'app web con database per salvare le mie abitudini, e grafici per visualizzare i progressi.",
    website:
      "Es: un sito statico veloce, con immagini ottimizzate e un form contatti che funzioni senza database.",
  },
  en: {
    ecommerce:
      "Ex: a platform that handles secure online payments and up to 50 products.",
    habits:
      "Ex: a web app with a database to store my habits, plus charts to visualise progress.",
    website:
      "Ex: a fast static site with optimised images and a contact form that works without a database.",
  },
};

const RULES_PLACEHOLDERS: Record<Lang, Record<Mindset02ProjectKey, string>> = {
  it: {
    ecommerce:
      "Es: non modificare la pagina checkout senza chiedermi. Mostrami sempre cosa cambi prima di applicare.",
    habits:
      "Es: non rompere la logica delle streak quando aggiungi cose nuove. Tieni i nomi delle abitudini in lowercase.",
    website:
      "Es: tutte le immagini devono essere leggere e ottimizzate. Non aggiungere animazioni complicate al sito.",
  },
  en: {
    ecommerce:
      "Ex: don't change the checkout page without asking. Always show me what you'll change before applying.",
    habits:
      "Ex: don't break the streak logic when adding new things. Keep habit names in lowercase.",
    website:
      "Ex: every image must be light and optimised. Don't add complicated animations to the site.",
  },
};

/**
 * Resolve the placeholder for the "stack" section. Returns null when no
 * project is selected so the caller can fall back to the static
 * placeholder shipped in the lesson JSON.
 */
export function getStackPlaceholder(
  projectKey: string | null,
  lang: Lang,
): string | null {
  if (!isMindset02ProjectKey(projectKey)) return null;
  return STACK_PLACEHOLDERS[lang]?.[projectKey] ?? null;
}

/**
 * Resolve the placeholder for the "rules" section. Same fallback rules as
 * getStackPlaceholder.
 */
export function getRulesPlaceholder(
  projectKey: string | null,
  lang: Lang,
): string | null {
  if (!isMindset02ProjectKey(projectKey)) return null;
  return RULES_PLACEHOLDERS[lang]?.[projectKey] ?? null;
}

/**
 * Bundle of all dynamic placeholders for one locale. Used by page.tsx to
 * pass a pre-resolved map into ClaudemdEditor — the component itself
 * stays language-agnostic, mirroring how strings.* fields work elsewhere
 * on the lesson surface.
 */
export interface Mindset02DynamicPlaceholders {
  stack: Record<Mindset02ProjectKey, string>;
  rules: Record<Mindset02ProjectKey, string>;
}

export function getMindset02DynamicPlaceholders(
  lang: Lang,
): Mindset02DynamicPlaceholders {
  return {
    stack: STACK_PLACEHOLDERS[lang],
    rules: RULES_PLACEHOLDERS[lang],
  };
}
