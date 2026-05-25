"use client";

// Two presentation modes for the lesson scenario:
//   - "intro" : full card — brief + vague prompt + generic output + Spark
//               framing + "Riscriviamolo" CTA. Used as the first screen.
//   - "summary" : compact accordion that lives at the top of every
//                 ingredient screen. Collapsed by default; expanded reveals
//                 brief + vague prompt + generic output (no CTA).

import { useState } from "react";
import { ChevronDown, Wrench } from "lucide-react";
import type { AnatomyScenarioConfig } from "@/types";
import { SparkSphere } from "@/components/promptly/SparkSphere";

export interface ScenarioCardStrings {
  vaguePromptLabel: string;
  genericOutputLabel: string;
  startCta: string;
  summaryToggleLabel: string;
}

interface IntroProps {
  mode: "intro";
  scenario: AnatomyScenarioConfig;
  strings: ScenarioCardStrings;
  onStart: () => void;
}

interface SummaryProps {
  mode: "summary";
  scenario: AnatomyScenarioConfig;
  strings: ScenarioCardStrings;
}

type Props = IntroProps | SummaryProps;

export function ScenarioCard(props: Props) {
  if (props.mode === "intro") {
    return <IntroLayout {...props} />;
  }
  return <SummaryAccordion {...props} />;
}

function IntroLayout({ scenario, strings, onStart }: IntroProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
        {scenario.brief}
      </p>

      <PromptBlock
        label={strings.vaguePromptLabel}
        body={scenario.vague_prompt}
        tone="prompt"
      />

      <PromptBlock
        label={strings.genericOutputLabel}
        body={scenario.generic_output}
        tone="output"
      />

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
        <SparkSphere state="thinking" size={40} />
        <p className="flex-1 text-sm italic leading-relaxed text-text-primary">
          {scenario.spark_intro_line}
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
        style={{ touchAction: "manipulation" }}
      >
        <Wrench size={14} />
        {strings.startCta}
      </button>
    </div>
  );
}

function SummaryAccordion({ scenario, strings }: SummaryProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-surface/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        aria-expanded={open}
        style={{ touchAction: "manipulation" }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {strings.summaryToggleLabel}
        </span>
        <ChevronDown
          size={16}
          className="text-text-muted transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-3 pb-3 pt-2">
          <p className="text-xs leading-relaxed text-text-secondary">
            {scenario.brief}
          </p>
          <PromptBlock
            label={strings.vaguePromptLabel}
            body={scenario.vague_prompt}
            tone="prompt"
            compact
          />
          <PromptBlock
            label={strings.genericOutputLabel}
            body={scenario.generic_output}
            tone="output"
            compact
          />
        </div>
      )}
    </div>
  );
}

interface PromptBlockProps {
  label: string;
  body: string;
  tone: "prompt" | "output";
  compact?: boolean;
}

function PromptBlock({ label, body, tone, compact = false }: PromptBlockProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border ${
        tone === "prompt"
          ? "border-amber-500/30 bg-amber-50/40"
          : "border-border bg-surface-muted/40"
      }`}
    >
      <span
        className={`border-b px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider ${
          tone === "prompt"
            ? "border-amber-500/20 text-amber-700"
            : "border-border text-text-muted"
        }`}
      >
        {label}
      </span>
      <p
        className={`whitespace-pre-line px-3 py-2 font-mono leading-relaxed text-text-primary ${
          compact ? "text-[11px]" : "text-xs sm:text-sm"
        }`}
      >
        {body}
      </p>
    </div>
  );
}
