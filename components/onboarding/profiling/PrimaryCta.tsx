"use client";

// Reused at the bottom of every step. Keeping it in one file means the disabled
// state, focus ring and pending opacity stay consistent across the flow.

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  pending?: boolean;
  variant?: Variant;
  children: ReactNode;
}

export function PrimaryCta({
  pending,
  variant = "primary",
  children,
  className,
  disabled,
  ...rest
}: Props) {
  const isDisabled = disabled || pending;
  return (
    <button
      type="button"
      {...rest}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "primary"
          ? "bg-primary text-white hover:bg-primary-hover"
          : "border border-border bg-surface text-text-primary hover:border-primary/50 hover:text-primary",
        isDisabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
