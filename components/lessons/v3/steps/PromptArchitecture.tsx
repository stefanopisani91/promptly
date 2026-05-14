"use client";

// PROMPT_ARCHITECTURE — interactive widget for Lesson 6 (HERO ASSET).
//
// Tap-to-add ordering puzzle. Four named pillars (CONTEXT /
// CONSTRAINTS / TASK / VERIFICATION) must be placed into a vertical
// column of 4 numbered slots, in the correct sequence. The correct
// order is hard-coded as CORRECT_ORDER below — counter-intuitive:
// constraints come BEFORE the task. On a perfect submit the pillars
// dissolve into a personalised daily prompt the user can copy or
// download as .md.
//
// Mobile-first: the widget used to be a horizontal drag-and-drop,
// which broke on narrow viewports (cards clipping, slots squashed).
// Re-built as tap-to-add (2025-05-14) using the BlockPicker pattern,
// adapted to an ORDERING exercise (no distractors — all 4 pillars
// are always used; the challenge is the sequence).
//
// Hero asset for the landing page: every gradient, shadow, and
// micro-animation is intentional. Treat as a finished component.
//
// Flow (Lezione6_Blueprint §13):
//   1. 4 slots stacked vertically (positions 1-4). Empty on first
//      paint with the position number visible.
//   2. 4 pillars in a 2×2 grid below. Tapping a pillar appends it to
//      the FIRST empty slot top-down. The tapped pillar stays in the
//      grid at 30% opacity, disabled (no reflow).
//   3. Tapping the × on a placed pillar empties that slot (leaves
//      the hole — slot 2 stays slot 2). The pillar re-enables in the
//      grid. Next tap fills the first empty slot top-down.
//   4. When all 4 are placed, "Invia a Spark" enables. On submit:
//      - perfect → fade pillars, typewriter the personalised prompt
//      - partial (2/4 right) → highlight wrong ones in red, pulse,
//        then send misplaced pillars back to the grid after 1.6s
//      - wrong (0-1 right) → blanket pulse, reset all after 1.6s
//   5. After max_attempts attempts we auto-reveal the correct order
//      and run the transformation regardless (small consolation XP).
//   6. The generated prompt is fetched from /api/lesson-architecture-
//      prompt — Haiku takes the user's project_description and
//      returns project-specific CONTEXT / CONSTRAINTS / VERIFICATION
//      blocks. Falls back to a generic skeleton on API failure.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  InteractiveStep as InteractiveStepType,
  PromptArchitecturePillar,
  PromptArchitecturePillarKey,
} from "@/types";
import { Spark } from "../Spark";
import { StepCard } from "../StepCard";
import { fireConfetti } from "@/lib/confetti";
import type { InteractiveStepResult } from "./InteractiveStep";

// ─── Public types ────────────────────────────────────────────────────

export interface GeneratedPromptBlocks {
  context: string;
  constraints: string;
  verification: string;
}

export interface PromptArchitectureStrings {
  attemptCounterTemplate: string;
  awaitingPrompt: string;
  // Spark's contextual hints after a wrong / partial attempt.
  // Indexed by 0-based attempt count (i.e. after attempt N, read
  // index N-1). Length should be `max_attempts - 1` — the last
  // attempt always triggers auto-reveal.
  wrongFeedbacks: string[];
  partialFeedbacks: string[];
  autoReveal: string;
  // Includes a `{tool}` placeholder.
  celebrationTemplate: string;
  sectionLabels: {
    context: string;
    constraints: string;
    task: string;
    verification: string;
  };
  taskPlaceholder: string;
  fallbackBlocks: GeneratedPromptBlocks;
  // CTA on the new manual submit button (replaces the previous
  // auto-evaluate). Disabled until all 4 slots are filled.
  submitCta: string;
  // Subtle helper line under the disabled submit button when not all
  // 4 pillars have been placed yet. Tells the user why the button is
  // locked.
  submitDisabledHint: string;
  // Aria + visible label for the position chip in an empty slot.
  // Includes a `{n}` placeholder for the 1-based position.
  slotEmptyLabelTemplate: string;
  // Aria-label on the × button that empties a filled slot.
  removePlacedLabel: string;
  copyCta: string;
  copiedToast: string;
  downloadCta: string;
  finalCta: string;
  networkError: string;
  apiError: string;
  rateLimitError: string;
  dailyQuotaExhausted: string;
  markdownHeader: string;
  markdownFooter: string;
  filenamePrefix: string;
}

interface PersistedState {
  result?: InteractiveStepResult;
  // Last submitted order (for analytics + redo prefill).
  finalOrder?: PromptArchitecturePillarKey[];
  // Generated prompt — persisted so a returning user re-sees the
  // exact text they got (the API generation is non-deterministic).
  generatedBlocks?: GeneratedPromptBlocks;
}

interface Props {
  step: InteractiveStepType;
  // userId is reserved for future per-user persistence (e.g.
  // sessionStorage drafts). Currently unused — the widget's only
  // persistence is via the parent's stepState.
  userId: string;
  // Display name to slugify into the .md filename. Falls back to the
  // email prefix at the page-level.
  filenameSlug: string;
  // Display string for the user's preferred tool ("Cursor", "Claude
  // Code", ...). Falls back to a generic "il tuo tool" / "your tool"
  // upstream.
  preferredToolDisplay: string;
  strings: PromptArchitectureStrings;
  state: PersistedState | undefined;
  onComplete: (
    result: InteractiveStepResult,
    extras: {
      finalOrder: PromptArchitecturePillarKey[];
      generatedBlocks: GeneratedPromptBlocks;
    },
  ) => void;
  onAdvance: () => void;
}

// ─── Configuration ───────────────────────────────────────────────────

const CORRECT_ORDER: PromptArchitecturePillarKey[] = [
  "context",
  "constraints",
  "task",
  "verification",
];

const PILLAR_PALETTE: Record<
  PromptArchitecturePillarKey,
  {
    cardBg: string;
    cardBorder: string;
    titleColor: string;
    sectionAccent: string;
    headingClass: string;
    // Hex base — used as the solid colour fallback (browsers w/o
    // background-clip: text) and for the highlight line (Mod 3).
    symbolHex: string;
    // Diagonal 135° gradient applied to the symbol via
    // background-clip: text. Two-stop, light → saturated.
    symbolGradient: string;
    // Per-symbol optical scale. The triangle and diamond carry more
    // visual mass than the bullet/square at the same font-size, so we
    // shrink them slightly to keep visually balanced.
    symbolScale: number;
  }
> = {
  context: {
    cardBg: "bg-gradient-to-b from-blue-50 to-white",
    cardBorder: "border-blue-300",
    titleColor: "text-blue-900",
    sectionAccent: "border-l-4 border-blue-400",
    headingClass: "text-blue-800",
    symbolHex: "#3B82F6",
    symbolGradient: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)",
    symbolScale: 1,
  },
  constraints: {
    cardBg: "bg-gradient-to-b from-red-50 to-white",
    cardBorder: "border-red-300",
    titleColor: "text-red-900",
    sectionAccent: "border-l-4 border-red-400",
    headingClass: "text-red-800",
    symbolHex: "#EF4444",
    symbolGradient: "linear-gradient(135deg, #F87171 0%, #DC2626 100%)",
    // Triangle ▲ optically reads ~15% larger than the bullet at the
    // same font-size; shrink to match.
    symbolScale: 0.82,
  },
  task: {
    cardBg: "bg-gradient-to-b from-amber-50 to-white",
    cardBorder: "border-amber-400",
    titleColor: "text-amber-900",
    sectionAccent: "border-l-4 border-amber-500",
    headingClass: "text-amber-800",
    symbolHex: "#F97316",
    symbolGradient: "linear-gradient(135deg, #FBBF24 0%, #EA580C 100%)",
    symbolScale: 0.92,
  },
  verification: {
    cardBg: "bg-gradient-to-b from-emerald-50 to-white",
    cardBorder: "border-emerald-300",
    titleColor: "text-emerald-900",
    sectionAccent: "border-l-4 border-emerald-500",
    headingClass: "text-emerald-800",
    symbolHex: "#10B981",
    symbolGradient: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
    // Diamond ◆ also runs slightly larger optically than the bullet.
    symbolScale: 0.88,
  },
};

// ─── Component ───────────────────────────────────────────────────────

export function PromptArchitecture({
  step,
  // userId is intentionally NOT destructured here. It's part of the
  // Props contract (kept symmetric with the other widget dispatchers
  // in LessonV3View) and reserved for future per-user persistence.
  // Today the widget persists only through the parent's stepState.
  filenameSlug,
  preferredToolDisplay,
  strings,
  state,
  onComplete,
  onAdvance,
}: Props) {
  const config = step.prompt_architecture_config!;
  const persisted = state?.result;
  const finishedRef = useRef(Boolean(persisted));

  // ─── State ─────────────────────────────────────────────────────────

  // Order placed in the column (top → bottom). null entries are empty
  // slots. Length always 4. Hydrates from persisted finalOrder so a
  // returning user sees their last result.
  const [placement, setPlacement] = useState<
    Array<PromptArchitecturePillarKey | null>
  >(() => {
    if (state?.finalOrder && state.finalOrder.length === 4)
      return [...state.finalOrder];
    return [null, null, null, null];
  });

  // Display order of the 2×2 grid. We START with the canonical (non-
  // randomised) order so SSR + client hydrate the same DOM — calling
  // Math.random() during render would mismatch and trigger React's
  // hydration error. We then shuffle once on mount (effect below),
  // and again on every wrong/partial reset.
  const [gridOrder, setGridOrder] = useState<PromptArchitecturePillarKey[]>(
    () => config.pillars.map((p) => p.key),
  );
  useEffect(() => {
    setGridOrder(shuffleKeys(config.pillars.map((p) => p.key)));
    // Intentionally empty deps — shuffle only on mount. Subsequent
    // shuffles are driven by the feedback-reset effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [attemptCount, setAttemptCount] = useState(persisted?.attempts ?? 0);
  const [evaluating, setEvaluating] = useState(false);
  const [revealed, setRevealed] = useState(false); // auto-reveal after max_attempts
  const [error, setError] = useState<string | null>(null);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [generatedBlocks, setGeneratedBlocks] =
    useState<GeneratedPromptBlocks | null>(state?.generatedBlocks ?? null);
  // Pulse colour state for visual feedback on a wrong/partial drop.
  const [feedback, setFeedback] = useState<
    | { kind: "perfect" }
    | { kind: "partial"; correctIndices: Set<number> }
    | { kind: "wrong" }
    | null
  >(persisted?.victory ? { kind: "perfect" } : null);
  const submitInFlightRef = useRef(false);

  const exhausted = attemptCount >= step.max_attempts;
  const allPlaced = placement.every((p) => p !== null);
  const won = feedback?.kind === "perfect";

  const counter = strings.attemptCounterTemplate
    .replace("{current}", String(Math.min(attemptCount + 1, step.max_attempts)))
    .replace("{max}", String(step.max_attempts));

  const sparkLine = useMemo(() => {
    if (won && generatedBlocks) {
      return strings.celebrationTemplate.replace(
        "{tool}",
        preferredToolDisplay,
      );
    }
    if (revealed) return strings.autoReveal;
    // Contextual hint right after a wrong/partial attempt — Spark
    // escalates from vague ("you're close") to specific ("constraints
    // before task") as `attemptCount` grows. The reset effect clears
    // `feedback` to null after 1.6s, at which point we revert to the
    // baseline `awaitingPrompt` line.
    if (feedback?.kind === "wrong" || feedback?.kind === "partial") {
      const arr =
        feedback.kind === "wrong"
          ? strings.wrongFeedbacks
          : strings.partialFeedbacks;
      const idx = Math.min(Math.max(0, attemptCount - 1), arr.length - 1);
      return arr[idx] ?? strings.awaitingPrompt;
    }
    return strings.awaitingPrompt;
  }, [
    won,
    generatedBlocks,
    revealed,
    feedback,
    attemptCount,
    strings,
    preferredToolDisplay,
  ]);

  // ─── Pillar lookup ─────────────────────────────────────────────────

  const pillarByKey = useMemo(() => {
    const m = new Map<PromptArchitecturePillarKey, PromptArchitecturePillar>();
    for (const p of config.pillars) m.set(p.key, p);
    return m;
  }, [config.pillars]);

  const placedSet = useMemo(() => {
    const s = new Set<PromptArchitecturePillarKey>();
    for (const k of placement) if (k !== null) s.add(k);
    return s;
  }, [placement]);

  // ─── Tap handlers ──────────────────────────────────────────────────

  const disabled = evaluating || won || exhausted || revealed;

  const handleTapAvailable = useCallback(
    (key: PromptArchitecturePillarKey) => {
      if (disabled) return;
      if (placedSet.has(key)) return; // already placed — no-op
      setPlacement((prev) => {
        const firstEmpty = prev.findIndex((p) => p === null);
        if (firstEmpty < 0) return prev;
        const next = [...prev];
        next[firstEmpty] = key;
        return next;
      });
    },
    [disabled, placedSet],
  );

  const handleRemovePlaced = useCallback(
    (slotIndex: number) => {
      if (disabled) return;
      // Leaves the hole — slot 2 stays slot 2. The user must tap
      // another pillar to refill it. Predictable + matches the
      // sequence semantics (each slot is positional).
      setPlacement((prev) => {
        if (prev[slotIndex] === null) return prev;
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
    },
    [disabled],
  );

  // ─── Server call to generate the personalised prompt ──────────────
  //
  // Declared BEFORE `evaluate` so the latter can list it as a hook
  // dependency without hitting a temporal-dead-zone error from `tsc`.

  const fetchGeneratedBlocks = useCallback(async (): Promise<
    GeneratedPromptBlocks | null
  > => {
    const res = await fetch("/api/lesson-architecture-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: "mindset-06",
        stepId: step.id,
      }),
    });
    if (!res.ok) {
      let payload: { error?: string } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        /* keep payload empty */
      }
      if (res.status === 403 && payload.error === "daily_quota_exceeded") {
        setError(strings.dailyQuotaExhausted);
      } else if (res.status === 429) {
        setError(strings.rateLimitError);
      } else if (res.status === 502 || res.status === 503) {
        setError(strings.networkError);
      } else {
        setError(strings.apiError);
      }
      return null;
    }
    const body = (await res.json()) as { blocks?: GeneratedPromptBlocks };
    if (!body.blocks) {
      setError(strings.apiError);
      return null;
    }
    return body.blocks;
  }, [step.id, strings]);

  // ─── Submit / evaluation ───────────────────────────────────────────

  const evaluate = useCallback(async () => {
    if (submitInFlightRef.current) return;
    if (!allPlaced || won || exhausted || revealed) return;
    submitInFlightRef.current = true;
    setEvaluating(true);
    setError(null);

    try {
      const order = placement.filter(
        (p): p is PromptArchitecturePillarKey => p !== null,
      );
      const correctIndices = new Set<number>();
      order.forEach((k, i) => {
        if (k === CORRECT_ORDER[i]) correctIndices.add(i);
      });

      const newAttempt = attemptCount + 1;
      setAttemptCount(newAttempt);

      if (correctIndices.size === 4) {
        setFeedback({ kind: "perfect" });
        const blocks = await fetchGeneratedBlocks().catch(() => null);
        const finalBlocks = blocks ?? strings.fallbackBlocks;
        setGeneratedBlocks(finalBlocks);
        fireConfetti();
        return;
      }

      if (correctIndices.size === 2) {
        setFeedback({ kind: "partial", correctIndices });
      } else {
        setFeedback({ kind: "wrong" });
      }

      // If this attempt was the last — auto-reveal.
      if (newAttempt >= step.max_attempts) {
        setRevealed(true);
        setPlacement([...CORRECT_ORDER]);
        setFeedback({ kind: "perfect" });
        const blocks = await fetchGeneratedBlocks().catch(() => null);
        const finalBlocks = blocks ?? strings.fallbackBlocks;
        setGeneratedBlocks(finalBlocks);
        fireConfetti();
      }
    } catch {
      setError(strings.networkError);
    } finally {
      setEvaluating(false);
      submitInFlightRef.current = false;
    }
  }, [
    allPlaced,
    won,
    exhausted,
    revealed,
    placement,
    attemptCount,
    step.max_attempts,
    strings,
    fetchGeneratedBlocks,
  ]);

  // ─── Reset placement after a wrong / partial attempt ──────────────

  // After 1.6s of feedback we send the misplaced pillars back to the
  // grid so the user can try again. Correct positions stay locked.
  // Grid order is re-shuffled at the same time so the user gets a
  // fresh random arrangement and doesn't lean on muscle memory.
  useEffect(() => {
    if (!feedback || feedback.kind === "perfect") return;
    if (revealed || exhausted) return;
    const t = window.setTimeout(() => {
      const correctIdx =
        feedback.kind === "partial"
          ? feedback.correctIndices
          : new Set<number>();
      setPlacement((prev) =>
        prev.map((p, i) => (correctIdx.has(i) ? p : null)),
      );
      setGridOrder(shuffleKeys(config.pillars.map((p) => p.key)));
      setFeedback(null);
    }, 1600);
    return () => window.clearTimeout(t);
  }, [feedback, revealed, exhausted, config.pillars]);

  // ─── Finalize handler (advance to next step) ──────────────────────

  function handleFinalize() {
    if (!finishedRef.current) {
      finishedRef.current = true;
      const finalOrder = placement.filter(
        (p): p is PromptArchitecturePillarKey => p !== null,
      );
      const xpEarned = xpForResult(won, attemptCount, revealed);
      onComplete(
        {
          attempts: attemptCount,
          bestScore: won ? 100 : 0,
          victory: won,
          band: won
            ? attemptCount === 1
              ? "perfect"
              : "all_bugs"
            : "poor",
          xpEarned,
        },
        {
          finalOrder,
          generatedBlocks: generatedBlocks ?? strings.fallbackBlocks,
        },
      );
    }
    onAdvance();
  }

  const showFinalCta = won || exhausted || revealed;
  // Only the manual submit reaches the "send" state — it's the user's
  // explicit moment of commitment. Disabled until all 4 are placed.
  const submitDisabled = disabled || !allPlaced;

  // ─── Render ────────────────────────────────────────────────────────

  // `medium` (max-w-4xl) — the layout is intentionally a single
  // narrow column even on desktop so the slots-then-grid reading
  // order stays clear. `wide` (max-w-5xl) left the content floating
  // in too much side space without improving readability.
  return (
    <StepCard medium>
      <div className="flex flex-col gap-6">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}

        <div className="flex flex-col gap-5 rounded-3xl border-2 border-orange-200/70 bg-stone-50 p-4 sm:p-6">
          {/* Museum-quality headline. Serif 2xl + italic stone-500
              sub. Preserved from the drag-and-drop predecessor. */}
          <div className="flex flex-col items-center gap-2 pb-1 pt-1 text-center">
            <h2 className="prompt-arch-title-serif text-2xl uppercase text-stone-700 sm:text-3xl">
              {config.canvas_title}
            </h2>
            <p className="text-sm italic text-stone-500 sm:text-base">
              {config.canvas_subtitle}
            </p>
          </div>

          {/* SLOTS COLUMN — always 4, numbered. Filled slots animate
              in via Framer Motion; empty slots show the position
              number prominently so the user reads the column as a
              numbered sequence (the whole point of the exercise). */}
          {!won && !revealed && (
            <SlotsColumn
              placement={placement}
              pillarByKey={pillarByKey}
              feedback={feedback}
              disabled={disabled}
              strings={strings}
              onRemove={handleRemovePlaced}
            />
          )}

          {/* GENERATED PROMPT — slides in after a perfect submit (or
              after an auto-reveal). Replaces the slots column. */}
          <AnimatePresence>
            {won && generatedBlocks && (
              <GeneratedPrompt
                blocks={generatedBlocks}
                strings={strings}
                filenameSlug={filenameSlug}
                copyToastVisible={copyToastVisible}
                setCopyToastVisible={setCopyToastVisible}
              />
            )}
          </AnimatePresence>

          {/* PILLARS 2×2 — placed pillars stay rendered at 30%
              opacity disabled (instead of being filtered out) so the
              grid never reflows and the user reads it as a tally of
              "still to place / already placed". */}
          {!won && !revealed && (
            <PillarsGrid
              pillars={gridOrder
                .map((k) => pillarByKey.get(k))
                .filter((p): p is PromptArchitecturePillar => Boolean(p))}
              placedSet={placedSet}
              disabled={disabled}
              feedback={feedback}
              label={config.pillars_tray_label}
              onTap={handleTapAvailable}
            />
          )}

          <p className="text-right font-mono text-[11px] tabular-nums text-text-muted">
            {counter}
          </p>
        </div>

        {/* Spark dialogue + submit/finalize CTA */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Spark
              state={
                won ? "happy" : evaluating ? "thinking" : "listening"
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

          {!won && !revealed && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={evaluate}
                disabled={submitDisabled}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
              >
                {strings.submitCta}
                {!evaluating && <Send size={14} aria-hidden="true" />}
              </button>
              {!allPlaced && !disabled && (
                <p className="text-[11px] italic leading-relaxed text-text-muted">
                  {strings.submitDisabledHint}
                </p>
              )}
            </div>
          )}

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

          {showFinalCta && (
            <button
              type="button"
              onClick={handleFinalize}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
            >
              {strings.finalCta}
            </button>
          )}
        </div>
      </div>
    </StepCard>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function SlotsColumn({
  placement,
  pillarByKey,
  feedback,
  disabled,
  strings,
  onRemove,
}: {
  placement: Array<PromptArchitecturePillarKey | null>;
  pillarByKey: Map<PromptArchitecturePillarKey, PromptArchitecturePillar>;
  feedback:
    | { kind: "perfect" }
    | { kind: "partial"; correctIndices: Set<number> }
    | { kind: "wrong" }
    | null;
  disabled: boolean;
  strings: PromptArchitectureStrings;
  onRemove: (index: number) => void;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {placement.map((key, i) => (
        <Slot
          key={i}
          index={i}
          pillarKey={key}
          pillarByKey={pillarByKey}
          feedback={feedback}
          disabled={disabled}
          strings={strings}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}

function Slot({
  index,
  pillarKey,
  pillarByKey,
  feedback,
  disabled,
  strings,
  onRemove,
}: {
  index: number;
  pillarKey: PromptArchitecturePillarKey | null;
  pillarByKey: Map<PromptArchitecturePillarKey, PromptArchitecturePillar>;
  feedback:
    | { kind: "perfect" }
    | { kind: "partial"; correctIndices: Set<number> }
    | { kind: "wrong" }
    | null;
  disabled: boolean;
  strings: PromptArchitectureStrings;
  onRemove: (index: number) => void;
}) {
  const position = index + 1;
  const emptyLabel = strings.slotEmptyLabelTemplate.replace(
    "{n}",
    String(position),
  );

  if (!pillarKey) {
    return (
      <li>
        <div
          aria-label={emptyLabel}
          className="flex min-h-[68px] items-center gap-3 rounded-xl border-2 border-dashed border-stone-300/80 bg-white/40 px-3 py-2 sm:min-h-[80px] sm:gap-4 sm:px-4 sm:py-3"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 font-mono text-sm font-semibold text-stone-500 sm:h-9 sm:w-9"
          >
            {position}
          </span>
          <p className="text-xs italic text-stone-400 sm:text-sm">
            {emptyLabel}
          </p>
        </div>
      </li>
    );
  }

  const pillar = pillarByKey.get(pillarKey);
  if (!pillar) return null;
  const palette = PILLAR_PALETTE[pillarKey];

  const correctIdx =
    feedback?.kind === "partial" ? feedback.correctIndices : null;
  const isCorrect = correctIdx?.has(index);
  const isWrong =
    feedback?.kind === "wrong" ||
    (correctIdx !== null && correctIdx !== undefined && !isCorrect);
  const isPerfect = feedback?.kind === "perfect";

  const ringClass = isCorrect || isPerfect
    ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-stone-50"
    : isWrong
      ? "prompt-arch-pillar-pulse-wrong"
      : "";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div
        // CSS var consumed by .prompt-arch-pillar::before for the
        // top-edge highlight. React types don't know about custom
        // properties, hence the cast.
        style={
          {
            ["--highlight-color" as string]: palette.symbolHex,
          } as React.CSSProperties
        }
        className={`prompt-arch-pillar flex min-h-[68px] items-center gap-3 rounded-xl border-2 px-3 py-2 sm:min-h-[80px] sm:gap-4 sm:px-4 sm:py-3 ${palette.cardBg} ${palette.cardBorder} ${ringClass}`}
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 font-mono text-sm font-semibold text-stone-700 sm:h-9 sm:w-9"
        >
          {position}
        </span>
        <span
          className="prompt-arch-symbol shrink-0 leading-none"
          style={{
            // See PillarTile below for the longhand-vs-shorthand
            // explanation. Same gradient + text-clip trick, just at a
            // smaller font-size for the inline slot context.
            color: palette.symbolHex,
            backgroundImage: palette.symbolGradient,
            fontSize: `${Math.round(34 * palette.symbolScale)}px`,
          }}
        >
          {pillar.icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={`font-mono text-[11px] font-bold uppercase tracking-[0.14em] sm:text-[12px] ${palette.titleColor}`}
          >
            {pillar.title}
          </span>
          <span className="truncate text-[11px] italic text-stone-500 sm:text-[12px]">
            {pillar.description}
          </span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={strings.removePlacedLabel}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-white/70 hover:text-stone-800"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </motion.li>
  );
}

function PillarsGrid({
  pillars,
  placedSet,
  disabled,
  feedback,
  label,
  onTap,
}: {
  pillars: PromptArchitecturePillar[];
  placedSet: Set<PromptArchitecturePillarKey>;
  disabled: boolean;
  feedback:
    | { kind: "perfect" }
    | { kind: "partial"; correctIndices: Set<number> }
    | { kind: "wrong" }
    | null;
  label: string;
  onTap: (key: PromptArchitecturePillarKey) => void;
}) {
  // `auto-rows-fr` + `h-full` on the children pins all four tiles to
  // the same height even when their descriptions wrap to different
  // line counts. Same trick as BlockPicker's 2-column pool.
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white/60 p-3 sm:p-4">
      <h3 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 sm:text-sm">
        {label}
      </h3>
      <ul className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3">
        {pillars.map((p) => {
          const isPlaced = placedSet.has(p.key);
          return (
            <li key={p.key} className="h-full">
              <PillarTile
                pillar={p}
                isPlaced={isPlaced}
                disabled={disabled || isPlaced}
                feedback={feedback}
                onTap={onTap}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PillarTile({
  pillar,
  isPlaced,
  disabled,
  feedback,
  onTap,
}: {
  pillar: PromptArchitecturePillar;
  isPlaced: boolean;
  disabled: boolean;
  feedback:
    | { kind: "perfect" }
    | { kind: "partial"; correctIndices: Set<number> }
    | { kind: "wrong" }
    | null;
  onTap: (key: PromptArchitecturePillarKey) => void;
}) {
  const palette = PILLAR_PALETTE[pillar.key];
  // A placed tile sits at 30% opacity and ignores clicks. Visual cue
  // that the pillar is "used" without removing it from the grid (no
  // reflow). Tapping the × in the slot above re-enables it.
  const placedClass = isPlaced
    ? "opacity-30 grayscale-[20%] cursor-not-allowed"
    : "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]";

  // Mid-feedback we suppress the hover lift so the page doesn't feel
  // janky while the reset is being scheduled.
  const interactiveClass = feedback ? "" : placedClass;

  return (
    <button
      type="button"
      onClick={() => onTap(pillar.key)}
      disabled={disabled}
      aria-label={`${pillar.title} — ${pillar.description}`}
      aria-pressed={isPlaced}
      className={`prompt-arch-pillar relative flex h-full w-full flex-col items-center justify-between gap-2 rounded-2xl border-2 px-3 py-4 transition-all duration-200 sm:px-4 sm:py-5 ${palette.cardBg} ${palette.cardBorder} ${interactiveClass}`}
      style={
        {
          ["--highlight-color" as string]: palette.symbolHex,
        } as React.CSSProperties
      }
    >
      <span
        className="prompt-arch-symbol leading-none"
        style={{
          // Diagonal gradient + solid colour fallback. The
          // `background-clip: text` + `-webkit-text-fill-color:
          // transparent` rules live in CSS gated by `@supports`
          // (globals.css §.prompt-arch-symbol) so a browser that
          // can't clip to text falls through to the solid `color`
          // and renders the glyph normally — instead of a coloured
          // rectangle.
          //
          // Important: use `backgroundImage` (longhand), NOT
          // `background` (shorthand). The shorthand resets ALL
          // background sub-properties — including `background-clip`
          // — back to their initial value. Inline `background: …`
          // beats the CSS rule `background-clip: text` and the
          // gradient ends up filling the entire span box → coloured
          // rectangle. With the longhand we set only the image and
          // leave the clip alone.
          color: palette.symbolHex,
          backgroundImage: palette.symbolGradient,
          fontSize: `${Math.round(48 * palette.symbolScale)}px`,
        }}
        aria-hidden="true"
      >
        {pillar.icon}
      </span>
      <span
        className={`block text-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] sm:text-sm ${palette.titleColor}`}
      >
        {pillar.title}
      </span>
      <span className="block text-center text-[10px] italic leading-tight text-stone-500 sm:text-xs">
        {pillar.description}
      </span>
    </button>
  );
}

// ─── Generated prompt overlay ─────────────────────────────────────────

function GeneratedPrompt({
  blocks,
  strings,
  filenameSlug,
  copyToastVisible,
  setCopyToastVisible,
}: {
  blocks: GeneratedPromptBlocks;
  strings: PromptArchitectureStrings;
  filenameSlug: string;
  copyToastVisible: boolean;
  setCopyToastVisible: (v: boolean) => void;
}) {
  const fullText = composeFullText(blocks, strings);

  function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        setCopyToastVisible(true);
        window.setTimeout(() => setCopyToastVisible(false), 1800);
      })
      .catch(() => {
        /* clipboard blocked — silent. */
      });
  }

  function handleDownload() {
    const md = composeMarkdown(blocks, strings);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${strings.filenamePrefix}-${filenameSlug}-${date}.md`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-col gap-4"
    >
      <div className="overflow-hidden rounded-2xl border-2 border-orange-300/70 bg-stone-50 shadow-sm">
        <PromptSection
          accentClass={PILLAR_PALETTE.context.sectionAccent}
          headingClass={PILLAR_PALETTE.context.headingClass}
          label={strings.sectionLabels.context}
          body={blocks.context}
          delay={0}
        />
        <PromptSection
          accentClass={PILLAR_PALETTE.constraints.sectionAccent}
          headingClass={PILLAR_PALETTE.constraints.headingClass}
          label={strings.sectionLabels.constraints}
          body={blocks.constraints}
          delay={0.18}
        />
        <PromptSection
          accentClass={PILLAR_PALETTE.task.sectionAccent}
          headingClass={PILLAR_PALETTE.task.headingClass}
          label={strings.sectionLabels.task}
          body={strings.taskPlaceholder}
          delay={0.36}
          isPlaceholder
        />
        <PromptSection
          accentClass={PILLAR_PALETTE.verification.sectionAccent}
          headingClass={PILLAR_PALETTE.verification.headingClass}
          label={strings.sectionLabels.verification}
          body={blocks.verification}
          delay={0.54}
          last
        />
      </div>

      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
        >
          {strings.copyCta}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-white px-5 py-3 text-sm font-semibold text-primary-deep transition-all hover:bg-primary/5 active:scale-[0.97]"
        >
          {strings.downloadCta}
        </button>
        <AnimatePresence>
          {copyToastVisible && (
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="ml-2 self-center rounded-full bg-text-primary px-3 py-1 text-[11px] font-medium text-white"
              role="status"
            >
              {strings.copiedToast}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PromptSection({
  accentClass,
  headingClass,
  label,
  body,
  delay,
  isPlaceholder = false,
  last = false,
}: {
  accentClass: string;
  headingClass: string;
  label: string;
  body: string;
  delay: number;
  isPlaceholder?: boolean;
  last?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`flex flex-col gap-2 ${accentClass} bg-white px-4 py-4 sm:px-5 ${last ? "" : "border-b border-stone-200"}`}
    >
      <p
        className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] sm:text-[11px] ${headingClass}`}
      >
        {label}
      </p>
      <p
        className={`whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed sm:text-[13px] ${
          isPlaceholder ? "italic text-text-muted" : "text-text-primary"
        }`}
      >
        {body}
      </p>
    </motion.div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function composeFullText(
  blocks: GeneratedPromptBlocks,
  strings: PromptArchitectureStrings,
): string {
  return [
    strings.sectionLabels.context,
    "————",
    blocks.context,
    "",
    strings.sectionLabels.constraints,
    "————",
    blocks.constraints,
    "",
    strings.sectionLabels.task,
    "————",
    strings.taskPlaceholder,
    "",
    strings.sectionLabels.verification,
    "————",
    blocks.verification,
  ].join("\n");
}

function composeMarkdown(
  blocks: GeneratedPromptBlocks,
  strings: PromptArchitectureStrings,
): string {
  const date = new Date().toISOString().slice(0, 10);
  return [
    strings.markdownHeader,
    "",
    `> ${date}`,
    "",
    "---",
    "",
    `## ${strings.sectionLabels.context}`,
    blocks.context,
    "",
    `## ${strings.sectionLabels.constraints}`,
    blocks.constraints,
    "",
    `## ${strings.sectionLabels.task}`,
    strings.taskPlaceholder,
    "",
    `## ${strings.sectionLabels.verification}`,
    blocks.verification,
    "",
    "---",
    "",
    `*${strings.markdownFooter}*`,
    "",
  ].join("\n");
}

function xpForResult(
  won: boolean,
  attempts: number,
  revealed: boolean,
): number {
  if (revealed && !won) return 100;
  if (!won) return 0;
  // Won path — bonus on first try, then a smooth decay over 5 tries.
  // Curve tuned for max_attempts=5: rewards quick insight without
  // making later wins feel useless.
  if (attempts === 1) return 550; // 400 base + 150 bonus
  if (attempts === 2) return 350;
  if (attempts === 3) return 250;
  if (attempts === 4) return 180;
  return 100; // attempt 5 (or auto-reveal at 5)
}

// Fisher-Yates shuffle. Returns a NEW array; original is untouched.
// Used to randomise the 2×2 grid on mount and on every reset, so the
// user can't memorise positions from one attempt to the next.
function shuffleKeys<T>(keys: readonly T[]): T[] {
  const out = [...keys];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
