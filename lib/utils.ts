import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Trim a free-text user field (typically `project_description`) so it stays
 * readable when quoted inline in lesson copy. Existing DB rows can hold
 * values up to 300 chars (the pre-2026-05-09 cap); the new ceiling is 200,
 * but nothing prevents a long quote from feeling out of place inside a
 * Spark line. Default cap of 100 is the safe length for "we want to build
 * X" inline mentions.
 *
 * Empty / null-ish input returns an empty string. The ellipsis is appended
 * only when truncation actually happens.
 */
export function truncateProject(text: string, maxChars = 100): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd() + "…";
}
