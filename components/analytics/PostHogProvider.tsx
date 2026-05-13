"use client";

import { useEffect, useRef, useState } from "react";
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
  // PostHog (~90KB gzipped) viene inizializzato DOPO il first paint via
  // requestIdleCallback — così non compete con le risorse critiche della
  // landing. Fallback a setTimeout(2500ms) per Safari < 22 e simili.
  // I pageview e gli eventi `landing_*` partono solo quando `ready` è true.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      if (cancelled) return;
      initPostHog();
      setReady(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout: 3000 });
    } else {
      timeoutId = setTimeout(run, 2500);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!pathname) return;
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    const url =
      window.location.origin +
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [ready, pathname, searchParams]);

  useEffect(() => {
    if (!ready) return;
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
  }, [ready, pathname, searchParams]);

  return <>{children}</>;
}
