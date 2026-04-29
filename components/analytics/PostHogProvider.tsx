"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { initPostHog, track } from "@/lib/analytics/posthog";
import { isLang } from "@/types";

const LANDING_ROOT_RE = /^\/(it|en)\/?$/;

function deriveSource(
  utmSource: string | null | undefined,
  referrer: string,
): string {
  if (utmSource) return utmSource;
  if (!referrer) return "direct";
  try {
    return new URL(referrer).hostname;
  } catch {
    return "referrer";
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const landingFiredRef = useRef(false);

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    const url =
      window.location.origin +
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  useEffect(() => {
    if (landingFiredRef.current) return;
    if (typeof window === "undefined") return;
    if (!pathname) return;
    const match = pathname.match(LANDING_ROOT_RE);
    if (!match) return;
    const lang = isLang(match[1]) ? match[1] : undefined;

    const source = deriveSource(
      searchParams?.get("utm_source"),
      document.referrer,
    );

    landingFiredRef.current = true;
    track({ name: "landing_viewed", props: { lang, source } });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
