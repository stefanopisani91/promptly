"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LANGS, type Lang } from "@/types";
import { cn } from "@/lib/utils";

const LOCALE_COOKIE = "NEXT_LOCALE";

interface Props {
  current: Lang;
  ariaLabel: string;
  className?: string;
}

export function LangToggle({ current, ariaLabel, className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLang(next: Lang) {
    if (next === current || pending) return;
    // 1 year, root path so the cookie is shared with the marketing area.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs font-medium",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {LANGS.map((lang) => {
        const active = lang === current;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLang(lang)}
            aria-pressed={active}
            disabled={pending}
            className={cn(
              "rounded-full px-3 py-1 uppercase tracking-wide transition-colors",
              active
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary",
              pending && "opacity-60",
            )}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}
