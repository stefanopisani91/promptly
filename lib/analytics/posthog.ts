"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });
  initialized = true;
}

// Iubenda — Cookie Solution: gating del consenso analytics.
//
// IL WIDGET DI PROMPTLY (account learnpromptly.app, embed
// 1004186d-e370-4a88-b653-8472d85bab0d) usa il mapping custom:
//   1 = Necessarie · 2 = Funzionalità · 4 = Misurazione
// Notare che NON c'è una categoria con id `3` — il widget salta
// quel numero. La default iubenda invece sarebbe 1/2/3/4/5 con
// Misurazione=3. Verifica empirica: il cookie `_iub_cs-*` salvato
// dopo "Accetta tutto" contiene `"purposes":{"1":true,"2":true,"4":true}`.
const IUBENDA_MEASUREMENT_PURPOSE = 4;

type IubendaCookieValue = {
  timestamp?: string;
  version?: string;
  purposes?: Record<string, boolean>;
  id?: number;
};

/**
 * Stato del consenso analytics secondo iubenda.
 * - `true`  → consenso esplicito per la categoria Misurazione (o, se la
 *             categoria non esiste nel widget, almeno un altro purpose true)
 * - `false` → preferenza espressa con Misurazione disattivata
 * - `null`  → utente non ha ancora scelto (nessun cookie `_iub_cs-*`)
 *
 * Implementazione: leggiamo direttamente il cookie `_iub_cs-*` invece di
 * chiamare `_iub.cs.api.isConsentGiven()`. Motivo: in iubenda v2 quell'API
 * ritorna `false` anche PRIMA che l'utente abbia scelto, indistinguibile
 * da un rifiuto esplicito. Il cookie invece esiste **solo** dopo una scelta
 * dell'utente — è quindi una source of truth più affidabile per il gating.
 */
export function hasIubendaAnalyticsConsent(): boolean | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  const cookies = document.cookie.split("; ");
  const csCookie = cookies.find((c) => c.startsWith("_iub_cs-"));
  if (!csCookie) return null;
  try {
    const eqIdx = csCookie.indexOf("=");
    const raw = decodeURIComponent(csCookie.substring(eqIdx + 1));
    const parsed = JSON.parse(raw) as IubendaCookieValue;
    const purposes = parsed?.purposes;
    if (!purposes || typeof purposes !== "object") return null;
    // Cerca prima la categoria Misurazione esplicita.
    const measurement =
      purposes[IUBENDA_MEASUREMENT_PURPOSE] ??
      purposes[String(IUBENDA_MEASUREMENT_PURPOSE)];
    if (typeof measurement === "boolean") return measurement;
    // Fallback: se la categoria Misurazione non esiste nel widget,
    // consideriamo consenso analytics dato quando almeno una categoria
    // non-necessaria è true (= utente ha "accettato qualcosa", non solo
    // rifiutato tutto).
    const nonNecessary = Object.entries(purposes).filter(
      ([k]) => k !== "1",
    );
    if (nonNecessary.length === 0) return false;
    return nonNecessary.some(([, v]) => v === true);
  } catch {
    return null;
  }
}

/**
 * Disattiva PostHog quando l'utente revoca il consenso. Sicuro da
 * chiamare anche se PostHog non è ancora inizializzato (no-op).
 */
export function optOutPostHog() {
  if (typeof window === "undefined" || !initialized) return;
  try {
    posthog.opt_out_capturing();
    posthog.reset();
  } catch {
    // posthog può throware se non completamente inizializzato — ignoriamo.
  }
}

type AppEvent =
  // Landing
  | { name: "landing_viewed"; props?: { lang?: string; source?: string } }
  | { name: "landing_hero_viewed"; props?: Record<string, never> }
  | {
      name: "landing_hero_cta_clicked";
      props: { cta: "primary" | "secondary" };
    }
  | { name: "landing_lang_switched"; props: { from: string; to: string } }
  | { name: "landing_exercise_started"; props?: Record<string, never> }
  | {
      name: "landing_exercise_attempt";
      props: { attempt_n: number; correct: boolean };
    }
  | {
      name: "landing_exercise_hint_used";
      props: { hint_level: 1 | 2 | 3 };
    }
  | {
      name: "landing_exercise_completed";
      props: { attempts_used: number; hints_used: 0 | 1 | 2 | 3 };
    }
  | { name: "landing_exercise_cta_clicked"; props?: Record<string, never> }
  | { name: "landing_meet_spark_viewed"; props?: Record<string, never> }
  | { name: "landing_tools_viewed"; props?: Record<string, never> }
  | {
      name: "landing_tool_clicked";
      props: {
        tool_slug:
          | "cursor"
          | "claude-code"
          | "windsurf"
          | "copilot"
          | "bolt"
          | "v0";
      };
    }
  | { name: "landing_faq_opened"; props: { question_index: number } }
  | { name: "landing_closing_cta_viewed"; props?: Record<string, never> }
  | { name: "landing_closing_cta_clicked"; props?: Record<string, never> }
  // Referral (Dashboard V2 — Phase 2)
  | { name: "referral_link_activated"; props: { first_time: boolean } }
  | {
      name: "referral_link_copied";
      props: { source: "clipboard" | "share_api" };
    }
  | { name: "referral_converted"; props: { xp_awarded: number } }
  | { name: "referral_path_y_unlocked"; props?: Record<string, never> }
  // Spark Helper — contextual tutor inside V3 quick-win widgets.
  // `widget` is the quick-win widget key (e.g. "broken_session_debugger").
  | { name: "spark_helper_opened"; props: { widget: string; lesson_id: string } }
  | {
      name: "spark_helper_suggestion_clicked";
      props: { widget: string; suggestion_index: number };
    }
  | {
      name: "spark_helper_message_sent";
      props: { widget: string; from_suggestion: boolean };
    }
  | {
      name: "spark_helper_quota_hit";
      props: { widget: string; scope: "quick_win" | "daily" };
    }
  // Server-flagged: the learner asked for a project-fitted example and
  // Spark's reply didn't cite the project. Heuristic — see
  // app/api/spark-helper/route.ts. Used to monitor BUG 2 regressions.
  | {
      name: "spark_helper_missed_personalization";
      props: { widget: string; lesson_id: string };
    };

// Kept as a deprecated alias so any external imports keep compiling.
// Prefer `AppEvent` going forward.
export type LandingEvent = AppEvent;

export function track(event: AppEvent) {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.capture(event.name, event.props ?? {});
}
