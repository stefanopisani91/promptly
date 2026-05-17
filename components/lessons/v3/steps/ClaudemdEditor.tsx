"use client";

// CLAUDEMD_EDITOR — interactive widget for Lesson 2.
//
// Flow (Lezione2_Blueprint.md §13):
//   1. The user picks one of three project archetypes (e-commerce / habits /
//      website). The choice seeds the editor heading and is sent to the
//      evaluator so the rubric can grade specificity in context.
//   2. The user fills 4 fixed `## …` sections with free-text. We enforce a
//      total min/max char budget and surface a live counter.
//   3. On submit we call /api/lesson-claudemd-evaluate with the project key
//      and the editor body. The route runs Haiku 4.5 with a calibrated
//      system prompt (per-tool, per-experience-level personalisation lives
//      server-side) and returns a feedback case + score per dimension.
//   4. Spark reacts inline. Vague drafts trigger an editor shake; partials
//      a flash of the border; an "excellent" verdict fires confetti and (at
//      score ≥ 95) a fireworks burst from both sides.
//   5. The user has 3 attempts. After the third, or after an "excellent"
//      verdict, the final CTA persists the result and advances.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import confetti from "canvas-confetti";
import type {
  ClaudemdEditorConfig,
  ClaudemdSectionKind,
  InteractiveStep as InteractiveStepType,
} from "@/types";
import { SparkSphere } from "@/components/promptly/SparkSphere";
import { StepCard } from "../StepCard";
import { fireConfetti } from "@/lib/confetti";
import type { InteractiveStepResult } from "./InteractiveStep";
import {
  OptionCardSelector,
  type OptionCardItem,
} from "./OptionCardSelector";
import {
  SectionAccordion,
  type AccordionSectionDef,
} from "./SectionAccordion";

export type ClaudemdFeedbackCase =
  | "vague"
  | "partial_basics"
  | "missing_workflow"
  | "generic_complete"
  | "excellent";

export type ClaudemdDimension =
  | "clarity"
  | "specificity"
  | "rules"
  | "workflow";

export interface ClaudemdEvaluation {
  scores: {
    clarity: number;
    specificity: number;
    rules: number;
    workflow: number;
  };
  total: number;
  strongest_dimension: ClaudemdDimension;
  weakest_dimension: ClaudemdDimension;
  feedback_case: ClaudemdFeedbackCase;
  spark_reply: string;
}

export interface ClaudemdEditorStrings {
  intro: string;
  // Shown under the disabled submit button so the user knows why it's
  // locked. {min}/{max} = the total-user-content bounds; {current} = the
  // live total across the 4 sections.
  pickProjectHint: string;
  minLengthHint: string;
  maxLengthHint: string;
  selectProjectLabel: string;
  selectedLabel: string;
  sectionPlaceholderHint: string;
  charCounterTemplate: string; // "{current} / {max}" — per-section counter
  // Variant used by the unified bottom-of-editor counter. Same {current}
  // / {max} placeholders, different copy (e.g. "totali" / "total") so the
  // user reads it as the global character budget.
  totalCharCounterTemplate: string;
  attemptCounterTemplate: string; // "Tentativo {current} / {max}"
  // Strings for the SectionAccordion children — kept inside the editor
  // strings bundle so the i18n table stays in one place per lesson.
  sectionFilledBadgeText: string;
  sectionFilledBadgeAriaLabel: string;
  // Dynamic placeholders for the "stack" and "rules" sections, keyed by
  // the project the user picks. Pre-resolved for the active locale by
  // page.tsx so this component stays language-agnostic. Falls back to
  // the static `placeholder` from the JSON when the project is null or
  // when a section's `kind` is something else.
  sectionPlaceholdersByProject: {
    stack: Record<string, string>;
    rules: Record<string, string>;
  };
  submitCta: string;
  submitting: string;
  retryCta: string;
  finalCta: string;
  awaitingPrompt: string;
  outOfAttempts: string;
  networkError: string;
  apiError: string;
  rateLimitError: string;
  invalidInputError: string;
  dailyQuotaExhausted: string;
  // Mobile-only tab labels (desktop renders the editor and Spark side by side).
  editorTabLabel: string;
  sparkTabLabel: string;
}

interface Props {
  step: InteractiveStepType;
  // Authenticated user id, used to scope the sessionStorage draft so two
  // users on the same browser/device don't see each other's work.
  userId: string;
  strings: ClaudemdEditorStrings;
  state:
    | {
        result?: InteractiveStepResult;
        editorText?: string;
        selectedProject?: string;
        // Persisted from the last submit so Spark's reply + the 4
        // dimension bars survive navigation/reload (rule #3 in
        // LESSON-GUIDELINES.md §V3 — same as InteractiveStep /
        // BrokenSessionDebugger).
        lastEvaluation?: ClaudemdEvaluation;
      }
    | undefined;
  onComplete: (
    result: InteractiveStepResult,
    extras: {
      editorText: string;
      selectedProject: string;
      lastEvaluation: ClaudemdEvaluation | null;
    },
  ) => void;
  onAdvance: () => void;
}

const MIN_DRAFT_CHARS = 30;

export function ClaudemdEditor({
  step,
  userId,
  strings,
  state,
  onComplete,
  onAdvance,
}: Props) {
  const config = step.claudemd_config!;
  const persisted = state?.result;
  const finishedRef = useRef(Boolean(persisted));

  const [selectedProject, setSelectedProject] = useState<string | null>(
    state?.selectedProject ?? null,
  );

  // Per-section content. Hydrated in priority order:
  //   1. sessionStorage (intra-tab edits the user hasn't submitted yet)
  //   2. persisted stepState (returning user — only the composed editorText
  //      is there, so we decompose it back into sections by heading)
  //   3. empty
  // The accordion is the source of truth for live edits; we autosave to
  // sessionStorage on every keystroke.
  // Per-user, per-step key. Without the userId prefix, two users on the
  // same browser/device would see each other's draft. The previous
  // unscoped format (`claudemd:${step.id}`) is intentionally NOT migrated
  // — it stays orphaned in sessionStorage and disappears at tab close.
  const sessionStorageKey = `claudemd:${userId}:${step.id}`;
  const [sectionContent, setSectionContent] = useState<Record<string, string>>(
    () => hydrateSectionContent(config, state?.editorText, sessionStorageKey),
  );

  const [attemptCount, setAttemptCount] = useState(persisted?.attempts ?? 0);
  const [bestScore, setBestScore] = useState(persisted?.bestScore ?? 0);
  // Hydrated from stepState so a returning user reads the exact reply +
  // dimension bars they saw last time (instead of "awaiting your prompt").
  const [evaluation, setEvaluation] = useState<ClaudemdEvaluation | null>(
    state?.lastEvaluation ?? null,
  );
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorEffect, setEditorEffect] = useState<
    "shake" | "flashAmber" | "flashYellow" | "glowGreen" | null
  >(null);
  // True once the server says we've spent today's daily budget. Locks the
  // submit button so the user can't keep banging on it; they can still
  // press the final CTA to stop where they are.
  const [dailyExhausted, setDailyExhausted] = useState(false);
  // Synchronous lock against double-submit. Same fix as the Lucia widget
  // and the constraints / context editors (2026-05-09): React `evaluating`
  // updates async, so 3 fast clicks could pass the guard and burn 3
  // attempts at once.
  const submitInFlightRef = useRef(false);
  const sparkLine = evaluation?.spark_reply ??
    deriveSparkLineFromBand(persisted, strings) ??
    strings.awaitingPrompt;

  const exhausted = attemptCount >= step.max_attempts;
  // Guard: require both the feedback_case AND a total >= 75 before locking
  // the editor. The server now enforces this server-side (total derived from
  // clamped individual scores, feedback_case downgraded when inconsistent),
  // but this client-side check is a belt-and-suspenders defence against
  // stale clients that cache an older API response shape.
  const won =
    evaluation?.feedback_case === "excellent" &&
    (evaluation?.total ?? 0) >= 75;

  // Map the JSON's `projects[]` (with the legacy `key` field) into the
  // generic OptionCardItem shape the reusable selector consumes. Memoised
  // so the selector doesn't re-mount its idle-pulse on every render.
  const projectOptions: OptionCardItem[] = useMemo(
    () =>
      config.projects.map((p) => ({
        id: p.key,
        icon: p.icon,
        title: p.title,
        shortTitle: p.short_title,
        description: p.description,
      })),
    [config.projects],
  );

  // Map the JSON's `sections[]` (label + placeholder + optional kind)
  // into the generic AccordionSectionDef the reusable accordion consumes.
  // Two transformations happen here:
  //   1. We synthesize a stable id per index so sectionContent[id] keeps
  //      working across renders without depending on label text.
  //   2. For sections whose `kind` is "stack" or "rules", and only when
  //      the user has picked a project, we override the static JSON
  //      placeholder with the project-specific copy from the i18n bundle.
  //      Sections without a kind (or with a different kind) keep their
  //      static placeholder unchanged.
  const accordionSections: AccordionSectionDef[] = useMemo(
    () =>
      config.sections.map((s, i) => {
        const dynamicPlaceholder = resolveDynamicPlaceholder(
          s.kind,
          selectedProject,
          strings.sectionPlaceholdersByProject,
        );
        const placeholder = dynamicPlaceholder ?? s.placeholder;
        return {
          id: sectionIdFor(i),
          title: s.label,
          // Description (the faded line under the heading) stays static —
          // it's the "what is this section about" hint, not the example.
          description: s.placeholder,
          // The textarea placeholder is what the brief actually wants
          // swapped per project.
          placeholder,
        };
      }),
    [config.sections, selectedProject, strings.sectionPlaceholdersByProject],
  );

  // Reset editor effect after its CSS animation completes so a second
  // attempt of the same case can re-trigger it.
  useEffect(() => {
    if (!editorEffect) return;
    const t = window.setTimeout(() => setEditorEffect(null), 1100);
    return () => window.clearTimeout(t);
  }, [editorEffect]);

  // Compose the CLAUDE.md body from the per-section state. Each non-empty
  // section becomes `## Title\n<text>`; empty sections still emit the
  // heading so the rubric scores their dimension as zero (intentional —
  // gives the user explicit feedback on missing pieces).
  const composedBody = useMemo(
    () => composeClaudemdBody(accordionSections, sectionContent),
    [accordionSections, sectionContent],
  );
  const trimmed = composedBody.trim();
  // The headings alone are ~120 chars, so we can't gate on composedBody
  // length. Sum the trimmed user content across sections and require at
  // least MIN_DRAFT_CHARS of *real* input before the submit unlocks.
  const userContentLength = useMemo(
    () =>
      Object.values(sectionContent).reduce(
        (sum, txt) => sum + txt.trim().length,
        0,
      ),
    [sectionContent],
  );
  const submitDisabled =
    evaluating ||
    !selectedProject ||
    userContentLength < MIN_DRAFT_CHARS ||
    userContentLength > config.max_chars ||
    exhausted ||
    won ||
    dailyExhausted;

  // When the submit button is locked for a *fixable* reason (no project,
  // content too short / too long), say so under it — the button alone gave
  // the user no idea why it wouldn't click. null when it's enabled or
  // locked for a non-text reason (evaluating, daily cap, attempts done,
  // already won — each has its own messaging).
  const submitHint =
    evaluating || won || exhausted || dailyExhausted || !submitDisabled
      ? null
      : !selectedProject
      ? strings.pickProjectHint
      : userContentLength < MIN_DRAFT_CHARS
      ? strings.minLengthHint
          .replace("{min}", String(MIN_DRAFT_CHARS))
          .replace("{current}", String(userContentLength))
      : userContentLength > config.max_chars
      ? strings.maxLengthHint.replace("{max}", String(config.max_chars))
      : null;

  // Unified footer counter — shows total *user* characters across the 4
  // sections (excluding the auto-generated `## Heading` lines) against
  // the JSON-configured cap. The colour band on the surrounding span
  // (text-amber when within 100 of the cap, text-red over the cap)
  // signals the warning visually; the wrapping aria-live="polite"
  // announces the value to assistive tech.
  const counter = strings.totalCharCounterTemplate
    .replace("{current}", String(userContentLength))
    .replace("{max}", String(config.max_chars));

  // Autosave per-section content + open-section index to sessionStorage so
  // the user doesn't lose work on tab refresh / step navigation. Skipped
  // on SSR (storage doesn't exist) and when the run is finalised (no
  // further edits expected).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (finishedRef.current) return;
    try {
      window.sessionStorage.setItem(
        sessionStorageKey,
        JSON.stringify(sectionContent),
      );
    } catch {
      /* sessionStorage may be disabled (private mode) — silent skip */
    }
  }, [sectionContent, sessionStorageKey]);

  const handleSectionChange = useCallback(
    (sectionId: string, content: string) => {
      setSectionContent((prev) =>
        prev[sectionId] === content ? prev : { ...prev, [sectionId]: content },
      );
    },
    [],
  );

  const attemptCounter = strings.attemptCounterTemplate
    .replace("{current}", String(Math.min(attemptCount + 1, step.max_attempts)))
    .replace("{max}", String(step.max_attempts));

  const submit = useCallback(async () => {
    if (submitInFlightRef.current) return;
    if (submitDisabled || !selectedProject) return;
    submitInFlightRef.current = true;
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-claudemd-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: "mindset-02",
          stepId: step.id,
          projectKey: selectedProject,
          editorText: trimmed.slice(0, config.max_chars),
          attempt: attemptCount + 1,
        }),
      });
      if (!res.ok) {
        // Try to parse the body so we can branch on the route's `error`
        // tag. Failures here fall through to the generic apiError.
        let payload: { error?: string; limit?: number; used?: number } = {};
        try {
          payload = (await res.json()) as typeof payload;
        } catch {
          /* keep payload empty */
        }
        if (res.status === 400 && payload.error === "invalid_input") {
          setError(strings.invalidInputError);
        } else if (
          res.status === 403 &&
          payload.error === "daily_quota_exceeded"
        ) {
          setDailyExhausted(true);
          setError(strings.dailyQuotaExhausted);
        } else if (
          res.status === 403 &&
          payload.error === "lesson_attempts_exceeded"
        ) {
          // The server caught a stale state where the client thought it
          // had attempts left. Snap the local counter to the cap so the
          // UI matches and surfaces the "out of attempts" path.
          setAttemptCount(step.max_attempts);
          setError(strings.outOfAttempts);
        } else if (res.status === 429) {
          setError(strings.rateLimitError);
        } else if (res.status === 502 || res.status === 503) {
          setError(strings.networkError);
        } else {
          setError(strings.apiError);
        }
        return;
      }
      const body = (await res.json()) as { evaluation?: ClaudemdEvaluation };
      const ev = body.evaluation;
      if (!ev) {
        setError(strings.apiError);
        return;
      }
      setEvaluation(ev);
      const newAttempt = attemptCount + 1;
      setAttemptCount(newAttempt);
      const newBest = Math.max(bestScore, ev.total);
      setBestScore(newBest);
      // Trigger the editor effect that matches this verdict.
      setEditorEffect(effectForCase(ev.feedback_case));
      if (ev.feedback_case === "excellent") {
        fireConfetti();
        if (ev.total >= 95) {
          fireFireworks();
        }
      }
    } catch {
      setError(strings.networkError);
    } finally {
      setEvaluating(false);
      submitInFlightRef.current = false;
    }
  }, [
    submitDisabled,
    selectedProject,
    trimmed,
    config.max_chars,
    attemptCount,
    bestScore,
    step.id,
    step.max_attempts,
    strings,
  ]);

  function handleFinalize() {
    // Persist the latest snapshot (Spark reply, dimension scores, best
    // score, band, XP) so a retry-on-return actually updates the stored
    // result instead of keeping the first finalisation's stale data.
    // Same approach as InteractiveStep; onComplete → updateStepState is
    // idempotent, so re-firing it is harmless.
    //
    // Gated on `evaluation` so a no-resubmit re-finalisation of legacy
    // persisted state (written before lastEvaluation was tracked, so
    // `evaluation` is null on mount) doesn't clobber a good stored
    // result with a "poor"/0-XP one. selectedProject is always set by
    // the time the final CTA shows.
    if (evaluation && selectedProject) {
      const band = bandForCase(evaluation?.feedback_case ?? null);
      const xpEarned = xpForResult(
        evaluation?.feedback_case ?? null,
        bestScore,
        config,
        attemptCount,
      );
      onComplete(
        {
          attempts: attemptCount,
          bestScore,
          victory: evaluation?.feedback_case === "excellent",
          band,
          xpEarned,
        },
        {
          // Persist the composed CLAUDE.md body so a returning user can
          // see what they wrote. The editor decomposes it back into the
          // 4 sections on next mount via hydrateSectionContent().
          editorText: composedBody,
          selectedProject,
          lastEvaluation: evaluation,
        },
      );
    }
    finishedRef.current = true;
    onAdvance();
  }

  // Show the final CTA once at least one attempt landed, or after the run is
  // over (won/exhausted) — same UX rule as InteractiveStep.
  const showFinalCta =
    won || exhausted || attemptCount >= 1 || Boolean(persisted);
  const isPartialStop = !won && !exhausted && attemptCount >= 1;

  const editorEffectClass =
    editorEffect === "shake"
      ? "claudemd-editor-shake"
      : editorEffect === "flashAmber"
      ? "claudemd-editor-flash-amber"
      : editorEffect === "flashYellow"
      ? "claudemd-editor-flash-yellow"
      : editorEffect === "glowGreen"
      ? "claudemd-editor-glow-green"
      : "";

  return (
    <StepCard wide>
      <div className="flex flex-col gap-5">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}

        <div>
          <p className="eyebrow mb-2 text-text-muted">
            {strings.selectProjectLabel}
          </p>
          <OptionCardSelector
            options={projectOptions}
            selected={selectedProject}
            onSelect={setSelectedProject}
            disabled={won || exhausted}
            ariaLabel={strings.selectProjectLabel}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
          {/* Editor — accordion */}
          <div
            className={`flex flex-col rounded-md border bg-surface ${editorEffectClass}`}
          >
            <div className="border-b border-border bg-surface-muted/40 px-3 py-2">
              <p className="font-mono text-xs text-text-muted">
                CLAUDE.md{selectedProject ? ` — ${labelForProject(config, selectedProject)}` : ""}
              </p>
            </div>
            <SectionAccordion
              sections={accordionSections}
              accumulatedContent={sectionContent}
              onContentChange={handleSectionChange}
              initialOpen={0}
              minCharsForBadge={10}
              maxCharsPerSection={Math.ceil(config.max_chars / 4)}
              showLineNumbers
              showCharCounter={false}
              disabled={evaluating || won || exhausted}
              strings={{
                charCounterTemplate: strings.charCounterTemplate,
                filledBadgeText: strings.sectionFilledBadgeText,
                filledBadgeLabel: strings.sectionFilledBadgeAriaLabel,
              }}
            />
            <div className="border-t border-border bg-surface-muted/20 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span
                  role="status"
                  aria-live="polite"
                  className={`font-mono text-[11px] tabular-nums transition-colors ${
                    userContentLength > config.max_chars
                      ? "text-red-600"
                      : userContentLength > config.max_chars - 100
                      ? "text-amber-600"
                      : "text-text-muted"
                  }`}
                >
                  {counter}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-text-muted">
                  {attemptCounter}
                </span>
              </div>
            </div>
          </div>

          {/* Spark dialogue panel */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <SparkSphere
                state={
                  won
                    ? "happy"
                    : evaluating
                    ? "thinking"
                    : evaluation?.feedback_case === "vague"
                    ? "sad"
                    : evaluation
                    ? "thinking"
                    : "listening"
                }
                size={48}
              />
              <div className="flex-1">
                <p className="eyebrow mb-1 text-primary-deep">spark</p>
                <p className="text-sm italic leading-relaxed text-text-primary">
                  {sparkLine}
                </p>
                {evaluation && (
                  <DimensionBars scores={evaluation.scores} total={evaluation.total} />
                )}
              </div>
            </div>

            {!won && !exhausted && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitDisabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                >
                  {evaluating ? strings.submitting : strings.submitCta}
                  {!evaluating && <Send size={14} />}
                </button>
                {submitHint && (
                  <p className="text-[11px] italic leading-relaxed text-text-muted">
                    {submitHint}
                  </p>
                )}
                {error && (
                  <div
                    className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-3 py-2"
                    role="status"
                  >
                    <SparkSphere state="sad" size={28} />
                    <p className="text-xs leading-relaxed text-text-primary">
                      {error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {exhausted && !won && (
              <p className="text-xs italic text-text-muted">
                {strings.outOfAttempts}
              </p>
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
        </div>
      </div>
    </StepCard>
  );
}

function DimensionBars({
  scores,
  total,
}: {
  scores: ClaudemdEvaluation["scores"];
  total: number;
}) {
  const dims: Array<{ key: ClaudemdDimension; value: number }> = [
    { key: "clarity", value: scores.clarity },
    { key: "specificity", value: scores.specificity },
    { key: "rules", value: scores.rules },
    { key: "workflow", value: scores.workflow },
  ];
  return (
    <div className="mt-3 flex flex-col gap-1">
      {dims.map((d) => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {d.key}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (d.value / 25) * 100)}%` }}
            />
          </div>
          <span className="w-7 text-right font-mono text-[10px] text-text-muted">
            {d.value}
          </span>
        </div>
      ))}
      <p className="mt-1 text-right font-mono text-[10px] text-text-muted">
        Σ {total}/100
      </p>
    </div>
  );
}

function effectForCase(
  c: ClaudemdFeedbackCase,
): "shake" | "flashAmber" | "flashYellow" | "glowGreen" | null {
  switch (c) {
    case "vague":
      return "shake";
    case "partial_basics":
      return "flashAmber";
    case "missing_workflow":
    case "generic_complete":
      return "flashYellow";
    case "excellent":
      return "glowGreen";
    default:
      return null;
  }
}

function bandForCase(
  c: ClaudemdFeedbackCase | null,
): InteractiveStepResult["band"] {
  switch (c) {
    case "vague":
      return "poor";
    case "partial_basics":
      return "one_bug";
    case "missing_workflow":
      return "two_bugs";
    case "generic_complete":
      return "all_bugs";
    case "excellent":
      return "perfect";
    default:
      return "poor";
  }
}

function xpForResult(
  c: ClaudemdFeedbackCase | null,
  bestScore: number,
  config: ClaudemdEditorConfig,
  attempts: number,
): number {
  const xp = config.xp_by_case;
  if (!c) return xp.vague;
  if (c === "excellent") {
    // Score >= 95 is the "perfect" tier — bigger XP, plus a one-shot bonus
    // when nailed on the first attempt.
    const base = bestScore >= 95 ? xp.perfect : xp.excellent;
    return attempts === 1 ? base + 50 : base;
  }
  switch (c) {
    case "vague":
      return xp.vague;
    case "partial_basics":
      return xp.partial_basics;
    case "missing_workflow":
      return xp.missing_workflow;
    case "generic_complete":
      return xp.generic_complete;
  }
}

function deriveSparkLineFromBand(
  result: InteractiveStepResult | undefined,
  strings: ClaudemdEditorStrings,
): string | null {
  if (!result) return null;
  // We don't ship per-band fallback copy yet — once the user finalises the
  // step, the JSON keeps the result and the next visit shows a static intro.
  return strings.awaitingPrompt;
}

function labelForProject(config: ClaudemdEditorConfig, key: string): string {
  return config.projects.find((p) => p.key === key)?.title ?? key;
}

// ─── Per-section helpers (used by the accordion refactor) ────────────

function sectionIdFor(index: number): string {
  // Keep the id orthogonal to the user-visible label so renaming a label
  // doesn't invalidate sessionStorage entries written under the old key.
  return `section-${index}`;
}

/**
 * Pick the placeholder for a section based on its semantic kind and the
 * current project selection. Returns null when no override applies (the
 * caller falls back to the static JSON placeholder).
 */
function resolveDynamicPlaceholder(
  kind: ClaudemdSectionKind | undefined,
  projectKey: string | null,
  byProject: ClaudemdEditorStrings["sectionPlaceholdersByProject"],
): string | null {
  if (!projectKey) return null;
  if (kind === "stack") return byProject.stack[projectKey] ?? null;
  if (kind === "rules") return byProject.rules[projectKey] ?? null;
  return null;
}

/**
 * Compose the CLAUDE.md body from per-section content. Always emits all
 * headings — empty sections still produce `## Heading` so the rubric
 * scores their dimension explicitly (better feedback than silently
 * dropping the section).
 */
function composeClaudemdBody(
  sections: AccordionSectionDef[],
  content: Record<string, string>,
): string {
  return sections
    .map((s) => {
      const body = (content[s.id] ?? "").trim();
      return body.length > 0 ? `## ${s.title}\n${body}` : `## ${s.title}\n`;
    })
    .join("\n\n");
}

/**
 * Build the initial sectionContent map. Priority order:
 *   1. sessionStorage cache (intra-tab edits the user hasn't submitted)
 *   2. previously persisted editorText from stepState (returning user)
 *   3. empty
 * The decomposition step parses the persisted body back into sections by
 * splitting on the `## ` heading lines that compose() always emits.
 */
function hydrateSectionContent(
  config: ClaudemdEditorConfig,
  persistedEditorText: string | undefined,
  sessionStorageKey: string,
): Record<string, string> {
  const empty: Record<string, string> = Object.fromEntries(
    config.sections.map((_, i) => [sectionIdFor(i), ""]),
  );

  if (typeof window !== "undefined") {
    try {
      const cached = window.sessionStorage.getItem(sessionStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, unknown>;
        const out = { ...empty };
        for (const key of Object.keys(empty)) {
          const v = parsed[key];
          if (typeof v === "string") out[key] = v;
        }
        // Only return the cache if at least one section has content,
        // otherwise fall through to the persisted body decomposition.
        if (Object.values(out).some((v) => v.trim().length > 0)) return out;
      }
    } catch {
      /* ignore — corrupt JSON or storage disabled, fall through */
    }
  }

  if (persistedEditorText && persistedEditorText.trim().length > 0) {
    return decomposeClaudemdBody(config, persistedEditorText, empty);
  }
  return empty;
}

/**
 * Best-effort inverse of composeClaudemdBody. Splits on the `## ` heading
 * markers and matches each chunk to the section whose title appears on the
 * first line. Sections we can't match keep their empty default — the user
 * sees their content in the most-likely-correct section, never in the
 * wrong one.
 */
function decomposeClaudemdBody(
  config: ClaudemdEditorConfig,
  body: string,
  empty: Record<string, string>,
): Record<string, string> {
  const out = { ...empty };
  // Split keeping the heading; the first chunk before the first `## ` is
  // discarded (it's typically empty given how compose() builds the body).
  const chunks = body.split(/\n?##\s+/m).filter((c) => c.length > 0);
  for (const chunk of chunks) {
    const newlineAt = chunk.indexOf("\n");
    const heading = (newlineAt >= 0 ? chunk.slice(0, newlineAt) : chunk).trim();
    const text = newlineAt >= 0 ? chunk.slice(newlineAt + 1).trim() : "";
    const matchIndex = config.sections.findIndex(
      (s) => s.label.trim() === heading,
    );
    if (matchIndex >= 0) {
      out[sectionIdFor(matchIndex)] = text;
    }
  }
  return out;
}

function fireFireworks(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const palette = ["#E8703F", "#EAB308", "#16A34A", "#FFF1EB"];
  const burst = () => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: palette,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: palette,
    });
  };
  burst();
  window.setTimeout(burst, 400);
  window.setTimeout(burst, 800);
}
