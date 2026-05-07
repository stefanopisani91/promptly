"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, type MouseEvent } from "react";
import { isLang, type Lang } from "@/types";
import { cn } from "@/lib/utils";
import { setLanguage } from "@/lib/i18n/actions";
import { track } from "@/lib/analytics/posthog";

const LOCALE_COOKIE = "NEXT_LOCALE";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

interface Props {
  /**
   * Server-resolved language. Used as a fallback for the displayed "active"
   * state when the URL itself carries no lang information (app routes like
   * /dashboard).
   */
  fallback: Lang;
  ariaLabel?: string;
  className?: string;
}

function persistLocaleCookie(next: Lang) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

function buildHref(pathname: string, queryString: string, target: Lang): string {
  const segments = pathname.split("/").filter(Boolean);

  // Marketing route: /it/* or /en/* — swap the language prefix.
  if (segments.length > 0 && isLang(segments[0])) {
    const tail = segments.slice(1).join("/");
    return `/${target}${tail ? `/${tail}` : ""}${queryString}`;
  }

  // Auth route (or any route carrying ?lang=) — replace the query value.
  const params = new URLSearchParams(
    queryString.startsWith("?") ? queryString.slice(1) : queryString,
  );
  if (params.has("lang")) {
    params.set("lang", target);
    return `${pathname}?${params.toString()}`;
  }

  // App route with no lang anywhere in the URL — keep pathname; the
  // server action + router.refresh will swap the rendered language.
  return `${pathname}${queryString}`;
}

export function LangSwitcher({ fallback, ariaLabel = "Language", className }: Props) {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = rawPathname ?? `/${fallback}`;
  const searchParams = useSearchParams();
  const queryString = searchParams && searchParams.toString()
    ? `?${searchParams.toString()}`
    : "";
  const [pending, startTransition] = useTransition();

  // Trust the URL when it carries lang info; otherwise fall back to the
  // server-resolved value (cookie / accept-language / profile).
  const segments = pathname.split("/").filter(Boolean);
  const pathLang = segments.length > 0 && isLang(segments[0]) ? segments[0] : null;
  const queryLangRaw = searchParams?.get("lang") ?? null;
  const queryLang = isLang(queryLangRaw) ? queryLangRaw : null;
  const current: Lang = pathLang ?? queryLang ?? fallback;

  function onSelect(target: Lang, event: MouseEvent<HTMLAnchorElement>) {
    if (target === current) {
      event.preventDefault();
      return;
    }

    persistLocaleCookie(target);
    track({ name: "landing_lang_switched", props: { from: current, to: target } });

    const targetHref = buildHref(pathname, queryString, target);
    const currentHref = `${pathname}${queryString}`;
    const urlChanges = targetHref !== currentHref;

    startTransition(async () => {
      await setLanguage(target);
      if (!urlChanges) {
        // App routes (e.g. /dashboard) — Link won't trigger a fetch when
        // the destination matches the current URL, so refresh manually.
        router.refresh();
      }
    });
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
      {(["it", "en"] as const).map((lang) => {
        const active = lang === current;
        const href = buildHref(pathname, queryString, lang);
        return (
          <Link
            key={lang}
            href={href}
            prefetch={false}
            aria-current={active ? "true" : undefined}
            onClick={(event) => onSelect(lang, event)}
            className={cn(
              // Visual size: same as before. Hit area: bumped to ≥44×44 on
              // mobile via min-h/min-w + flex centering, so the click
              // target meets WCAG 2.5.5 without changing the visible chip.
              "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-2 py-1 uppercase tracking-wide transition-colors md:min-h-0 md:min-w-0 md:px-3 md:py-1",
              active
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary",
              pending && "opacity-60",
            )}
          >
            {lang}
          </Link>
        );
      })}
    </div>
  );
}
