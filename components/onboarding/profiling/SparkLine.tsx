"use client";

// Visual treatment for Spark's spoken lines inside profiling steps. Lifted
// out of every step to avoid repeating the same paragraph + micro-line
// styling 12 times.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  emphasis?: "default" | "lead";
}

export function SparkLine({ children, className, emphasis = "default" }: Props) {
  return (
    <p
      className={cn(
        "max-w-prose text-text-primary",
        emphasis === "lead"
          ? "font-heading text-2xl font-semibold leading-snug sm:text-3xl"
          : "text-base leading-relaxed sm:text-lg",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SparkMicro({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-2 max-w-prose text-sm italic leading-relaxed text-text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}
