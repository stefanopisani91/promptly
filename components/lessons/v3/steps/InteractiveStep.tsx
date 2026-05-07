"use client";

// INTERACTIVE step — for Lesson 1, the only widget is the Lucia prompt loop.
// It reuses LuciaHomepage + LuciaConsole from the landing demo, but swaps
// the cyber-style prompt panel for a chat-like Spark dialogue. Up to 3
// attempts, attempts are scoped to this lesson session (NOT localStorage),
// and Spark's reactions are pre-written locally to keep tone consistent
// and avoid extra LLM round-trips.

import { useCallback, useRef, useState } from "react";
import { Send } from "lucide-react";
import type {
  InteractiveStep as InteractiveStepType,
} from "@/types";
import type { FixedBugs, LuciaEvaluation } from "@/lib/landing-demo/types";
import { NO_BUGS_FIXED, deriveOutcome } from "@/lib/landing-demo/types";
import { LuciaHomepage } from "@/components/marketing/lucia/LuciaHomepage";
import { LuciaConsole } from "@/components/marketing/lucia/LuciaConsole";
import { Fireworks } from "@/components/marketing/Fireworks";
import { Spark } from "../Spark";
import { StepCard } from "../StepCard";

export interface InteractiveStepStrings {
  hint: string; // helper line under the textarea
  attemptCounterTemplate: string; // "Tentativo {current} / {max}"
  placeholder: string;
  submitCta: string;
  submitting: string;
  retryCta: string;
  finalCta: string;
  networkError: string;
  rateLimitError: string;
  apiError: string;
  // Spark's idle line when no evaluation has run yet (or memory was lost
  // after a page reload while the persisted result is still around).
  awaitingPrompt: string;
  reactions: {
    // Reactions Spark fires depending on outcome + attempt number. Same
    // labels in both languages — caller picks IT or EN.
    vague: string;
    photoOnly: string;
    twoBugs: string;
    allBugsLowScore: string;
    allBugsHighScore: string;
    finalEncouragePartial: string;
    finalEncourageFull: string;
    secondAttemptHintPhoto: string;
    secondAttemptHintImproved: string;
    thirdAttemptDirect: string;
  };
  homepageCopy: import("@/lib/landing-demo/types").LuciaDemoCopy["homepage"];
  consoleCopy: import("@/lib/landing-demo/types").LuciaDemoCopy["console"];
  // Mobile-only tab labels — desktop renders both panels side by side.
  sparkTabLabel: string;
  siteTabLabel: string;
}

const MAX_LESSON_ATTEMPTS = 3;

export interface InteractiveStepResult {
  attempts: number;
  bestScore: number;
  victory: boolean;
  band: "poor" | "one_bug" | "two_bugs" | "all_bugs" | "perfect";
  xpEarned: number;
}

interface Props {
  step: InteractiveStepType;
  strings: InteractiveStepStrings;
  state:
    | {
        result?: InteractiveStepResult;
        finalFixed?: FixedBugs;
      }
    | undefined;
  onComplete: (result: InteractiveStepResult, finalFixed: FixedBugs) => void;
  // Called after the user clicks the final "Continua" button. The container
  // moves to the next step. Separated from onComplete so that re-entering
  // an already-finalised step still advances on click instead of stalling
  // (the finishedRef guards onComplete from running twice).
  onAdvance: () => void;
}

export function InteractiveStep({
  step,
  strings,
  state,
  onComplete,
  onAdvance,
}: Props) {
  const persisted = state?.result;
  const persistedFixed = state?.finalFixed ?? NO_BUGS_FIXED;

  const [draft, setDraft] = useState("");
  const [attemptCount, setAttemptCount] = useState(persisted?.attempts ?? 0);
  const [evaluating, setEvaluating] = useState(false);
  const [bestScore, setBestScore] = useState(persisted?.bestScore ?? 0);
  const [fixedBugs, setFixedBugs] = useState<FixedBugs>(persistedFixed);
  const [evaluation, setEvaluation] = useState<LuciaEvaluation | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finishedRef = useRef(Boolean(persisted));

  const exhausted = attemptCount >= MAX_LESSON_ATTEMPTS;
  const won = fixedBugs.foto && fixedBugs.overflow && fixedBugs.bottone;

  // Spark's bubble line. `reaction` is in-memory only — when the user
  // returns to a finalised step we fall back to a line derived from the
  // persisted result (band-based) so the panel never reads as empty.
  const sparkLine = reaction ?? deriveReactionFromResult(persisted, strings) ??
    strings.awaitingPrompt;

  const submit = useCallback(async () => {
    if (evaluating || exhausted || draft.trim().length < 4) return;
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch("/api/landing-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: draft }),
      });
      if (!res.ok) {
        if (res.status === 429) setError(strings.rateLimitError);
        else if (res.status === 502 || res.status === 503)
          setError(strings.networkError);
        else setError(strings.apiError);
        setEvaluating(false);
        return;
      }
      const body = (await res.json()) as { evaluation?: LuciaEvaluation };
      if (!body.evaluation) {
        setError(strings.apiError);
        setEvaluating(false);
        return;
      }
      const ev = body.evaluation;
      const next = deriveOutcome(ev.totale, ev.bugs_menzionati);
      setEvaluation(ev);

      // Always merge in newly fixed bugs — don't undo earlier fixes if the
      // new attempt mentioned fewer bugs.
      setFixedBugs((prev) => ({
        foto: prev.foto || next.fixed.foto,
        overflow: prev.overflow || next.fixed.overflow,
        bottone: prev.bottone || next.fixed.bottone,
      }));

      const newAttempt = attemptCount + 1;
      setAttemptCount(newAttempt);
      const newBest = Math.max(bestScore, ev.totale);
      setBestScore(newBest);

      setReaction(
        pickReaction(ev, newAttempt, MAX_LESSON_ATTEMPTS, strings),
      );

      if (next.victory) {
        setShowFireworks(true);
        window.setTimeout(() => setShowFireworks(false), 4500);
      }
    } catch {
      setError(strings.networkError);
    } finally {
      setEvaluating(false);
      setDraft("");
    }
  }, [
    evaluating,
    exhausted,
    draft,
    attemptCount,
    bestScore,
    strings,
  ]);

  // When the user has reached the end (won, exhausted attempts, or both),
  // surface the final CTA. Click does two things: persist the result the
  // first time around (idempotent on subsequent visits via finishedRef)
  // AND always advance to the next step — so a returning user who already
  // finalised the step doesn't stall on a no-op button.
  function handleFinalize() {
    if (!finishedRef.current) {
      finishedRef.current = true;
      const fixedFlags = [
        fixedBugs.foto,
        fixedBugs.overflow,
        fixedBugs.bottone,
      ];
      const fixedCount = fixedFlags.filter(Boolean).length;
      const band = bandFor(bestScore, fixedCount);
      const xpEarned = step.xp_by_band[band];
      onComplete(
        {
          attempts: attemptCount,
          bestScore,
          victory: fixedCount === 3 && bestScore >= 85,
          band,
          xpEarned,
        },
        fixedBugs,
      );
    }
    onAdvance();
  }

  const counter = strings.attemptCounterTemplate
    .replace("{current}", String(Math.min(attemptCount + 1, MAX_LESSON_ATTEMPTS)))
    .replace("{max}", String(MAX_LESSON_ATTEMPTS));

  // Final CTA visible when the run is over (won/exhausted) OR after at
  // least one attempt — so the user can stop after a partial fix without
  // burning all 3 tries. Plain "skip without trying" is intentionally not
  // offered: the exercise has to be attempted at least once.
  const showFinalCta = won || exhausted || attemptCount >= 1 || Boolean(persisted);
  const isPartialStop = !won && !exhausted && attemptCount >= 1;

  return (
    <StepCard wide>
      <div className="flex flex-col gap-5">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}

        {/* Side-by-side on tablet+ (≥ md), stacked on phone. Breakpoint and
            container width match the landing's LuciaDemoSection so the
            homepage + console keep their natural proportions instead of
            getting squashed. */}
        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
          style={{ position: "relative" }}
        >
          {/* LEFT — homepage + console (reused from the landing demo). */}
          <div
            className="flex"
            style={{
              background: "#0A0A0A",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              borderLeft: `4px solid ${won ? "#00C853" : "#9FFF00"}`,
              transition: "border-color 0.6s",
              flexDirection: "column",
            }}
          >
            <div
              aria-hidden
              style={{
                background: "#1A1A1A",
                padding: "0.55rem 0.95rem",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                borderBottom: "1px solid #2A2A2A",
              }}
            >
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <span style={dot("#FF5F57")} />
                <span style={dot("#FEBC2E")} />
                <span style={dot("#28C840")} />
              </div>
              <div
                style={{
                  flex: "0 1 320px",
                  padding: "6px 16px",
                  background: "#FAF7F2",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 999,
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 12,
                  color: "#444444",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {strings.homepageCopy.addressBar}
              </div>
            </div>
            <div style={{ background: "#F8F5F0" }}>
              <LuciaHomepage copy={strings.homepageCopy} fixed={fixedBugs} />
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
            <LuciaConsole copy={strings.consoleCopy} />
          </div>

          {/* RIGHT — Spark dialogue panel. */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Spark
                state={
                  won
                    ? "happy"
                    : reaction
                    ? evaluation && evaluation.totale < 41
                      ? "thinking"
                      : "listening"
                    : "idle"
                }
                size={48}
              />
              <div className="flex-1">
                <p className="eyebrow mb-1 text-primary-deep">spark</p>
                <p className="text-sm italic leading-relaxed text-text-primary">
                  {sparkLine}
                </p>
              </div>
            </div>

            {/* Textarea + submit are visible until the user runs out of
                attempts, wins, or has finalised the step in a previous
                session. Otherwise both the textarea and the "Continua"
                CTA can sit side by side, so the user is never blocked. */}
            {!won && !exhausted && !persisted && (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 1200))}
                  placeholder={strings.placeholder}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-surface-muted/40 p-3 text-base leading-relaxed text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary sm:text-sm"
                  disabled={evaluating}
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-text-muted">{counter}</span>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={evaluating || draft.trim().length < 4}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                  >
                    {evaluating ? strings.submitting : strings.submitCta}
                    {!evaluating && <Send size={14} />}
                  </button>
                </div>
                <p className="text-[11px] italic text-text-muted">
                  {strings.hint}
                </p>
                {error && (
                  <div
                    className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-3 py-2"
                    role="status"
                  >
                    <Spark state="sad" size={28} />
                    <p className="text-xs leading-relaxed text-text-primary">
                      {error}
                    </p>
                  </div>
                )}
              </>
            )}

            {showFinalCta && (
              <button
                type="button"
                onClick={handleFinalize}
                className={`mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
                  isPartialStop
                    ? "border border-border bg-surface text-text-primary hover:bg-surface-muted"
                    : "bg-primary text-white hover:bg-primary-hover"
                }`}
              >
                {strings.finalCta}
              </button>
            )}
          </div>

          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <Fireworks active={showFireworks} />
          </div>
        </div>
      </div>
    </StepCard>
  );
}

function dot(color: string): React.CSSProperties {
  return { width: 11, height: 11, borderRadius: "50%", background: color };
}

function bandFor(
  bestScore: number,
  fixedCount: number,
): "poor" | "one_bug" | "two_bugs" | "all_bugs" | "perfect" {
  if (fixedCount === 3 && bestScore >= 95) return "perfect";
  if (fixedCount === 3) return "all_bugs";
  if (fixedCount === 2) return "two_bugs";
  if (fixedCount === 1) return "one_bug";
  return "poor";
}

function deriveReactionFromResult(
  result: InteractiveStepResult | undefined,
  strings: InteractiveStepStrings,
): string | null {
  if (!result) return null;
  const r = strings.reactions;
  switch (result.band) {
    case "perfect":
    case "all_bugs":
      return r.allBugsHighScore;
    case "two_bugs":
      return r.twoBugs;
    case "one_bug":
      return r.photoOnly;
    case "poor":
      return r.thirdAttemptDirect;
  }
}

function pickReaction(
  ev: LuciaEvaluation,
  attemptNumber: number,
  maxAttempts: number,
  strings: InteractiveStepStrings,
): string {
  const r = strings.reactions;
  const isLast = attemptNumber >= maxAttempts;
  const bugCount = ev.bugs_menzionati.length;

  if (ev.totale >= 85 && bugCount === 3) return r.allBugsHighScore;
  if (bugCount === 3) return r.allBugsLowScore;
  if (bugCount === 2) return r.twoBugs;
  if (bugCount === 1) return r.photoOnly;
  if (isLast) return r.thirdAttemptDirect;
  if (attemptNumber === 2) return r.secondAttemptHintImproved;
  return r.vague;
}
