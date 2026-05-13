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
