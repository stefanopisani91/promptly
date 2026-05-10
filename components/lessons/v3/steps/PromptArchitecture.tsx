"use client";

// PROMPT_ARCHITECTURE — interactive widget for Lesson 6 (HERO ASSET).
//
// Drag-and-drop of 4 named pillars (CONTEXT / CONSTRAINTS / TASK /
// VERIFICATION) into a vertical canvas. The correct order is hard-
// coded as CORRECT_ORDER below — counter-intuitive: constraints come
// BEFORE the task. On a perfect drop the pillars dissolve into a
// personalised daily prompt the user can copy or download as .md.
//
// Hero asset for the landing page: every gradient, shadow, and
// micro-animation is intentional. Treat as a finished component.
//
// Flow (Lezione6_Blueprint §13):
//   1. Bottom tray shows 4 pillars in default order. Canvas is empty.
//   2. User drags pillars into the canvas; each drop snaps to the
//      next available slot (top-down).
//   3. Once all 4 are placed, we evaluate the order:
//      - perfect → fade pillars, typewriter the personalised prompt
//      - partial (2/4 right) → highlight wrong ones in red, pulse
//      - wrong (0-1 right) → blanket pulse, hint
//   4. After 3 attempts we auto-reveal the correct order and run the
//      transformation regardless.
//   5. The generated prompt is fetched from /api/lesson-architecture-
//      prompt — Haiku takes the user's project_description and
//      returns project-specific CONTEXT / CONSTRAINTS / VERIFICATION
//      blocks. Falls back to a generic skeleton on API failure.
//
// Touch on iPhone is handled by @dnd-kit's PointerSensor + small
// activation distance so a casual scroll doesn't initiate a drag.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
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
    // shrink them slightly to keep the row visually balanced.
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

  // Order placed in the canvas (top → bottom). null entries are empty
  // slots. Length always 4. Hydrates from persisted finalOrder so a
  // returning user sees their last result.
  const [placement, setPlacement] = useState<
    Array<PromptArchitecturePillarKey | null>
  >(() => {
    if (state?.finalOrder && state.finalOrder.length === 4)
      return [...state.finalOrder];
    return [null, null, null, null];
  });
  // Display order in the bottom tray. We START with the canonical
  // (non-randomised) order so SSR + client hydrate the same DOM —
  // calling Math.random() during render would mismatch and trigger
  // React's hydration error. We then shuffle once on mount (effect
  // below), and again on every wrong/partial reset.
  const [trayOrder, setTrayOrder] = useState<PromptArchitecturePillarKey[]>(
    () => config.pillars.map((p) => p.key),
  );

  // Shuffle the tray ONCE on first client paint so the user doesn't
  // see the canonical order. Wrapped in useEffect so it never runs on
  // the server — the brief "flash" of canonical order is ~one frame
  // and imperceptible in practice.
  useEffect(() => {
    setTrayOrder(shuffleKeys(config.pillars.map((p) => p.key)));
    // Intentionally empty deps — we only shuffle on mount. Subsequent
    // shuffles are driven by the feedback-reset effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [attemptCount, setAttemptCount] = useState(persisted?.attempts ?? 0);
  const [evaluating, setEvaluating] = useState(false);
  const [revealed, setRevealed] = useState(false); // auto-reveal after 3 fails
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
  // Which pillar (if any) is currently being dragged. Set by
  // DndContext's onDragStart so the empty slot under the cursor can
  // glow in the dragged pillar's colour, and the staggered "invite"
  // pulse on the other empty slots is suspended.
  const [activeDragKey, setActiveDragKey] =
    useState<PromptArchitecturePillarKey | null>(null);
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
      const idx = Math.min(
        Math.max(0, attemptCount - 1),
        feedback.kind === "wrong"
          ? strings.wrongFeedbacks.length - 1
          : strings.partialFeedbacks.length - 1,
      );
      const arr =
        feedback.kind === "wrong"
          ? strings.wrongFeedbacks
          : strings.partialFeedbacks;
      // Fallback to awaitingPrompt if the array is empty for any reason
      // (defensive — content authoring should always provide entries).
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

  // ─── DnD setup ─────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Small activation distance prevents tap-mistake drags.
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
  );

  // Pillars currently in the bottom tray. Display order follows the
  // shuffled `trayOrder`; a key currently placed on the canvas is
  // skipped. This guarantees the tray re-randomises between attempts
  // (re-shuffled in the partial/wrong reset effect below) so the user
  // can't just memorise visual positions.
  const trayPillars = useMemo(() => {
    const placed = new Set<PromptArchitecturePillarKey>();
    placement.forEach((p) => {
      if (p !== null) placed.add(p);
    });
    const lookup = new Map<PromptArchitecturePillarKey, PromptArchitecturePillar>(
      config.pillars.map((p) => [p.key, p]),
    );
    const out: PromptArchitecturePillar[] = [];
    for (const k of trayOrder) {
      if (placed.has(k)) continue;
      const pillar = lookup.get(k);
      if (pillar) out.push(pillar);
    }
    return out;
  }, [config.pillars, placement, trayOrder]);

  const pillarByKey = useMemo(() => {
    const m = new Map<PromptArchitecturePillarKey, PromptArchitecturePillar>();
    for (const p of config.pillars) m.set(p.key, p);
    return m;
  }, [config.pillars]);

  // Track the dragged pillar so the closest empty slot can glow in
  // its palette colour. We resolve the key from the draggable id
  // shape ("tray-<key>" / "canvas-<index>") — for canvas drags we
  // look up the placement to find the underlying key.
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      if (id.startsWith("tray-")) {
        setActiveDragKey(
          id.slice("tray-".length) as PromptArchitecturePillarKey,
        );
        return;
      }
      if (id.startsWith("canvas-")) {
        const idx = Number(id.slice("canvas-".length));
        if (Number.isFinite(idx)) {
          const key = placement[idx];
          if (key) setActiveDragKey(key);
        }
      }
    },
    [placement],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragKey(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      // Always release the active-drag tracker, even on rejected
      // drops, so the pulse animation can resume.
      setActiveDragKey(null);
      if (won || exhausted || revealed) return;
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      // active id format: tray-<key> or canvas-<index>
      // over id format:   slot-<index> or tray
      const overId = String(over.id);

      // Helper: given a key and a target slot index, place it (and
      // displace the previous occupant back to the tray).
      const placeAt = (key: PromptArchitecturePillarKey, index: number) => {
        setPlacement((prev) => {
          // Remove the key from its previous canvas slot if any.
          const next: Array<PromptArchitecturePillarKey | null> = prev.map((p) =>
            p === key ? null : p,
          );
          next[index] = key;
          return next;
        });
      };

      // ── 1. Drag from tray to a slot
      if (activeId.startsWith("tray-") && overId.startsWith("slot-")) {
        const key = activeId.slice("tray-".length) as PromptArchitecturePillarKey;
        const slotIndex = Number(overId.slice("slot-".length));
        if (
          Number.isFinite(slotIndex) &&
          slotIndex >= 0 &&
          slotIndex < placement.length
        ) {
          placeAt(key, slotIndex);
        }
        return;
      }

      // ── 2. Drag from tray to canvas drop zone (no specific slot)
      if (activeId.startsWith("tray-") && overId === "canvas") {
        const key = activeId.slice("tray-".length) as PromptArchitecturePillarKey;
        // Place into the first empty slot.
        const emptyIdx = placement.findIndex((p) => p === null);
        if (emptyIdx >= 0) placeAt(key, emptyIdx);
        return;
      }

      // ── 3. Reorder within the canvas
      if (activeId.startsWith("canvas-") && overId.startsWith("slot-")) {
        const fromIdx = Number(activeId.slice("canvas-".length));
        const toIdx = Number(overId.slice("slot-".length));
        if (
          fromIdx === toIdx ||
          !Number.isFinite(fromIdx) ||
          !Number.isFinite(toIdx)
        )
          return;
        setPlacement((prev) => {
          const next = [...prev];
          const movingKey = next[fromIdx];
          // Swap with whatever is at the target index (could be null
          // or another pillar — both behaviours feel natural).
          next[fromIdx] = next[toIdx];
          next[toIdx] = movingKey;
          return next;
        });
        return;
      }

      // ── 4. Drag from canvas BACK to tray (remove)
      if (activeId.startsWith("canvas-") && overId === "tray") {
        const fromIdx = Number(activeId.slice("canvas-".length));
        if (Number.isFinite(fromIdx)) {
          setPlacement((prev) => {
            const next = [...prev];
            next[fromIdx] = null;
            return next;
          });
        }
        return;
      }
    },
    [placement, won, exhausted, revealed],
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

      // If this attempt was the third — auto-reveal.
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

  // Auto-evaluate 500ms after all 4 pillars are in place (matches
  // blueprint UX). Skipped if already won/revealed/exhausted.
  //
  // Critical: the `feedback === null` gate prevents the effect from
  // re-firing after a wrong/partial attempt. Without it, every state
  // change inside `evaluate` (setAttemptCount, setFeedback) re-creates
  // the `evaluate` callback (it lists attemptCount in deps), which
  // re-runs this effect — and as long as the placement is still full
  // (1.6s reset window), allPlaced/won/exhausted/revealed/evaluating
  // all stay false and the effect schedules ANOTHER evaluate. Two
  // re-fires later, attemptCount hits max_attempts and the widget
  // auto-reveals after a single user placement. Bug observed
  // 10 May 2026.
  useEffect(() => {
    if (
      !allPlaced ||
      won ||
      exhausted ||
      revealed ||
      evaluating ||
      feedback !== null
    )
      return;
    const t = window.setTimeout(() => {
      evaluate();
    }, 500);
    return () => window.clearTimeout(t);
  }, [allPlaced, won, exhausted, revealed, evaluating, feedback, evaluate]);

  // ─── Reset placement after a wrong / partial attempt ──────────────

  // After 1.6s of feedback we send the misplaced pillars back to the
  // tray so the user can try again. Correct positions stay locked.
  // Tray order is re-shuffled at the same time so the user gets a
  // fresh random arrangement and doesn't lean on muscle memory.
  useEffect(() => {
    if (!feedback || feedback.kind === "perfect") {
      // No reset to schedule.
      // (Wrong attempt with `attemptCount === step.max_attempts` was
      // already auto-revealed in evaluate; no reset there either.)
      return;
    }
    if (revealed || exhausted) return;
    const t = window.setTimeout(() => {
      const correctIdx =
        feedback.kind === "partial" ? feedback.correctIndices : new Set<number>();
      setPlacement((prev) =>
        prev.map((p, i) => (correctIdx.has(i) ? p : null)),
      );
      setTrayOrder(shuffleKeys(config.pillars.map((p) => p.key)));
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

  // ─── Render ────────────────────────────────────────────────────────

  // `medium` (max-w-4xl) instead of `wide` (max-w-5xl): the canvas
  // row is ~600px and the orange container + StepCard padding push
  // the natural content to ~780px. max-w-5xl on desktop left ~230px
  // of empty side-padding per side; max-w-4xl tightens it without
  // squashing the prompt overlay shown after victory.
  return (
    <StepCard medium>
      <div className="flex flex-col gap-6">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}

        <DndContext
          // Stable id avoids the SSR/CSR hydration mismatch on dnd-kit's
          // internal `DndDescribedBy-N` aria-describedby IDs. Without it,
          // dnd-kit increments a module-level counter (server resets to 0
          // per request, client persists across navigations), producing
          // a hydration warning and — in some cases — a brief window
          // where pointer listeners attach late.
          id="prompt-architecture-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex flex-col gap-5 rounded-3xl border-2 border-orange-200/70 bg-stone-50 p-5 sm:p-8">
            {/* Museum-quality headline (Bonus). Serif 2xl headline +
                italic stone-500 sub. The previous mono eyebrow with
                ✦ characters has been retired — the hierarchy reads
                cleaner without the decorations. */}
            <div className="flex flex-col items-center gap-2 pb-2 pt-1 text-center">
              <h2 className="prompt-arch-title-serif text-2xl uppercase text-stone-700 sm:text-3xl">
                {config.canvas_title}
              </h2>
              <p className="text-sm italic text-stone-500 sm:text-base">
                {config.canvas_subtitle}
              </p>
            </div>

            {/* Canvas */}
            <Canvas
              placement={placement}
              pillarByKey={pillarByKey}
              feedback={feedback}
              emptyHint={config.empty_hint}
              showGeneratedPrompt={Boolean(won && generatedBlocks)}
              activeDragKey={activeDragKey}
            />

            {/* Generated prompt overlay (rendered when won) */}
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

            {/* Tray */}
            {!won && !exhausted && !revealed && (
              <PillarTray
                pillars={trayPillars}
                label={config.pillars_tray_label}
              />
            )}

            <p className="text-right font-mono text-[11px] tabular-nums text-text-muted">
              {counter}
            </p>
          </div>

          {/* DragOverlay — the floating clone that follows the pointer.
              The original draggable stays in place (rendered with low
              opacity as a ghost) so the tray/canvas layout doesn't
              reflow as the flexbox redistributes space. Without this,
              on narrow viewports the remaining 3 pillars compress
              visibly while one is mid-drag. */}
          <DragOverlay dropAnimation={null}>
            {activeDragKey
              ? (() => {
                  const pillar = pillarByKey.get(activeDragKey);
                  return pillar ? (
                    <PillarCard pillar={pillar} feedback={null} isOverlay />
                  ) : null;
                })()
              : null}
          </DragOverlay>
        </DndContext>

        {/* Spark dialogue */}
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

function Canvas({
  placement,
  pillarByKey,
  feedback,
  emptyHint,
  showGeneratedPrompt,
  activeDragKey,
}: {
  placement: Array<PromptArchitecturePillarKey | null>;
  pillarByKey: Map<PromptArchitecturePillarKey, PromptArchitecturePillar>;
  feedback:
    | { kind: "perfect" }
    | { kind: "partial"; correctIndices: Set<number> }
    | { kind: "wrong" }
    | null;
  emptyHint: string;
  showGeneratedPrompt: boolean;
  activeDragKey: PromptArchitecturePillarKey | null;
}) {
  const isEmpty = placement.every((p) => p === null);
  const isDragInFlight = activeDragKey !== null;
  // Wrap the canvas as a droppable so the user can drop into the
  // general area even when no specific slot is highlighted (e.g.
  // first drop on an empty canvas, off-target on touch). The dispatch
  // handler resolves `over.id === "canvas"` to the first empty slot.
  const { setNodeRef: setCanvasRef } = useDroppable({ id: "canvas" });

  return (
    <div
      ref={setCanvasRef}
      className={`relative rounded-2xl border-[3px] border-dashed bg-amber-50/40 px-3 py-4 sm:px-6 sm:py-6 ${
        isEmpty
          ? "prompt-arch-canvas-idle border-orange-200"
          : "border-orange-300"
      } ${feedback?.kind === "perfect" ? "border-emerald-300/70" : ""}`}
      aria-label="Spazio di costruzione del prompt"
    >
      {/* The 4 slots — always rendered so they stay droppable even on
          an empty canvas. Layout is now a HORIZONTAL row of 4 fixed-
          size slots (T3), matching the pillar geometry exactly so the
          drop is "snap into place" not "vague drop zone". On phones
          we shrink the gap so 4 × 100px slots + 3 × 6px gap fits a
          ~330px viewport without horizontal scroll. */}
      <div className="flex flex-row items-stretch justify-center gap-1.5 sm:gap-3">
        {placement.map((key, i) => (
          <CanvasSlot
            key={i}
            index={i}
            pillarKey={key}
            pillarByKey={pillarByKey}
            feedback={feedback}
            // Empty slots only pulse when ALL canvas slots are empty
            // AND no drag is currently in flight. Mid-attempt
            // (some pillars placed, others not) we keep the empty
            // ones quiet so the focus stays on the pillars in play.
            shouldPulse={isEmpty && !isDragInFlight}
            activeDragKey={activeDragKey}
          />
        ))}
      </div>

      {/* Empty-state hint: absolute overlay so it doesn't block the
          underlying droppable slots (pointer-events-none). Hidden the
          moment the user drops the first pillar. The arrow ↓ from the
          earlier vertical layout is gone — the hierarchy of "canvas
          on top, pillar tray below" is enough on its own. */}
      {isEmpty && !showGeneratedPrompt && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="text-base italic text-stone-500 sm:text-lg">
            {emptyHint}
          </p>
        </div>
      )}
    </div>
  );
}

function CanvasSlot({
  index,
  pillarKey,
  pillarByKey,
  feedback,
  shouldPulse,
  activeDragKey,
}: {
  index: number;
  pillarKey: PromptArchitecturePillarKey | null;
  pillarByKey: Map<PromptArchitecturePillarKey, PromptArchitecturePillar>;
  feedback:
    | { kind: "perfect" }
    | { kind: "partial"; correctIndices: Set<number> }
    | { kind: "wrong" }
    | null;
  // True when the empty-canvas invitation pulse should run on this
  // slot. Set by the parent: true only when every slot is empty AND
  // no drag is in flight. The 4 slots stagger via different classes.
  shouldPulse: boolean;
  // The pillar currently being dragged (if any). Drives the
  // colour-matched glow on the slot under the cursor.
  activeDragKey: PromptArchitecturePillarKey | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` });

  if (!pillarKey) {
    // Empty slot. Three visual states ranked by precedence:
    //   1. Drag-over: colour-matched glow tinted with the dragged
    //      pillar's hex (so the user previews "this colour will
    //      land here").
    //   2. Idle invitation: 4 slots pulse in sequence (every 0.6s)
    //      to show they accept input, but only when all are empty
    //      and no drag is active.
    //   3. Resting: neutral dashed border.
    const palette = activeDragKey ? PILLAR_PALETTE[activeDragKey] : null;
    const overGlowStyle: React.CSSProperties | undefined =
      isOver && palette
        ? {
            borderColor: palette.symbolHex,
            backgroundColor: `${palette.symbolHex}14`, // ~8% alpha
          }
        : undefined;
    const pulseClass =
      shouldPulse
        ? `prompt-arch-slot-pulse-${index + 1}`
        : "";
    return (
      <div
        ref={setNodeRef}
        style={overGlowStyle}
        className={`flex h-[140px] w-[100px] items-center justify-center rounded-xl border-2 border-dashed bg-white/40 text-xs italic text-text-muted transition-colors sm:h-[200px] sm:w-[140px] ${
          isOver && !palette ? "border-orange-400 bg-orange-50" : ""
        } ${!isOver ? "border-stone-300/70" : ""} ${pulseClass}`}
      >
        {/* Empty slot — visuals only */}
      </div>
    );
  }

  const pillar = pillarByKey.get(pillarKey);
  if (!pillar) return null;

  const correctIdx =
    feedback?.kind === "partial" ? feedback.correctIndices : null;
  const isCorrect = correctIdx?.has(index);
  const isWrong =
    correctIdx !== null && correctIdx !== undefined && !isCorrect;

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isOver ? "ring-2 ring-orange-300 ring-offset-2 ring-offset-stone-50 rounded-2xl" : ""}`}
    >
      <DraggablePillar
        pillar={pillar}
        location="canvas"
        index={index}
        feedback={
          isCorrect ? "correct" : isWrong ? "wrong" : feedback?.kind === "wrong" ? "wrong" : null
        }
      />
    </div>
  );
}

function PillarTray({
  pillars,
  label,
}: {
  pillars: PromptArchitecturePillar[];
  label: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "tray" });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 rounded-2xl border bg-white/60 p-3 transition-colors sm:p-4 ${
        isOver
          ? "border-orange-300 bg-orange-50/50"
          : "border-stone-200/80"
      }`}
    >
      <h3 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 sm:text-sm">
        {label}
      </h3>
      <div className="flex flex-row items-stretch justify-center gap-1.5 sm:gap-3">
        {pillars.map((p) => (
          <DraggablePillar
            key={p.key}
            pillar={p}
            location="tray"
            feedback={null}
          />
        ))}
      </div>
    </div>
  );
}

function DraggablePillar({
  pillar,
  location,
  index,
  feedback,
}: {
  pillar: PromptArchitecturePillar;
  location: "tray" | "canvas";
  index?: number;
  feedback: "correct" | "wrong" | null;
}) {
  const id = location === "tray" ? `tray-${pillar.key}` : `canvas-${index}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });

  // PillarCard IS the draggable element — drag refs/listeners are
  // attached directly to its outer div. Previously a thin wrapper div
  // sat between dnd-kit's setNodeRef and the visible card; in some
  // flex contexts the wrapper's bounding box drifted from the card's,
  // and dnd-kit measured the wrapper for overlay positioning → the
  // overlay clone appeared shifted (typically rightward) from where
  // the cursor actually was. Bug observed 10 May 2026.
  return (
    <PillarCard
      pillar={pillar}
      feedback={feedback}
      dragRef={setNodeRef}
      dragListeners={listeners as Record<string, unknown> | undefined}
      dragAttributes={attributes as unknown as Record<string, unknown>}
      isDragging={isDragging}
    />
  );
}

// Pillar card. Renders in two roles:
//   1. In-flow draggable: receives `dragRef` + listeners + attributes
//      from <DraggablePillar>. Ghosts (opacity 0.2) while being dragged.
//   2. Inside <DragOverlay> as the floating clone: pass `isOverlay`,
//      no drag refs (the overlay handles its own positioning).
// Geometry: 100×140 on phone, 140×200 from sm+. Stack: symbol top,
// uppercase title centre, italic description bottom.
function PillarCard({
  pillar,
  feedback,
  isOverlay = false,
  isDragging = false,
  dragRef,
  dragListeners,
  dragAttributes,
}: {
  pillar: PromptArchitecturePillar;
  feedback: "correct" | "wrong" | null;
  isOverlay?: boolean;
  isDragging?: boolean;
  dragRef?: (node: HTMLElement | null) => void;
  // Listeners + attributes from useDraggable. The exact types are
  // intentionally loose (Record<string, unknown>) so we can spread
  // without coupling to dnd-kit's internal types.
  dragListeners?: Record<string, unknown>;
  dragAttributes?: Record<string, unknown>;
}) {
  const palette = PILLAR_PALETTE[pillar.key];
  const feedbackClass =
    feedback === "correct"
      ? "ring-2 ring-emerald-400 ring-offset-2"
      : feedback === "wrong"
        ? "prompt-arch-pillar-pulse-wrong"
        : "";

  return (
    <div
      ref={dragRef}
      {...(dragListeners ?? {})}
      {...(dragAttributes ?? {})}
      role={dragRef ? "button" : undefined}
      tabIndex={dragRef ? 0 : undefined}
      aria-label={
        dragRef ? `${pillar.title} — ${pillar.description}` : undefined
      }
      // Multi-layer shadow + hover lift come from `.prompt-arch-pillar`
      // (globals.css). `is-dragging` swaps the shadow stack to its
      // heaviest version — applied to the overlay clone for visual
      // weight while flying.
      className={`prompt-arch-pillar relative flex h-[140px] w-[100px] flex-col items-center justify-between rounded-2xl border-2 px-3 py-3 sm:h-[200px] sm:w-[140px] sm:px-4 sm:py-5 ${palette.cardBg} ${palette.cardBorder} ${feedbackClass} ${isOverlay ? "is-dragging" : ""}`}
      style={{
        // CSS var consumed by .prompt-arch-pillar::before for the
        // top-edge highlight (Mod 3). React types don't know about
        // custom properties, hence the cast.
        ["--highlight-color" as string]: palette.symbolHex,
        // In-flow drag state: dim the original to a ghost; cursor +
        // touchAction tell the browser this is a draggable element.
        ...(isDragging && {
          opacity: 0.2,
          cursor: "grabbing",
          touchAction: "none",
        }),
        ...(dragRef &&
          !isDragging && {
            cursor: "grab",
            touchAction: "none",
          }),
        // Subtle 2° tilt only on the overlay clone — the in-place
        // ghost stays upright so it doesn't fight the layout.
        ...(isOverlay && { transform: "rotate(2deg)" }),
      }}
    >
      <span
        className="prompt-arch-symbol"
        style={{
          // Diagonal gradient + solid colour fallback. The
          // `background-clip: text` + `-webkit-text-fill-color:
          // transparent` rules live in CSS gated by `@supports`
          // (globals.css §.prompt-arch-symbol) so a browser that
          // can't clip to text falls through to the solid `color`
          // and renders the glyph normally — instead of a coloured
          // rectangle (the bug observed when text-fill-color:
          // transparent fired without background-clip taking effect).
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
          fontSize: `${Math.round(60 * palette.symbolScale)}px`,
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
      <p className="block text-center text-[10px] italic leading-tight text-stone-500 sm:text-xs">
        {pillar.description}
      </p>
    </div>
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
// Used to randomise the bottom tray on mount and on every reset, so
// the user can't memorise positions from one attempt to the next.
function shuffleKeys<T>(keys: readonly T[]): T[] {
  const out = [...keys];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
