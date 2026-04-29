// Single source of truth for fill-in-the-blank validation.
// Used both client-side (for instant feedback in ExerciseFillBlank) and
// server-side if/when we ever revalidate. PROMPTLY.md rule #14 keeps the
// authoritative check on the client; this module just defines the rule.

export function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function checkBlank(userInput: string, accepted: string[]): boolean {
  const norm = normalize(userInput);
  if (!norm) return false;
  return accepted.some((a) => normalize(a) === norm);
}
