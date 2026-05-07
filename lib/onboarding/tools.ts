// Catalog of LLM/IDE tools shown in the STEP 6 tag cloud of the new
// onboarding flow (Profilazione.md). The split between "llm" and "ide" is
// load-bearing: only users who select at least one "ide" tool see STEP 7
// (preferred-tool follow-up).
//
// Slugs are stable identifiers persisted in users.tools_used (text[]) and
// users.preferred_tool. Keep them URL-safe and lowercase. The icon path
// resolves to /public/tools/<slug>.svg — served as a static asset, not
// imported as a React component.

import type { Lang } from "@/types";

export type ToolCategory = "llm" | "ide";

export interface ToolMeta {
  slug: string;
  name: string;
  category: ToolCategory;
  icon: string; // public path
  // Pretty label used by Spark in messages. Defaults to `name` if absent.
  display_name?: string;
}

export const ONBOARDING_TOOLS: readonly ToolMeta[] = [
  // LLM chatbots
  { slug: "chatgpt", name: "ChatGPT", category: "llm", icon: "/tools/chatgpt.svg" },
  { slug: "claude", name: "Claude", category: "llm", icon: "/tools/claude.svg" },
  { slug: "gemini", name: "Gemini", category: "llm", icon: "/tools/gemini.svg" },
  { slug: "perplexity", name: "Perplexity", category: "llm", icon: "/tools/perplexity.svg" },
  { slug: "mistral", name: "Mistral", category: "llm", icon: "/tools/mistral.svg" },
  // IDE AI / build tools
  { slug: "cursor", name: "Cursor", category: "ide", icon: "/tools/cursor.svg" },
  { slug: "windsurf", name: "Windsurf", category: "ide", icon: "/tools/windsurf.svg" },
  { slug: "claude-code", name: "Claude Code", category: "ide", icon: "/tools/claude-code.svg" },
  { slug: "lovable", name: "Lovable", category: "ide", icon: "/tools/lovable.svg" },
  { slug: "bolt", name: "Bolt.new", category: "ide", icon: "/tools/bolt.svg" },
  { slug: "replit", name: "Replit", category: "ide", icon: "/tools/replit.svg" },
  { slug: "antigravity", name: "Antigravity", category: "ide", icon: "/tools/antigravity.svg" },
  { slug: "vscode", name: "VS Code", category: "ide", icon: "/tools/vscode.svg" },
  // TODO: sostituire con SVG ufficiale Base44 quando disponibile.
  // Asset ufficiale non reperibile al 2026-05-07 → /public/tools/base44.svg
  // resta il placeholder fittizio "B44" su sfondo viola. Stesso filename:
  // sostituire solo il contenuto del file SVG, niente da cambiare qui.
  { slug: "base44", name: "Base44", category: "ide", icon: "/tools/base44.svg" },
] as const;

export const TOOL_SLUGS: readonly string[] = ONBOARDING_TOOLS.map((t) => t.slug);

const TOOLS_BY_SLUG: Record<string, ToolMeta> = ONBOARDING_TOOLS.reduce(
  (acc, tool) => {
    acc[tool.slug] = tool;
    return acc;
  },
  {} as Record<string, ToolMeta>,
);

export function isToolSlug(value: unknown): value is string {
  return typeof value === "string" && value in TOOLS_BY_SLUG;
}

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS_BY_SLUG[slug];
}

/**
 * Sanitise an arbitrary array of strings into a clean list of catalog slugs.
 * Strips unknown values and dedupes â€” used by the server action when
 * persisting STEP 6.
 */
export function sanitiseToolSlugs(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of input) {
    if (typeof v !== "string") continue;
    if (!(v in TOOLS_BY_SLUG)) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

/**
 * Subset of tools the user actually picked, filtered to the IDE category â€”
 * only this subset is offered in STEP 7 (preferred-tool follow-up).
 */
export function ideToolsFromSlugs(slugs: readonly string[]): ToolMeta[] {
  return slugs
    .map((s) => TOOLS_BY_SLUG[s])
    .filter((t): t is ToolMeta => Boolean(t) && t.category === "ide");
}

export function hasAnyIdeTool(slugs: readonly string[]): boolean {
  return ideToolsFromSlugs(slugs).length > 0;
}

/**
 * Resolved display name for Spark's prose (e.g. promise text). Falls back
 * to the slug capitalised when the catalog hasn't been updated yet. The
 * `lang` parameter is reserved for future per-language overrides; currently
 * tool names are language-agnostic.
 */
export function toolDisplayName(slug: string, lang: Lang = "it"): string {
  void lang;
  const tool = TOOLS_BY_SLUG[slug];
  if (tool) return tool.display_name ?? tool.name;
  // Defensive — return a humanised slug so legacy data still renders.
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
