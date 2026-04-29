import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: Props) {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div
        className={cn(
          "w-full max-w-[420px] rounded-2xl border border-border bg-surface p-7 shadow-sm sm:p-9",
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
}
