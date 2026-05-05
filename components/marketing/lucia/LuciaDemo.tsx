"use client";

// Orchestrator for the Lucia landing demo. Holds all the cross-card state
// (phase, current evaluation, fix state for the homepage, attempt counter,
// victory lock) and wires the API call. Both the homepage card (left) and
// the prompt panel (right) are presentational and driven by props.
//
// State flow:
//   1. User types in the editor → click "valuta prompt"
//   2. We POST to /api/landing-evaluate with the prompt
//   3. On success: derive (fixedBugs, victory, messageKey) via the pure
//      decision matrix in lib/landing-demo/types.ts, drive both cards
//   4. Victory (>= 85 with all 3 bugs) locks in the "all fixed" state in
//      sessionStorage so a refresh keeps the trophy
//   5. localStorage tracks attempts across the page lifetime; after 3,
//      the editor surfaces a soft CTA; after 4, the button is disabled

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DemoOutcome,
  FixedBugs,
  LuciaDemoCopy,
  LuciaEvaluation,
} from "@/lib/landing-demo/types";
import { NO_BUGS_FIXED, deriveOutcome } from "@/lib/landing-demo/types";
import type { Lang, SparkState } from "@/types";
import { Spark } from "@/components/lessons/v3/Spark";
import { LuciaHomepage } from "./LuciaHomepage";
import { LuciaConsole } from "./LuciaConsole";
import {
  LuciaPromptPanel,
  type PanelPhase,
} from "./LuciaPromptPanel";
import { Fireworks } from "../Fireworks";

const LS_ATTEMPTS_KEY = "lucia_demo_attempts_v1";
const SS_VICTORY_KEY = "lucia_demo_victory_v1";
const SS_FIXED_KEY = "lucia_demo_fixed_v1";

const FREE_ATTEMPTS = 3; // attempts 1-3 normal, 4 shows soft CTA, 5+ disabled
const HARD_LIMIT = 4;

// Cinematic stagger for fresh victory: photo → overflow → button → fireworks → card.
const STAGGER_OVERFLOW_MS = 600;
const STAGGER_BUTTON_MS = 1200;
const FIREWORKS_DELAY_MS = 1900;
const FIREWORKS_DURATION_MS = 4500;
const FINAL_CARD_DELAY_MS = 2700;

interface Props {
  copy: LuciaDemoCopy;
  lang: Lang;
}

export function LuciaDemo({ copy, lang }: Props) {
  const [phase, setPhase] = useState<PanelPhase>("editing");
  const [evaluation, setEvaluation] = useState<LuciaEvaluation | null>(null);
  const [outcome, setOutcome] = useState<DemoOutcome | null>(null);
  const [fixedBugs, setFixedBugs] = useState<FixedBugs>(NO_BUGS_FIXED);
  const [victoryLocked, setVictoryLocked] = useState(false);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showFinalCard, setShowFinalCard] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const animTimeoutsRef = useRef<number[]>([]);

  const clearAnimTimeouts = useCallback(() => {
    for (const t of animTimeoutsRef.current) window.clearTimeout(t);
    animTimeoutsRef.current = [];
  }, []);

  // Restore persisted state on mount.
  useEffect(() => {
    mountedRef.current = true;
    try {
      const stored = window.localStorage.getItem(LS_ATTEMPTS_KEY);
      if (stored) {
        const n = Number(stored);
        if (Number.isFinite(n) && n >= 0 && n < 999) setAttemptCount(n);
      }
      const won = window.sessionStorage.getItem(SS_VICTORY_KEY);
      if (won === "1") {
        setVictoryLocked(true);
        setFixedBugs({ foto: true, overflow: true, bottone: true });
      } else {
        const fixedRaw = window.sessionStorage.getItem(SS_FIXED_KEY);
        if (fixedRaw) {
          try {
            const parsed = JSON.parse(fixedRaw) as Partial<FixedBugs>;
            setFixedBugs({
              foto: parsed.foto === true,
              overflow: parsed.overflow === true,
              bottone: parsed.bottone === true,
            });
          } catch {
            /* ignore corrupted state */
          }
        }
      }
    } catch {
      /* localStorage unavailable — session-only mode */
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      for (const t of animTimeoutsRef.current) window.clearTimeout(t);
      animTimeoutsRef.current = [];
    };
  }, []);

  const persistFixed = useCallback((next: FixedBugs, victory: boolean) => {
    try {
      window.sessionStorage.setItem(SS_FIXED_KEY, JSON.stringify(next));
      if (victory) window.sessionStorage.setItem(SS_VICTORY_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const persistAttempts = useCallback((n: number) => {
    try {
      window.localStorage.setItem(LS_ATTEMPTS_KEY, String(n));
    } catch {
      /* ignore */
    }
  }, []);

  const handleEvaluate = useCallback(
    async (prompt: string) => {
      // Hard cap — never even hit the API past this.
      if (attemptCount >= HARD_LIMIT) return;

      abortRef.current?.abort();
      clearAnimTimeouts();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setPhase("evaluating");
      setErrorMessage(null);
      setShowFireworks(false);
      setShowFinalCard(false);

      let res: Response;
      try {
        res = await fetch("/api/landing-evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
          signal: ctrl.signal,
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (!mountedRef.current) return;
        setErrorMessage(copy.errors.network);
        setPhase("editing");
        return;
      }

      if (ctrl.signal.aborted || !mountedRef.current) return;

      if (!res.ok) {
        let errKey = "generic" as keyof LuciaDemoCopy["errors"];
        if (res.status === 429) errKey = "rateLimit";
        else if (res.status === 413) errKey = "tooLong";
        else if (res.status === 400) errKey = "invalidPrompt";
        else if (res.status === 502 || res.status === 503)
          errKey = "network";
        setErrorMessage(copy.errors[errKey]);
        setPhase("editing");
        return;
      }

      let data: { evaluation?: LuciaEvaluation };
      try {
        data = (await res.json()) as { evaluation?: LuciaEvaluation };
      } catch {
        if (!mountedRef.current) return;
        setErrorMessage(copy.errors.generic);
        setPhase("editing");
        return;
      }

      if (!data.evaluation) {
        setErrorMessage(copy.errors.generic);
        setPhase("editing");
        return;
      }

      const ev = data.evaluation;
      const next = deriveOutcome(ev.totale, ev.bugs_menzionati);

      // If a previous victory is locked, keep all bugs fixed regardless of
      // this attempt's outcome (the trophy persists for the session).
      const renderedFixed: FixedBugs = victoryLocked
        ? { foto: true, overflow: true, bottone: true }
        : next.fixed;

      setEvaluation(ev);
      setOutcome(next);
      const becameVictory = next.victory && !victoryLocked;

      if (next.victory) setVictoryLocked(true);
      persistFixed(renderedFixed, next.victory || victoryLocked);

      const newCount = attemptCount + 1;
      setAttemptCount(newCount);
      persistAttempts(newCount);

      setPhase("result");

      if (becameVictory) {
        // Cinematic stagger: photo first, then overflow, then button.
        // Each individual transition still uses its own CSS timing, so the
        // staggered state changes produce the layered "wave" the blueprint asks for.
        setFixedBugs({ foto: true, overflow: false, bottone: false });
        const tOverflow = window.setTimeout(() => {
          if (mountedRef.current) {
            setFixedBugs({ foto: true, overflow: true, bottone: false });
          }
        }, STAGGER_OVERFLOW_MS);
        const tButton = window.setTimeout(() => {
          if (mountedRef.current) {
            setFixedBugs({ foto: true, overflow: true, bottone: true });
          }
        }, STAGGER_BUTTON_MS);
        const tFireworks = window.setTimeout(() => {
          if (mountedRef.current) setShowFireworks(true);
        }, FIREWORKS_DELAY_MS);
        const tFireworksStop = window.setTimeout(() => {
          if (mountedRef.current) setShowFireworks(false);
        }, FIREWORKS_DELAY_MS + FIREWORKS_DURATION_MS);
        const tCard = window.setTimeout(() => {
          if (mountedRef.current) setShowFinalCard(true);
        }, FINAL_CARD_DELAY_MS);
        animTimeoutsRef.current.push(
          tOverflow,
          tButton,
          tFireworks,
          tFireworksStop,
          tCard,
        );
      } else {
        // Non-victory or repeat-victory: just apply the new fix state.
        setFixedBugs(renderedFixed);
        if (next.victory && victoryLocked) {
          setShowFinalCard(true);
        }
      }
    },
    [
      attemptCount,
      clearAnimTimeouts,
      copy.errors,
      persistAttempts,
      persistFixed,
      victoryLocked,
    ],
  );

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    clearAnimTimeouts();
    if (evaluation) setPrevScore(evaluation.totale);
    setEvaluation(null);
    setOutcome(null);
    setErrorMessage(null);
    setShowFireworks(false);
    setShowFinalCard(false);
    if (attemptCount >= HARD_LIMIT) {
      setPhase("limit");
    } else {
      setPhase("editing");
    }
    // Note: fixedBugs intentionally NOT reset — homepage keeps its current
    // state (or stays victory-locked) until the next evaluation.
  }, [attemptCount, clearAnimTimeouts, evaluation]);

  // If the user lands at limit straight from a previous session, surface
  // the limit screen on first entry to editing phase.
  useEffect(() => {
    if (phase === "editing" && attemptCount >= HARD_LIMIT) {
      setPhase("limit");
    }
  }, [phase, attemptCount]);

  const evaluateDisabledReason: "limit" | null =
    attemptCount >= HARD_LIMIT ? "limit" : null;

  // Soft warning when entering the 4th attempt's editing phase (i.e. we've
  // already done 3 evaluations and we're showing the editor again).
  const showSoftLimitWarning =
    phase === "editing" && attemptCount === FREE_ATTEMPTS;

  const message = phase === "result" ? buildMessage(copy, outcome, evaluation) : null;

  // Spark narrator — drives mascot state + bubble copy from the same demo
  // phases the rest of the UI reacts to. Kept declarative so it stays
  // readable as we add more outcomes.
  const sparkNarration = resolveSparkNarration(
    copy.spark,
    phase,
    outcome,
    attemptCount,
    victoryLocked,
  );

  return (
    <section
      id="prompt-evaluator"
      aria-labelledby="lucia-demo-title"
      className="relative py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        {/* Spark narrator — mobile-first: Spark on top, bubble below.
            Desktop: same stack but slightly larger. The bubble has a
            tail pointing up to Spark and uses the same "thought-bubble"
            language as inside the lesson view (italic, surface card). */}
        <div className="mb-6 flex flex-col items-center gap-2.5">
          <Spark
            state={sparkNarration.state}
            size={56}
            ariaLabel={copy.spark.label}
          />
          <p
            role="status"
            aria-live="polite"
            className="relative max-w-xs rounded-2xl border border-border bg-surface px-4 py-2 text-sm italic leading-snug text-text-secondary shadow-sm sm:max-w-sm sm:text-base"
          >
            <span
              aria-hidden
              className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-border bg-surface"
            />
            {sparkNarration.message}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-text-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-tool-accent">
          {copy.badge}
        </div>
        <h2
          id="lucia-demo-title"
          className="mt-4 font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl"
        >
          {copy.title}
          <br />
          <em className="not-italic text-primary-deep">{copy.titleEm}</em>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-text-secondary sm:text-lg">
          {copy.subtitle}
        </p>
      </div>

      <div className="relative mx-auto mt-10 grid max-w-5xl grid-cols-1 items-center gap-5 px-4 sm:px-6 md:grid-cols-2">
        {/* LEFT — UNIFIED vignette: browser address bar + cream site preview
            on top + dark console below, all inside ONE card with a single
            lime border-left running top to bottom (Cursor / VS Code feel). */}
        <div
          aria-label={copy.homepage.addressBar}
          style={{
            background: "var(--tool-bg)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.10)",
            borderLeft: `4px solid ${
              victoryLocked
                ? "var(--tool-accent-victory)"
                : "var(--tool-accent-bright)"
            }`,
            display: "flex",
            flexDirection: "column",
            transition: "border-color 0.6s",
          }}
        >
          <BrowserChrome address={copy.homepage.addressBar} />
          {/* Preview area — cream cartoon site */}
          <div style={{ background: "#F8F5F0", flex: "0 0 auto" }}>
            <LuciaHomepage copy={copy.homepage} fixed={fixedBugs} />
          </div>
          {/* Thin divider between preview and console */}
          <div
            aria-hidden
            style={{
              height: 1,
              background: "rgba(255, 255, 255, 0.1)",
            }}
          />
          {/* Console area — dark mono, only the 2 error lines */}
          <LuciaConsole copy={copy.console} />
        </div>

        {/* RIGHT COLUMN — V3 editor / result panel: dark, square corners,
            orange border-left so the eye reads it as the user's tool
            (Promptly's side of the conversation). */}
        {phase === "limit" ? (
          <LimitPanel copy={copy} lang={lang} />
        ) : (
          <div style={{ position: "relative" }}>
            {showSoftLimitWarning && (
              <div
                role="status"
                style={{
                  position: "absolute",
                  top: -36,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: "0.72rem",
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                }}
              >
                {copy.messages.limitTitle}
              </div>
            )}
            <LuciaPromptPanel
              copy={copy}
              phase={phase}
              evaluation={evaluation}
              prevScore={prevScore}
              errorMessage={errorMessage}
              onEvaluate={handleEvaluate}
              onReset={handleReset}
              evaluateDisabledReason={evaluateDisabledReason}
            />
          </div>
        )}

        {/* Fireworks overlay covers the full demo grid for cinematic effect */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <Fireworks active={showFireworks} />
        </div>
      </div>

      {/* GDPR + AI Act inline disclosure — always visible, sits right under
          the demo cards. Tiny but mandatory: tells the user that the prompt
          goes to OpenAI and not to include personal data, per Art. 13 GDPR. */}
      <p className="mx-auto mt-5 max-w-3xl px-4 text-center text-xs text-text-muted sm:px-6">
        {copy.disclosure.text}{" "}
        <a
          href={`/${lang}/privacy`}
          className="underline decoration-dotted underline-offset-2 hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.disclosure.linkLabel}
        </a>
        .
      </p>

      {/* Below-the-demo: dynamic message OR final CTA card */}
      <div className="mx-auto mt-6 max-w-3xl px-4 sm:px-6">
        {showFinalCard && evaluation ? (
          <FinalCard copy={copy} lang={lang} score={evaluation.totale} />
        ) : message ? (
          <p
            role="status"
            className="text-center text-base text-text-secondary sm:text-lg"
            style={{
              opacity: 0,
              animation: "lucia-fade-in 0.5s ease-out 0.2s forwards",
            }}
          >
            {message}
          </p>
        ) : (
          <p className="text-center text-sm text-text-muted">
            {copy.footer}
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes lucia-fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BrowserChrome({ address }: { address: string }) {
  // Round 5: replace the old "Code editor — index.html" label with a real
  // browser-style address pill. macOS dots stay on the left; the pill sits
  // slightly left of centre (Safari/Chrome pattern). No padlock, no https://.
  return (
    <div
      style={{
        background: "#1a1a1a",
        padding: "0.55rem 0.95rem",
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        borderBottom: "1px solid var(--tool-divider-soft)",
      }}
    >
      <div style={{ display: "flex", gap: "0.4rem", flex: "0 0 auto" }}>
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: "var(--macos-red)",
          }}
        />
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: "var(--macos-yellow)",
          }}
        />
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: "var(--macos-green)",
          }}
        />
      </div>
      <div
        style={{
          flex: "0 1 320px",
          maxWidth: "60%",
          padding: "6px 16px",
          background: "#faf7f2",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: 999,
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: 12,
          color: "#444444",
          textAlign: "center",
          lineHeight: 1.2,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {address}
      </div>
    </div>
  );
}

function FinalCard({
  copy,
  lang,
  score,
}: {
  copy: LuciaDemoCopy;
  lang: Lang;
  score: number;
}) {
  return (
    <div
      role="region"
      aria-label="Demo complete"
      className="mx-auto rounded-2xl border bg-surface px-6 py-7 text-center shadow-sm"
      style={{
        borderColor: "var(--border)",
        opacity: 0,
        animation: "lucia-fade-in 0.5s ease-out forwards",
      }}
    >
      <p className="font-heading text-xl font-bold text-text-primary sm:text-2xl">
        {copy.messages.scoreHighAllTitle.replace("{score}", String(score))}
      </p>
      <p className="mx-auto mt-2 max-w-xl text-base text-text-secondary">
        {copy.messages.scoreHighAllSub}
      </p>
      <a
        href={`/${lang}/signup`}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {copy.messages.ctaFinal}
      </a>
    </div>
  );
}

function LimitPanel({
  copy,
  lang,
}: {
  copy: LuciaDemoCopy;
  lang: Lang;
}) {
  return (
    <div
      role="region"
      aria-label={copy.messages.limitTitle}
      style={{
        background: "var(--tool-bg-result)",
        borderRadius: "12px",
        boxShadow: "6px 6px 0 var(--tool-bg)",
        border: "2px solid var(--tool-bg)",
        padding: "2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "420px",
        gap: "0.85rem",
      }}
    >
      <p
        className="font-heading"
        style={{
          color: "#ffffff",
          fontSize: "1.5rem",
          fontWeight: 700,
          margin: 0,
        }}
      >
        {copy.messages.limitTitle}
      </p>
      <p
        style={{
          color: "var(--tool-text)",
          fontSize: "0.95rem",
          lineHeight: 1.55,
          margin: 0,
          maxWidth: 360,
        }}
      >
        {copy.messages.limitSub}
      </p>
      <a
        href={`/${lang}/signup`}
        style={{
          marginTop: "0.6rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--primary)",
          color: "#ffffff",
          padding: "0.7rem 1.4rem",
          borderRadius: "999px",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "0.92rem",
          boxShadow: "0 0 18px rgba(232, 112, 63, 0.4)",
        }}
      >
        {copy.messages.limitCta}
      </a>
    </div>
  );
}

// Spark narrator — translates (phase, outcome, attemptCount) into the
// mascot state + the line she says above the demo. Pure function, no
// effects, no DOM. Matches the rule from PROMPTLY.md: Spark must always
// have a state defined for every UI moment.
function resolveSparkNarration(
  spark: LuciaDemoCopy["spark"],
  phase: PanelPhase,
  outcome: DemoOutcome | null,
  attemptCount: number,
  victoryLocked: boolean,
): { state: SparkState; message: string } {
  if (phase === "limit") {
    return { state: "sad", message: spark.limit };
  }
  if (phase === "evaluating") {
    return { state: "thinking", message: spark.thinking };
  }
  if (phase === "result" && outcome) {
    if (outcome.victory) {
      return { state: "happy", message: spark.victory };
    }
    if (outcome.messageKey === "scoreLow") {
      return { state: "sad", message: spark.low };
    }
    return { state: "idle", message: spark.partial };
  }
  // Default editing state — Spark is patient and watching.
  // After at least one attempt without victory she stays in "listening"
  // mode (leaning forward) to communicate continuity.
  if (attemptCount > 0 && !victoryLocked) {
    return { state: "listening", message: spark.partial };
  }
  return { state: "idle", message: spark.intro };
}

function buildMessage(
  copy: LuciaDemoCopy,
  outcome: DemoOutcome | null,
  evaluation: LuciaEvaluation | null,
): string | null {
  if (!outcome || !evaluation) return null;
  const m = copy.messages;
  switch (outcome.messageKey) {
    case "scoreLow":
      return m.scoreLow;
    case "scoreMidOnePhotoOnly":
      return m.scoreMidOnePhotoOnly;
    case "scoreMidPartialOneLeft":
      return m.scoreMidPartialOneLeft;
    case "scoreMidAllBugs":
      return m.scoreMidAllBugs;
    case "scoreHighPartial":
      return m.scoreHighPartial.replace(
        "{count}",
        String(outcome.missedCount),
      );
    case "scoreHighAll":
      // Final card replaces this — return null so we render the card alone.
      return null;
  }
}
