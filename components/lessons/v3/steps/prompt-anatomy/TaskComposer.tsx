"use client";

// Task screen — the only free-text field in the widget. Has:
//   - a single textarea (deferred focus so the mobile keyboard doesn't
//     fire on screen entry and cover the checklist),
//   - a live 3-item checklist driven by `evaluateTaskHeuristics()` —
//     verb / object / outcome, indicative only (the real grade is Spark's).
//   - a discreet char counter,
//
// The textarea is intentionally NOT cleared between attempts at the
// parent level either (rule #1 in LESSON-GUIDELINES.md §V3 quick-win).

import { useEffect, useRef } from "react";
import { Check, Circle } from "lucide-react";
import type { AnatomyTaskHintConfig, AnatomyTaskSpec } from "@/types";

export interface TaskChecklistStrings {
  verb: string;
  object: string;
  outcome: string;
}

interface Props {
  spec: AnatomyTaskSpec;
  value: string;
  onChange: (next: string) => void;
  // Localised labels for the 3 heuristic checks.
  checklist: TaskChecklistStrings;
  // "{current} / {max}" template for the char counter.
  charCounterTemplate: string;
  disabled?: boolean;
}

export function TaskComposer({
  spec,
  value,
  onChange,
  checklist,
  charCounterTemplate,
  disabled = false,
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  // Defer focus past the screen-transition animation so the mobile keyboard
  // doesn't pop up mid-slide (covering the checklist + counter). 350ms
  // matches the framer-motion exit-enter chain we use for ingredient
  // screens (`anatomy-screen-enter` / `-exit` in globals.css).
  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      ref.current?.focus({ preventScroll: false });
    }, 380);
    return () => window.clearTimeout(t);
  }, [disabled]);

  const heur = evaluateTaskHeuristics(value, spec.hint);
  const trimmed = value.trim().length;
  const counter = charCounterTemplate
    .replace("{current}", String(trimmed))
    .replace("{max}", String(spec.max_chars));

  return (
    <div className="flex flex-col gap-3">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, spec.max_chars + 50))}
        placeholder={spec.placeholder}
        disabled={disabled}
        rows={5}
        inputMode="text"
        enterKeyHint="done"
        autoCapitalize="sentences"
        maxLength={spec.max_chars + 50}
        className="block w-full resize-none rounded-2xl border-2 border-border bg-surface p-3 text-base leading-relaxed text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none disabled:opacity-70 sm:text-sm"
        style={{ minHeight: 128 }}
        aria-label="Task"
      />

      <ul
        aria-live="polite"
        className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface-muted/30 p-2.5"
      >
        <ChecklistRow checked={heur.hasVerb} label={checklist.verb} />
        <ChecklistRow checked={heur.hasObject} label={checklist.object} />
        <ChecklistRow checked={heur.hasOutcome} label={checklist.outcome} />
      </ul>

      <span
        role="status"
        aria-live="polite"
        className={`text-right font-mono text-[11px] tabular-nums ${
          trimmed > spec.max_chars
            ? "text-red-600"
            : trimmed > spec.max_chars - 40
            ? "text-amber-600"
            : "text-text-muted"
        }`}
      >
        {counter}
      </span>
    </div>
  );
}

function ChecklistRow({ checked, label }: { checked: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs text-text-primary">
      {checked ? (
        <Check
          size={14}
          className="anatomy-checklist-pop text-emerald-600"
          strokeWidth={3}
        />
      ) : (
        <Circle size={14} className="text-text-muted" strokeWidth={2} />
      )}
      <span className={checked ? "text-text-primary" : "text-text-muted"}>
        {label}
      </span>
    </li>
  );
}

// Pure heuristic — three best-effort checks against the hint sets the
// JSON ships per scenario. Indicative only: the rubric proper runs on
// Haiku at submit time. False positives/negatives are tolerated as long
// as the *direction* of feedback is right (writing a verb does light up
// the verb pip; vague single-clause input keeps everything off).
export interface TaskHeuristics {
  hasVerb: boolean;
  hasObject: boolean;
  hasOutcome: boolean;
}

export function evaluateTaskHeuristics(
  raw: string,
  hint: AnatomyTaskHintConfig,
): TaskHeuristics {
  const text = raw.trim().toLowerCase();
  if (text.length < 4) {
    return { hasVerb: false, hasObject: false, hasOutcome: false };
  }

  const tokens = text.split(/\s+/);
  const hasVerb = hint.verbs.some((verb) => {
    const needle = verb.toLowerCase();
    return tokens.some((tk) => tk.startsWith(needle.slice(0, 4)));
  });

  // Object heuristic: any domain term + minimum length (the task has
  // enough body to actually carry an object beyond the verb).
  const hasDomain = hint.domain_terms.some((term) =>
    text.includes(term.toLowerCase()),
  );
  const hasObject = hasDomain && tokens.length >= 5;

  // Outcome heuristic: explicit outcome marker OR a number/quantity OR a
  // slash-style route reference (which usually points at "after this,
  // the user lands on X").
  const hasMarker = hint.outcome_markers.some((m) =>
    text.includes(m.toLowerCase()),
  );
  const hasNumber = /\b\d+(?:[.,]\d+)?\b/.test(text);
  const hasRoute = /\/[a-z0-9-]+/i.test(raw);
  const hasOutcome = hasMarker || hasNumber || hasRoute;

  return { hasVerb, hasObject, hasOutcome };
}
