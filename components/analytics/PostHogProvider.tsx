"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import {
  hasIubendaAnalyticsConsent,
  initPostHog,
  optOutPostHog,
  track,
} from "@/lib/analytics/posthog";
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
  // PostHog è gated sul consenso iubenda (categoria Misurazione).
  // Finché l'utente non accetta esplicitamente, `ready` resta false e
  // nessun pageview/evento viene catturato. Il banner cookie fa parte
  // del root layout (`app/layout.tsx`).
  const [ready, setReady] = useState(false);
  // Ultimo stato consenso applicato. Evita di chiamare `initPostHog` o
  // `optOutPostHog` ad ogni tick del polling — agiamo SOLO su transizione.
  const lastConsentRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    // Polling continuo del cookie iubenda. Frequenza 1s: latenza
    // accettabile dal click "Accetta tutto" all'attivazione PostHog,
    // costo trascurabile (lettura sincrona di document.cookie).
    // Continua anche dopo la prima scelta per catturare le revoche
    // successive dal pannello "Le tue preferenze".
    const tick = () => {
      if (cancelled) return;
      const consent = hasIubendaAnalyticsConsent();
      if (consent === lastConsentRef.current) return; // nessun cambio → no-op
      lastConsentRef.current = consent;
      if (consent === true) {
        initPostHog();
        setReady(true);
      } else if (consent === false) {
        optOutPostHog();
        setReady(false);
      }
      // consent === null: utente non ha ancora scelto. Nulla da fare,
      // continua il polling.
    };

    tick(); // primo check sincrono (cookie già presente da visita precedente)
    const pollId = setInterval(tick, 1000);

    // Cross-tab sync: se in un'altra tab l'utente cambia preferenza,
    // l'evento `storage` non scatta sui cookie ma scatta su localStorage.
    // Aggiungiamo comunque il listener — costa zero e cattura il caso in
    // cui iubenda salvasse anche su localStorage.
    const onStorage = () => tick();
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      window.removeEventListener("storage", onStorage);
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
