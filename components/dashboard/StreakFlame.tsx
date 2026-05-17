"use client";

// May 2026: added `intensity` prop (streak day count) so the flame
// speed and opacity scale with the user's streak — a longer streak
// means a faster, brighter flame.

import { useEffect, useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import streakFire from "@/assets/StreakFire.json";

interface Props {
  /** Streak day count — drives flame speed and opacity. Default 0. */
  intensity?: number;
}

export function StreakFlame({ intensity = 0 }: Props) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    // 0-2 days → slow (0.25×), 3-6 days → medium (0.5×), 7+ → fast (0.9×)
    const speed = intensity >= 7 ? 0.9 : intensity >= 3 ? 0.5 : 0.25;
    lottieRef.current?.setSpeed(speed);
  }, [intensity]);

  // Opacity also scales: visible glow at 3+, strong at 7+
  const opacityClass =
    intensity >= 7
      ? "opacity-50"
      : intensity >= 3
        ? "opacity-35"
        : "opacity-25";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 select-none overflow-hidden transition-opacity duration-700 ${opacityClass}`}
      // Neutralise the asset's stock purple/violet tint into a warm grey
      // so the card chrome matches the editorial landing palette. Streak
      // intensity is signalled by the orange/red number + the "X giorni 🔥"
      // line — the decoration stays as a quiet background.
      style={{ filter: "grayscale(100%) sepia(15%) brightness(0.95)" }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={streakFire}
        loop
        autoplay
        rendererSettings={{ preserveAspectRatio: "xMidYMax slice" }}
        className="absolute inset-x-0 bottom-0 h-[150%] w-full translate-y-[22%] md:left-1/2 md:right-auto md:h-[160%] md:w-auto md:aspect-square md:translate-y-[20%] md:-translate-x-1/2"
      />
    </div>
  );
}
