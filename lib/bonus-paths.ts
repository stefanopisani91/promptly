// Static catalog of bonus paths (Dashboard V2 — Phase 3).
// Each entry mirrors the table in DASHBOARD_V2.md §3.
//
// Why static, not DB-backed: the project's main paths (PATH_META in
// lib/lessons/paths.ts) are also code-defined; lesson *content* lives in
// /content JSON files, but path *metadata* is colocated with the code that
// consumes it. We follow the same pattern here for consistency.
//
// `is_published: false` everywhere — actual lesson content lands in Phase 5.

import type { BonusPath, BonusPathSlug, UnlockCondition } from "@/types";

// Helper to keep the catalog readable.
function and(...conditions: UnlockCondition[]): UnlockCondition {
  return { type: "composite_and", all_of: conditions };
}
function xp(amount: number): UnlockCondition {
  return { type: "xp_threshold", xp_required: amount };
}
function pathDone(slug: "mindset" | "prompt" | "build" | "debug" | "ship"): UnlockCondition {
  return { type: "achievement_path", path_slug: slug };
}
function streak(min: number): UnlockCondition {
  return { type: "achievement_streak", streak_min: min };
}
function referral(min: number): UnlockCondition {
  return { type: "social_referral", min_count: min };
}

export const BONUS_PATHS: Record<BonusPathSlug, BonusPath> = {
  "path-x": {
    slug: "path-x",
    title_it: "Non finire mai i token: best practice con Claude Code",
    title_en: "Never run out of tokens: Claude Code best practices",
    description_it:
      "Context window, decomposizione dei task, file di contesto, quando ricominciare da zero.",
    description_en:
      "Context window, task decomposition, context files, when to start fresh.",
    tier: "free",
    difficulty: "beginner",
    lesson_count: 4,
    estimated_minutes_min: 20,
    estimated_minutes_max: 30,
    branch_from_path: "prompt",
    is_published: false,
    unlock_condition: and(xp(600), pathDone("prompt")),
  },
  "path-y": {
    slug: "path-y",
    title_it: "Cosa sono gli agenti e come si usano",
    title_en: "What are agents and how to use them",
    description_it:
      "Agent mode vs chat, loop agente, tool calls e permessi, esempi pratici.",
    description_en:
      "Agent mode vs chat, the agentic loop, tool calls and permissions, hands-on examples.",
    tier: "free",
    difficulty: "intermediate",
    lesson_count: 5,
    estimated_minutes_min: 30,
    estimated_minutes_max: 40,
    branch_from_path: "prompt",
    is_published: false,
    unlock_condition: referral(1),
  },
  "path-z": {
    slug: "path-z",
    title_it: "Il CLAUDE.md perfetto: dai all'AI il contesto che merita",
    title_en: "The perfect CLAUDE.md: give your AI the context it deserves",
    description_it:
      "Strutturare il file di contesto del progetto, cosa includere e cosa no.",
    description_en:
      "Structuring the project context file, what to include and what to leave out.",
    tier: "pro",
    difficulty: "intermediate",
    lesson_count: 4,
    estimated_minutes_min: 20,
    estimated_minutes_max: 30,
    branch_from_path: "build",
    is_published: false,
    unlock_condition: xp(2500),
  },
  "path-w": {
    slug: "path-w",
    title_it: "Prompt per il design: UI belle al primo tentativo",
    title_en: "Design prompting: beautiful UI on the first try",
    description_it:
      "Riferimenti visivi, design system, pattern di prompt per layout e tipografia.",
    description_en:
      "Visual references, design systems, prompt patterns for layout and typography.",
    tier: "pro",
    difficulty: "intermediate",
    lesson_count: 4,
    estimated_minutes_min: 20,
    estimated_minutes_max: 30,
    branch_from_path: "build",
    is_published: false,
    unlock_condition: and(pathDone("build"), xp(2500)),
  },
  "path-q": {
    slug: "path-q",
    title_it: "Git per vibe coder: versioni e backup senza paura",
    title_en: "Git for vibe coders: versions and backups without fear",
    description_it:
      "Branch, commit, recupero da errori con il minimo set di comandi che servono davvero.",
    description_en:
      "Branches, commits, recovering from mistakes with the minimum command set you actually need.",
    tier: "pro",
    difficulty: "intermediate",
    lesson_count: 4,
    estimated_minutes_min: 20,
    estimated_minutes_max: 30,
    branch_from_path: "debug",
    is_published: false,
    unlock_condition: xp(4000),
  },
  "path-r": {
    slug: "path-r",
    title_it: "Costruisci il tuo MCP: aggiungi superpoteri all'AI",
    title_en: "Build your own MCP: add superpowers to your AI",
    description_it:
      "Cos'è un MCP, quando ne serve uno, scrivere il primo server passo-passo.",
    description_en:
      "What an MCP is, when you need one, writing your first server step by step.",
    tier: "pro",
    difficulty: "advanced",
    lesson_count: 5,
    estimated_minutes_min: 30,
    estimated_minutes_max: 45,
    branch_from_path: "debug",
    is_published: false,
    unlock_condition: and(xp(4000), streak(7)),
  },
  "path-s": {
    slug: "path-s",
    title_it: "Da app a SaaS: aggiungi pagamenti in 30 minuti",
    title_en: "From app to SaaS: add payments in 30 minutes",
    description_it:
      "Stripe Checkout, webhook, subscription management — il minimo indispensabile.",
    description_en:
      "Stripe Checkout, webhooks, subscription management — the bare essentials.",
    tier: "pro",
    difficulty: "advanced",
    lesson_count: 5,
    estimated_minutes_min: 30,
    estimated_minutes_max: 45,
    branch_from_path: "ship",
    is_published: false,
    unlock_condition: xp(6000),
  },
  "path-t": {
    slug: "path-t",
    title_it: "La tua Prompt Library: arsenale riusabile per ogni progetto",
    title_en: "Your Prompt Library: a reusable arsenal for every project",
    description_it:
      "Una raccolta curata dei migliori pattern visti nel corso, per costruire la tua libreria personale.",
    description_en:
      "A curated collection of the best patterns from the course, to build your personal library.",
    tier: "pro",
    difficulty: "advanced",
    lesson_count: 6,
    estimated_minutes_min: 40,
    estimated_minutes_max: 60,
    // PathT is the endgame — it sits above Path 5 on the map rather than
    // branching off any single path.
    branch_from_path: null,
    is_published: false,
    unlock_condition: { type: "achievement_all_paths" },
  },
};

export function getBonusPath(slug: BonusPathSlug): BonusPath {
  return BONUS_PATHS[slug];
}

export function listBonusPaths(): BonusPath[] {
  return Object.values(BONUS_PATHS);
}
