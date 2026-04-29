// XP calculation lives exclusively here (PROMPTLY.md rule #12).
// Reveal at the 3rd attempt halves the XP earned.

export function calculateLessonXp(
  baseXp: number,
  difficultyBonus: number,
  attempts: number,
): number {
  const reveal = attempts >= 3;
  const total = baseXp + difficultyBonus;
  return reveal ? Math.floor(total * 0.5) : total;
}
