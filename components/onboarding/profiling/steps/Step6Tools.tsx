"use client";

import Image from "next/image";
import { useId } from "react";
import { ONBOARDING_TOOLS, type ToolMeta } from "@/lib/onboarding/tools";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { cn } from "@/lib/utils";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine } from "../SparkLine";

const TOOLS_OTHER_MAX = 100;

interface Props {
  copy: ProfilingCopy["step6"];
  selected: string[];
  toolsOther: string;
  noneSelected: boolean;
  pending: boolean;
  onToggleTool: (slug: string) => void;
  onChangeOther: (value: string) => void;
  onSelectNone: () => void;
  onAdvance: () => void;
  ctaLabel: string;
}

export function Step6Tools({
  copy,
  selected,
  toolsOther,
  noneSelected,
  pending,
  onToggleTool,
  onChangeOther,
  onSelectNone,
  onAdvance,
  ctaLabel,
}: Props) {
  const otherInputId = useId();
  const llms = ONBOARDING_TOOLS.filter((t) => t.category === "llm");
  const ides = ONBOARDING_TOOLS.filter((t) => t.category === "ide");
  const otherActive = toolsOther.trim().length > 0;

  return (
    <div className="flex flex-col gap-8">
      <SparkLine emphasis="lead">{copy.sparkIntro}</SparkLine>

      <ToolsSection
        heading={copy.llmHeading}
        tools={llms}
        selected={selected}
        disabled={pending || noneSelected}
        onToggle={onToggleTool}
      />

      <ToolsSection
        heading={copy.ideHeading}
        tools={ides}
        selected={selected}
        disabled={pending || noneSelected}
        onToggle={onToggleTool}
      />

      <div className="flex flex-col gap-3">
        <label
          htmlFor={otherInputId}
          className={cn(
            // Same recipe as the tag-cloud cards above so the whole
            // cloud reads as one consistent surface.
            "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ease-out",
            otherActive
              ? "border-primary bg-primary-light/40"
              : "border-border bg-surface hover:border-primary hover:bg-primary-light/30",
            !(pending || noneSelected) &&
              "hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
            // focus-within so the ring fires when the inner input gets
            // keyboard focus — same trick as ChoiceCard.
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
            (pending || noneSelected) && "cursor-not-allowed opacity-60",
          )}
        >
          <span aria-hidden="true" className="text-xl">＋</span>
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-semibold text-text-primary">
              {copy.optionOther}
            </span>
            <input
              id={otherInputId}
              type="text"
              spellCheck={false}
              maxLength={TOOLS_OTHER_MAX}
              placeholder={copy.otherPlaceholder}
              value={toolsOther}
              disabled={pending || noneSelected}
              onChange={(e) => onChangeOther(e.target.value)}
              className="border-none bg-transparent p-0 text-sm text-text-secondary outline-none placeholder:text-text-muted"
            />
          </span>
        </label>

        <button
          type="button"
          onClick={onSelectNone}
          aria-pressed={noneSelected}
          disabled={pending}
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ease-out",
            // When picked, the pill is filled orange — a bg tint preview
            // would clash, so hover here is scale-only. Idle pill behaves
            // like the rest of the cloud.
            noneSelected
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-text-primary hover:border-primary hover:bg-primary-light/30",
            !pending &&
              "cursor-pointer hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            pending && "cursor-not-allowed opacity-60",
          )}
        >
          <span className="text-sm font-semibold">🚫 {copy.optionNone}</span>
        </button>
      </div>

      <div>
        <PrimaryCta onClick={onAdvance} pending={pending}>
          {ctaLabel}
        </PrimaryCta>
      </div>
    </div>
  );
}

interface SectionProps {
  heading: string;
  tools: readonly ToolMeta[];
  selected: string[];
  disabled: boolean;
  onToggle: (slug: string) => void;
}

function ToolsSection({
  heading,
  tools,
  selected,
  disabled,
  onToggle,
}: SectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        {heading}
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {tools.map((tool) => {
          const active = selected.includes(tool.slug);
          return (
            <li key={tool.slug}>
              <button
                type="button"
                onClick={() => onToggle(tool.slug)}
                aria-pressed={active}
                disabled={disabled}
                className={cn(
                  // Base: layout + 200ms ease-out so border, bg AND
                  // transform animate together. Was `transition-colors`
                  // before, which silently dropped the scale animation.
                  "group flex w-full items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 text-left transition-all duration-200 ease-out",
                  // Selected vs idle: selected keeps the orange border +
                  // glow on hover; idle gets a brand-orange border + faint
                  // tint preview to signal "click me".
                  active
                    ? "border-primary shadow-[0_0_0_3px_rgba(232,112,63,0.12)]"
                    : "border-border hover:border-primary hover:bg-primary-light/30",
                  // Tactile feedback: hover scale-up (1.02), active
                  // scale-down (0.98). Applied independently of selected
                  // state, so even already-picked tools acknowledge the
                  // mouse. Touch devices skip hover and go straight to
                  // active on tap (browser default). prefers-reduced-motion
                  // users see only the colour transitions, no transform.
                  !disabled &&
                    "cursor-pointer hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
                  // A11y focus ring — same recipe as PrimaryCta so
                  // keyboard navigation reads consistently across the
                  // onboarding flow.
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={tool.icon}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {tool.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
