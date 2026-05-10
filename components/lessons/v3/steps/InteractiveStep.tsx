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

// Single source of truth for victory thresholds in the Lucia widget.
// Calibrated 10 May 2026 (BACKLOG URGENTE 1 leva 1): victory was 85,
// which an "honest intermediate" prompt couldn't reach without the
// concept of constraints (taught only in Lez 4). Lowered to 70 so a
// solid Lez-1-level prompt — clear language, all 3 bugs spotted, modest
// constraint awareness — wins. Perfect threshold lowered 95 → 90 to
// match: it's "wow you nailed it", not "you wrote an enterprise spec".
//
// Used by `won`, `handleFinalize.victory`, `pickReaction`, and `bandFor`.
// Never duplicate the literal — import these constants instead.
const LUCIA_VICTORY_THRESHOLD = 70;
const LUCIA_PERFECT_THRESHOLD = 90;

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
    //
    // The four `*Retry` variants fire on attempt 2+ when the user is
    // still in the same band as before — Spark acknowledges the retry
    // ("ancora qui", "stessa cosa di prima") instead of repeating the
    // first-try line verbatim. Coherent + encouraging across attempts.
    vague: string;
    vagueRetry: string;
    photoOnly: string;
    photoOnlyRetry: string;
    twoBugs: string;
    twoBugsRetry: string;
    allBugsLowScore: string;
    allBugsLowScoreRetry: string;
    allBugsHighScore: string;
    finalEncouragePartial: string;
    finalEncourageFull: string;
    secondAttemptHintPhoto: string;
    secondAttemptHintImproved: string;
    thirdAttemptDirect: string;
  };
  // Localised labels for the 4 dimension bars (chiarezza / contesto /
  // obiettivo / protezione). Same IT/EN word in most cases — caller
  // resolves them from the locale.
  dimensionLabels: {
    chiarezza: string;
    contesto: string;
    obiettivo: string;
    protezione: string;
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
        // Persisted from the most recent submit so the Spark line + the
        // 4 dimension bars survive navigation/reload (fix May 2026 —
        // before this, deriveReactionFromResult lossily mapped band →
        // reaction and could silently flip the line on return).
        lastReaction?: string;
        lastEvaluation?: LuciaEvaluation;
      }
    | undefined;
  onComplete: (
    result: InteractiveStepResult,
    extras: {
      finalFixed: FixedBugs;
      lastReaction: string | null;
      lastEvaluation: LuciaEvaluation | null;
    },
  ) => void;
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
  const persistedReaction = state?.lastReaction ?? null;
  const persistedEvaluation = state?.lastEvaluation ?? null;

  const [draft, setDraft] = useState("");
  const [attemptCount, setAttemptCount] = useState(persisted?.attempts ?? 0);
  const [evaluating, setEvaluating] = useState(false);
  const [bestScore, setBestScore] = useState(persisted?.bestScore ?? 0);
  const [fixedBugs, setFixedBugs] = useState<FixedBugs>(persistedFixed);
  const [evaluation, setEvaluation] = useState<LuciaEvaluation | null>(
    persistedEvaluation,
  );
  const [reaction, setReaction] = useState<string | null>(persistedReaction);
  const [showFireworks, setShowFireworks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finishedRef = useRef(Boolean(persisted));
  // Synchronous lock against double-submit. `evaluating` (state) updates
  // asynchronously, so 3 rapid clicks could all pass the early-return
  // guard, fire 3 API calls, and increment attempts 3× in a single
  // intent (real bug observed on 2026-05-09 — user burned 3 attempts in
  // one shot). The ref flips true synchronously inside the click handler
  // so subsequent clicks short-circuit before reaching the API call.
  const submitInFlightRef = useRef(false);

  const exhausted = attemptCount >= MAX_LESSON_ATTEMPTS;
  // "Won" means TRUE victory — all 3 bugs fixed AND a strong prompt
  // (score ≥ LUCIA_VICTORY_THRESHOLD). Same threshold as `victory` in
  // handleFinalize and as the `r.allBugsHighScore` reaction in
  // pickReaction. Without the score gate, a user who simply listed the
  // 3 bugs in a low-quality prompt would still get the "celebrate + lock
  // textarea" treatment even though Spark explicitly told them to retry
  // — bug observed 2026-05-09.
  const won =
    fixedBugs.foto &&
    fixedBugs.overflow &&
    fixedBugs.bottone &&
    bestScore >= LUCIA_VICTORY_THRESHOLD;

  // Spark's bubble line. `reaction` is now hydrated from stepState on
  // mount, so a returning user reads the EXACT line they saw last time
  // (no lossy band-based reconstruction). The deriveReactionFromResult
  // path only fires for legacy persisted state written before the May
  // 2026 fix added lastReaction.
  const sparkLine =
    reaction ??
    deriveReactionFromResult(persisted, strings) ??
    strings.awaitingPrompt;

  const submit = useCallback(async () => {
    // Synchronous lock first — see submitInFlightRef declaration above.
    if (submitInFlightRef.current) return;
    if (evaluating || exhausted || draft.trim().length < 4) return;
    submitInFlightRef.current = true;
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
      // Intentionally NOT clearing the draft (rule "regola di
      // persistenza del testo tra tentativi" in LESSON-GUIDELINES.md
      // §V3): the user's prompt stays in the textarea between attempts
      // so they can edit and re-submit instead of retyping. Same shape
      // as Claudemd / Context / Constraints editors, which already
      // preserve their state via useState + sessionStorage.
      submitInFlightRef.current = false;
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
  // surface the final CTA. Click always persists the latest snapshot
  // (covers retries-on-return that wouldn't otherwise update lastReaction
  // / lastEvaluation in stepState) and advances to the next step.
  function handleFinalize() {
    const fixedFlags = [fixedBugs.foto, fixedBugs.overflow, fixedBugs.bottone];
    const fixedCount = fixedFlags.filter(Boolean).length;
    const band = bandFor(bestScore, fixedCount);
    // xp_by_band is required for the lucia_prompt_loop widget — the loader
    // rejects a JSON without it. The optional type is a courtesy to the
    // claudemd_editor widget, which uses xp_by_case instead.
    const xpEarned = step.xp_by_band?.[band] ?? 0;
    onComplete(
      {
        attempts: attemptCount,
        bestScore,
        victory: fixedCount === 3 && bestScore >= LUCIA_VICTORY_THRESHOLD,
        band,
        xpEarned,
      },
      {
        finalFixed: fixedBugs,
        lastReaction: reaction,
        lastEvaluation: evaluation,
      },
    );
    finishedRef.current = true;
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
                {evaluation && (
                  <DimensionBars
                    evaluation={evaluation}
                    labels={strings.dimensionLabels}
                  />
                )}
              </div>
            </div>

            {/* Textarea + submit stay visible until the user wins or
                burns through all 3 attempts. Returning users with a
                persisted result (but who haven't won + haven't
                exhausted) keep the textarea so they can spend their
                remaining tries — fixes the "forced to click avanti"
                report from May 2026. The "Continua" CTA always sits
                next to it (showFinalCta), so they can also stop early. */}
            {!won && !exhausted && (
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
  if (fixedCount === 3 && bestScore >= LUCIA_PERFECT_THRESHOLD) return "perfect";
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
  // Attempt 2+ → user is on a retry. Spark acknowledges that ("you're
  // still on the same problem") instead of replaying the first-try line.
  // Reaction shape stays band-driven; the retry flag flips to a sibling
  // string for the same band when one exists.
  const isRetry = attemptNumber > 1;
  const bugCount = ev.bugs_menzionati.length;

  // Victory: same line for any attempt (the celebration is identical).
  if (ev.totale >= LUCIA_VICTORY_THRESHOLD && bugCount === 3) return r.allBugsHighScore;

  // Last attempt with low coverage → direct reveal.
  if (isLast && bugCount <= 1) return r.thirdAttemptDirect;

  // Retry-aware band: pick the *Retry sibling when the user is back for round 2+.
  if (isRetry) {
    if (bugCount === 3) return r.allBugsLowScoreRetry;
    if (bugCount === 2) return r.twoBugsRetry;
    if (bugCount === 1) return r.photoOnlyRetry;
    return r.vagueRetry;
  }

  // First attempt — original lines.
  if (bugCount === 3) return r.allBugsLowScore;
  if (bugCount === 2) return r.twoBugs;
  if (bugCount === 1) return r.photoOnly;
  return r.vague;
}

// ─── Dimension bars ──────────────────────────────────────────────────
//
// Visual parity with the constraints / context / claudemd editors —
// 4 horizontal bars showing chiarezza / contesto / obiettivo / protezione
// (each 0-100). The total below sums the weighted score the API
// already returned so the user sees both the breakdown and the headline.
function DimensionBars({
  evaluation,
  labels,
}: {
  evaluation: LuciaEvaluation;
  labels: InteractiveStepStrings["dimensionLabels"];
}) {
  const dims: Array<{ key: keyof typeof labels; value: number }> = [
    { key: "chiarezza", value: evaluation.chiarezza },
    { key: "contesto", value: evaluation.contesto },
    { key: "obiettivo", value: evaluation.obiettivo },
    { key: "protezione", value: evaluation.protezione },
  ];
  return (
    <div className="mt-3 flex flex-col gap-1">
      {dims.map((d) => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {labels[d.key]}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, Math.max(0, d.value))}%` }}
            />
          </div>
          <span className="w-7 text-right font-mono text-[10px] text-text-muted">
            {d.value}
          </span>
        </div>
      ))}
      <p className="mt-1 text-right font-mono text-[10px] text-text-muted">
        Σ {evaluation.totale}/100
      </p>
    </div>
  );
}
