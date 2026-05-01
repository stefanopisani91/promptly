"use client";

import { useEffect, useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import streakFire from "@/assets/StreakFire.json";

export function StreakFlame() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    lottieRef.current?.setSpeed(0.25);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden opacity-25"
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={streakFire}
        loop
        autoplay
        rendererSettings={{ preserveAspectRatio: "xMidYMax slice" }}
        className="absolute inset-x-0 bottom-0 h-[150%] w-full translate-y-[22%]"
      />
    </div>
  );
}
