// Thin wrapper around canvas-confetti. Centralised so all celebrations
// (lesson complete, streak milestones, level-up) share the same palette
// and timing, and we have a single import point if we swap the library.
//
// IMPORTANT: only call these from client components (canvas-confetti needs
// `window`). Each helper is a no-op when run server-side.

import confetti from "canvas-confetti";

const BRAND_PALETTE = [
  "#E8703F", // --primary
  "#EAB308", // --xp-gold
  "#16A34A", // --success
  "#FFF1EB", // --primary-light
];

function isClient(): boolean {
  return typeof window !== "undefined";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function fireConfetti(): void {
  if (!isClient()) return;
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: BRAND_PALETTE,
  });
}

// More intense burst for the level-up modal: two staggered shots from the
// sides plus a centre top-up. ~1.5s total feel.
export function fireLevelUpConfetti(): void {
  if (!isClient()) return;
  if (prefersReducedMotion()) return;

  const shoot = (originX: number) => {
    confetti({
      particleCount: 60,
      angle: originX < 0.5 ? 60 : 120,
      spread: 70,
      origin: { x: originX, y: 0.65 },
      colors: BRAND_PALETTE,
      ticks: 200,
    });
  };

  shoot(0.2);
  shoot(0.8);
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      startVelocity: 35,
      origin: { y: 0.6 },
      colors: BRAND_PALETTE,
      scalar: 1.1,
    });
  }, 220);
}
