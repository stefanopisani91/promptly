"use client";

// Reusable single-open accordion editor. Built for Lesson 2's CLAUDE.md
// quick-win (4 sections: cosa / stack / regole / workflow), but the shape
// is generic so future lessons can drop it in for "fill these N blocks"
// flows without copying code.
//
// Aesthetic: tuned to feel like a code/markdown editor (VS Code / Cursor /
// Linear input vibes) — squared corners, optional left gutter with line
// numbers, monospaced body text, mute warm-grey trigger backgrounds. The
// visual language lives in this file + globals.css; switching themes (dark
// mode, smaller variant) is a className-level change.
//
// Behavioural rules (Lezione2_Blueprint.md §13c, refactor brief):
//   - Exactly ONE section open at a time, or zero.
//   - Per-section text persists when a section closes.
//   - When a section opens, the textarea inside gets focus (with caret at
//     end). When it closes via its own header, focus stays on the trigger.
//   - Sections that pass the "compiled" threshold (default ≥ 10 chars,
//     overridable) show a small ✓ badge and stop the idle pulse.
//
// Animations are CSS-only and live in globals.css under
// `accordion-section-*`. The expand uses the `grid-template-rows: 0fr → 1fr`
// trick to animate auto height without measuring with JS — same modern
// pattern as the rest of the V3 lesson surface, no framer-motion dep.
//
// Accessibility:
//   - Each section header is a <button> with aria-expanded + aria-controls.
//   - The textarea container is the aria-controls target with role=region.
//   - Line-number gutter is aria-hidden + select-none — purely decorative.
//   - prefers-reduced-motion is respected globally.

import {
  KeyboardEvent,
  UIEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronRight } from "lucide-react";

export interface AccordionSectionDef {
  id: string;
  title: string;
  description: string;
  placeholder?: string;
}

export interface SectionAccordionStrings {
  // Pattern with {current} / {max} — char counter shown under the textarea
  // when showCharCounter is true.
  charCounterTemplate: string;
  // ARIA label used on the [✓ compilata] badge.
  filledBadgeLabel: string;
  // Visible text of the [✓ compilata] badge (e.g. "compilata" / "filled").
  filledBadgeText: string;
}

interface Props {
  sections: AccordionSectionDef[];
  // Map of sectionId → current content. The parent is the source of truth;
  // the accordion stays controlled.
  accumulatedContent: Record<string, string>;
  // Fired on every keystroke; the parent decides how to persist (state +
  // sessionStorage in Lesson 2; could be DB autosave elsewhere).
  onContentChange: (sectionId: string, content: string) => void;
  // Index of the section open on first mount. null = nothing open initially.
  initialOpen?: number | null;
  // Min chars (after trim) to flip a section into the "compiled" visual
  // (badge + no-pulse). 0 disables the badge entirely.
  minCharsForBadge?: number;
  // Per-section hard cap on input length. The textarea slices to this on
  // every change — defensive against paste-bombs.
  maxCharsPerSection?: number;
  // Show a left gutter with monospaced line numbers next to each
  // textarea (default true). Hidden under sm: regardless — see
  // implementation below.
  showLineNumbers?: boolean;
  // Show the per-section "X / max" counter under the textarea (default
  // true). Lesson 2 uses a single unified counter at the wrapper level,
  // so it sets this false.
  showCharCounter?: boolean;
  // Lock the editor (no edits, no expand/collapse). Used after the run is
  // finalised in Lesson 2.
  disabled?: boolean;
  strings: SectionAccordionStrings;
}

const DEFAULT_MIN_CHARS_FOR_BADGE = 10;
const DEFAULT_MAX_CHARS_PER_SECTION = 600;
const TEXTAREA_VISIBLE_ROWS = 5;

export function SectionAccordion({
  sections,
  accumulatedContent,
  onContentChange,
  initialOpen = 0,
  minCharsForBadge = DEFAULT_MIN_CHARS_FOR_BADGE,
  maxCharsPerSection = DEFAULT_MAX_CHARS_PER_SECTION,
  showLineNumbers = true,
  showCharCounter = true,
  disabled = false,
  strings,
}: Props) {
  // null = nothing open. Number = index of the open section.
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpen);
  const idPrefix = useId();
  // Refs to focus the textarea after expansion + restore focus to the
  // trigger when a section is collapsed by clicking its own header.
  const textareaRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  // Ref for each gutter so we can sync its scrollTop with the textarea.
  const gutterRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Auto-focus the textarea when its section becomes the open one. Skipped
  // on the very first mount so we don't yank focus on page load — only
  // user-driven openings should grab focus.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (openIndex === null) return;
    const el = textareaRefs.current[openIndex];
    if (!el) return;
    const t = window.requestAnimationFrame(() => {
      el.focus({ preventScroll: false });
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
    return () => window.cancelAnimationFrame(t);
  }, [openIndex]);

  const toggle = useCallback(
    (i: number) => {
      if (disabled) return;
      setOpenIndex((prev) => (prev === i ? null : i));
    },
    [disabled],
  );

  const handleHeaderKey = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = (i + 1) % sections.length;
        document.getElementById(`${idPrefix}-trigger-${next}`)?.focus();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = (i - 1 + sections.length) % sections.length;
        document.getElementById(`${idPrefix}-trigger-${prev}`)?.focus();
      }
    },
    [sections.length, idPrefix],
  );

  const handleTextareaScroll = useCallback(
    (e: UIEvent<HTMLTextAreaElement>, i: number) => {
      const gutter = gutterRefs.current[i];
      if (gutter) gutter.scrollTop = e.currentTarget.scrollTop;
    },
    [],
  );

  return (
    <div className="flex flex-col divide-y divide-border">
      {sections.map((section, i) => {
        const isOpen = openIndex === i;
        const content = accumulatedContent[section.id] ?? "";
        const isFilled =
          minCharsForBadge > 0 && content.trim().length >= minCharsForBadge;
        const triggerId = `${idPrefix}-trigger-${i}`;
        const panelId = `${idPrefix}-panel-${i}`;

        const idlePulse = !isOpen && !isFilled && !disabled;

        return (
          <div
            key={section.id}
            className={`accordion-section ${
              idlePulse ? "accordion-section-idle-pulse" : ""
            } ${disabled ? "opacity-90" : ""}`}
          >
            <button
              id={triggerId}
              type="button"
              onClick={() => toggle(i)}
              onKeyDown={(e) => handleHeaderKey(e, i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              disabled={disabled}
              className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-[background-color,border-color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                isOpen
                  ? "bg-surface"
                  : "accordion-section-trigger bg-surface-muted/60 hover:bg-primary-light/40"
              } ${disabled ? "cursor-default" : "cursor-pointer"}`}
            >
              <span
                aria-hidden
                className={`accordion-arrow mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center text-primary transition-transform duration-200 ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </span>

              <span className="flex flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-text-primary">
                    ## {section.title}
                  </span>
                  {isFilled && (
                    <span
                      role="status"
                      aria-label={strings.filledBadgeLabel}
                      className="inline-flex items-center gap-1 rounded-sm bg-success-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success"
                    >
                      <Check size={10} strokeWidth={3} aria-hidden />
                      {strings.filledBadgeText}
                    </span>
                  )}
                </span>
                <span className="text-xs italic text-text-muted">
                  {section.description}
                </span>
              </span>
            </button>

            {/* Animated panel — uses the grid-template-rows trick for a
                true auto-height transition. The inner div is overflow-hidden
                so content gets clipped during collapse. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={`accordion-panel grid transition-[grid-template-rows] duration-[250ms] ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-3 pb-3">
                  <CodeAreaWithGutter
                    value={content}
                    onChange={(next) =>
                      onContentChange(
                        section.id,
                        next.slice(0, maxCharsPerSection),
                      )
                    }
                    placeholder={section.placeholder}
                    disabled={disabled}
                    isOpen={isOpen}
                    showLineNumbers={showLineNumbers}
                    onScroll={(e) => handleTextareaScroll(e, i)}
                    textareaRef={(el) => {
                      textareaRefs.current[i] = el;
                    }}
                    gutterRef={(el) => {
                      gutterRefs.current[i] = el;
                    }}
                  />
                  {showCharCounter && (
                    <div className="mt-1 flex justify-end">
                      <span className="font-mono text-[10px] text-text-muted">
                        {strings.charCounterTemplate
                          .replace("{current}", String(content.length))
                          .replace("{max}", String(maxCharsPerSection))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CodeAreaWithGutter ──────────────────────────────────────────────
//
// Textarea wrapped in a flex row with an optional left gutter rendering
// monospaced line numbers. The brief explicitly asked for the simple
// approach — count `\n` in the value rather than measuring DOM heights —
// so a single long wrapped line still counts as one number. That's
// documented as expected and keeps the component dependency-free.
//
// Sync rule: when the textarea scrolls (overflow on long content), the
// gutter scrolls in lockstep. The gutter has overflow-hidden so it can't
// scroll on its own.
//
// Mobile: the gutter is hidden under the sm: breakpoint (640px) — too
// narrow to fit comfortably alongside the textarea on a phone.

interface CodeAreaProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled: boolean;
  isOpen: boolean;
  showLineNumbers: boolean;
  onScroll: (e: UIEvent<HTMLTextAreaElement>) => void;
  textareaRef: (el: HTMLTextAreaElement | null) => void;
  gutterRef: (el: HTMLDivElement | null) => void;
}

function CodeAreaWithGutter({
  value,
  onChange,
  placeholder,
  disabled,
  isOpen,
  showLineNumbers,
  onScroll,
  textareaRef,
  gutterRef,
}: CodeAreaProps) {
  // Line count = explicit newlines + 1. Floor at TEXTAREA_VISIBLE_ROWS so
  // an empty editor still feels like an editor instead of a one-row form.
  const lineCount = useMemo(() => {
    const newlines = (value.match(/\n/g) ?? []).length;
    return Math.max(newlines + 1, TEXTAREA_VISIBLE_ROWS);
  }, [value]);

  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1),
    [lineCount],
  );

  return (
    <div className="flex w-full overflow-hidden rounded-sm border border-border bg-surface-muted/40 focus-within:border-primary">
      {showLineNumbers && (
        <div
          ref={gutterRef}
          aria-hidden="true"
          // Hidden on phones — at < 640px the gutter eats too much
          // horizontal real estate. Desktop / tablet show it.
          className="hidden w-9 shrink-0 select-none overflow-hidden border-r border-border bg-surface-muted/80 py-3 pr-2 text-right font-mono text-[12px] leading-relaxed text-text-muted sm:block"
        >
          {lineNumbers.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={onScroll}
        placeholder={placeholder}
        rows={TEXTAREA_VISIBLE_ROWS}
        disabled={disabled}
        tabIndex={isOpen ? 0 : -1}
        aria-hidden={!isOpen}
        // No border / rounding here — the parent flex provides the
        // border. Padding 12px on every side per the brief. font-mono +
        // leading-relaxed match the gutter so numbers align with text.
        className="w-full flex-1 resize-none border-0 bg-transparent p-3 font-mono text-sm leading-relaxed text-text-primary placeholder:italic placeholder:text-text-muted focus:outline-none"
      />
    </div>
  );
}
