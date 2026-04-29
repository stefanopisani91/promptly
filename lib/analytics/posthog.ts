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

type LandingEvent =
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
  | { name: "landing_socialproof_viewed"; props?: Record<string, never> }
  | { name: "landing_faq_opened"; props: { question_index: number } }
  | { name: "landing_closing_cta_viewed"; props?: Record<string, never> }
  | { name: "landing_closing_cta_clicked"; props?: Record<string, never> };

export function track(event: LandingEvent) {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.capture(event.name, event.props ?? {});
}
