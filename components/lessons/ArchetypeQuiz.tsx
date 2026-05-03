"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RefreshCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArchetypeQuizBlock } from "@/types";

// Pre-resolved strings, server-side. Templates only — no functions across
// the server/client boundary. See OpenQuestion.tsx for the rationale.
export interface ArchetypeQuizStrings {
  // Template: "Question {n} of {total}"
  questionOfTemplate: string;
  pickOneHint: string;
  revealCta: string;
  revealedTitle: string;
  // Template: "+{xp} bonus XP"
  bonusXpTemplate: string;
  retakeCta: string;
}

function formatQuestionOf(template: string, n: number, total: number): string {
  return template.replace("{n}", String(n)).replace("{total}", String(total));
}

function formatBonusXp(template: string, xp: number): string {
  return template.replace("{xp}", String(xp));
}

interface Props {
  block: ArchetypeQuizBlock;
  strings: ArchetypeQuizStrings;
  onRevealed?: (quizId: string, archetypeKey: string) => void;
}

/**
 * V2 block: multi-question multiple-choice quiz that reveals one of N
 * pre-defined archetypes. Pure client-side logic — no API, no scoring,
 * no gating. Tie-breaking uses the explicit `tie_breaker_priority` order.
 *
 * The reveal awards a one-shot XP bonus through the parent's onRevealed
 * callback (the lesson page sums all reveal_xp_bonus into the final XP
 * computation when the user completes the lesson).
 */
export function ArchetypeQuiz({ block, strings, onRevealed }: Props) {
  // selections: questionId -> optionKey
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);

  const totalQuestions = block.questions.length;
  const answeredCount = Object.keys(selections).length;
  const allAnswered = answeredCount === totalQuestions;

  function handleSelect(questionId: string, optionKey: string) {
    if (revealed) return;
    setSelections((prev) => ({ ...prev, [questionId]: optionKey }));
  }

  const dominantArchetype = useMemo(() => {
    if (!allAnswered) return null;
    const tally = new Map<string, number>();
    for (const a of block.archetypes) tally.set(a.key, 0);
    for (const q of block.questions) {
      const pick = selections[q.id];
      if (!pick) continue;
      const opt = q.options.find((o) => o.key === pick);
      if (!opt) continue;
      tally.set(opt.archetype_key, (tally.get(opt.archetype_key) ?? 0) + 1);
    }
    let best: { key: string; count: number } | null = null;
    for (const [key, count] of tally.entries()) {
      if (best === null || count > best.count) best = { key, count };
    }
    if (!best) return null;
    // Tie-breaking: among archetypes that share the top count, pick the one
    // that comes first in tie_breaker_priority.
    const tied: string[] = [];
    for (const [key, count] of tally.entries()) {
      if (count === best.count) tied.push(key);
    }
    if (tied.length === 1) return best.key;
    for (const key of block.tie_breaker_priority) {
      if (tied.includes(key)) return key;
    }
    return best.key; // fallback (shouldn't happen if validator did its job)
  }, [allAnswered, block, selections]);

  function handleReveal() {
    if (!allAnswered || !dominantArchetype) return;
    setRevealed(true);
    onRevealed?.(block.id, dominantArchetype);
  }

  function handleRetake() {
    setSelections({});
    setRevealed(false);
  }

  // ─── Reveal state ─────────────────────────────────────────────────

  if (revealed && dominantArchetype) {
    const archetype = block.archetypes.find((a) => a.key === dominantArchetype);
    if (!archetype) return null; // defensive; validator ensures presence
    return (
      <section
        className="flex flex-col gap-4 rounded-2xl border border-primary/40 bg-primary-light p-5 sm:p-6"
        aria-live="polite"
      >
        <header className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          <p className="eyebrow text-primary-deep">
            {strings.revealedTitle}
          </p>
        </header>
        <h3 className="font-heading text-2xl font-bold leading-tight text-text-primary">
          {archetype.title}
        </h3>
        <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
          {archetype.description}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {block.reveal_xp_bonus && block.reveal_xp_bonus > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-xp-gold/20 px-3 py-1 text-xs font-semibold text-text-primary">
              ⚡ {formatBonusXp(strings.bonusXpTemplate, block.reveal_xp_bonus)}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
            {strings.retakeCta}
          </button>
        </div>
      </section>
    );
  }

  // ─── Quiz state ───────────────────────────────────────────────────

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      {block.intro_text ? (
        <p className="text-base leading-relaxed text-text-secondary sm:text-lg">{block.intro_text}</p>
      ) : null}
      {block.instructions ? (
        <p className="text-sm text-text-muted">{block.instructions}</p>
      ) : null}
      <ol className="flex flex-col gap-5">
        {block.questions.map((q, qIdx) => {
          const selected = selections[q.id];
          const promptId = `${q.id}-prompt`;
          return (
            <li key={q.id} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <p className="eyebrow text-primary-deep">
                  {formatQuestionOf(
                    strings.questionOfTemplate,
                    qIdx + 1,
                    totalQuestions,
                  )}
                </p>
                {selected ? (
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-success"
                    aria-hidden
                  />
                ) : null}
              </div>
              <p
                id={promptId}
                className="font-medium leading-snug text-text-primary"
              >
                {q.prompt}
              </p>
              <fieldset
                aria-labelledby={promptId}
                className="flex flex-col gap-2"
              >
                <legend className="sr-only">{q.prompt}</legend>
                {q.options.map((o) => {
                  const isSelected = selected === o.key;
                  const optId = `${q.id}-${o.key}`;
                  return (
                    <label
                      key={o.key}
                      htmlFor={optId}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-deep",
                        isSelected
                          ? "border-primary bg-primary-light/60 text-text-primary"
                          : "border-border bg-surface text-text-secondary hover:border-primary/60 hover:bg-primary-light/30",
                      )}
                    >
                      <input
                        id={optId}
                        type="radio"
                        name={q.id}
                        value={o.key}
                        checked={isSelected}
                        onChange={() => handleSelect(q.id, o.key)}
                        disabled={revealed}
                        className="sr-only"
                      />
                      <span className="leading-snug">{o.label}</span>
                    </label>
                  );
                })}
              </fieldset>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-xs text-text-muted">
          {allAnswered ? "" : strings.pickOneHint}
        </p>
        <button
          type="button"
          onClick={handleReveal}
          disabled={!allAnswered}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {strings.revealCta}
        </button>
      </div>
    </section>
  );
}
