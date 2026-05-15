"use client";

import { useEffect, useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import bookAnimation from "@/assets/Book.json";

export function XpBook() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    lottieRef.current?.setSpeed(0.5);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden opacity-30"
      // Same warm-grey filter as StreakFlame — both stat-card decorations
      // share one neutral palette so they read as a coherent system.
      style={{ filter: "grayscale(100%) sepia(15%) brightness(0.95)" }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={bookAnimation}
        loop
        autoplay
        rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        className="h-[150%] w-full"
      />
    </div>
  );
}
