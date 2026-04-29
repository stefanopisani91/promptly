export type Lang = "en" | "it";

export const LANGS: readonly Lang[] = ["en", "it"] as const;

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "it";
}
