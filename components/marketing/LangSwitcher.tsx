"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/posthog";

interface Props {
  current: Lang;
  className?: string;
}

export function LangSwitcher({ current, className }: Props) {
  const pathname = usePathname() ?? `/${current}`;
  const segments = pathname.split("/");
  const head = segments[1];
  const rest = isLang(head) ? segments.slice(2).join("/") : segments.slice(1).join("/");
  const tail = rest ? `/${rest}` : "";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs font-medium",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {(["it", "en"] as const).map((lang) => {
        const active = lang === current;
        return (
          <Link
            key={lang}
            href={`/${lang}${tail}`}
            prefetch={false}
            aria-current={active ? "true" : undefined}
            onClick={() => {
              if (!active) track({ name: "landing_lang_switched", props: { from: current, to: lang } });
            }}
            className={cn(
              "rounded-full px-3 py-1 uppercase tracking-wide transition-colors",
              active
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {lang}
          </Link>
        );
      })}
    </div>
  );
}
