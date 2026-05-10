"use client";

import type { TextStep as TextStepType } from "@/types";
import { StepCard } from "../StepCard";
import { RichText } from "@/components/glossary/RichText";

interface Props {
  step: TextStepType;
  // Provided by LessonV3View so reactive text steps can pick up the
  // selectedKey of an earlier choice and swap their paragraphs.
  stepState?: Record<string, unknown>;
}

// Paragraphs that match `<digit>. <body>` and appear in a contiguous
// run of 2+ get rendered as a proper <ol> list (numbered badge + item
// body) instead of plain paragraphs. Single-item runs fall through to
// regular paragraph rendering — the heuristic is intentionally
// conservative so isolated numbered sentences in prose don't get
// promoted to lists.
const NUMBERED_RE = /^\d+\.\s+/;

export function TextStep({ step, stepState }: Props) {
  const paragraphs = resolveParagraphs(step, stepState);
  return (
    <StepCard>
      <div className="flex flex-col gap-5">{renderBody(paragraphs)}</div>
    </StepCard>
  );
}

function renderBody(paragraphs: string[]): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < paragraphs.length) {
    const startedAt = i;
    if (NUMBERED_RE.test(paragraphs[i])) {
      const items: string[] = [];
      while (i < paragraphs.length && NUMBERED_RE.test(paragraphs[i])) {
        items.push(paragraphs[i].replace(NUMBERED_RE, ""));
        i++;
      }
      if (items.length >= 2) {
        out.push(
          <ol
            key={`ol-${startedAt}`}
            className="flex list-none flex-col gap-3"
          >
            {items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-base leading-relaxed text-text-secondary sm:text-lg"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light font-mono text-xs font-semibold text-primary-deep sm:h-8 sm:w-8 sm:text-sm"
                >
                  {idx + 1}
                </span>
                <span className="flex-1">
                  <RichText text={item} />
                </span>
              </li>
            ))}
          </ol>,
        );
        continue;
      }
      // Single numbered item — fall through and render as paragraph.
      i = startedAt;
    }
    const p = paragraphs[i];
    out.push(
      <p
        key={`p-${i}`}
        className={
          i === 0
            ? "text-lg leading-relaxed text-text-primary sm:text-xl"
            : "text-base leading-relaxed text-text-secondary sm:text-lg"
        }
      >
        <RichText text={p} />
      </p>,
    );
    i++;
  }
  return out;
}

function resolveParagraphs(
  step: TextStepType,
  stepState: Record<string, unknown> | undefined,
): string[] {
  if (!step.paragraphs_by_choice || !stepState) return step.paragraphs;
  const sourceState = stepState[step.paragraphs_by_choice.source_step_id] as
    | { selectedKey?: string }
    | undefined;
  const key = sourceState?.selectedKey;
  if (!key) return step.paragraphs;
  const variant = step.paragraphs_by_choice.by_key[key];
  if (variant && variant.length > 0) return variant;
  return step.paragraphs;
}
