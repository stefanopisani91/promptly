"use client";

import Image from "next/image";
import { ideToolsFromSlugs } from "@/lib/onboarding/tools";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { cn } from "@/lib/utils";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine, SparkMicro } from "../SparkLine";

interface Props {
  copy: ProfilingCopy["step7"];
  toolsSelected: string[];
  value: string | null;
  // True only after the user has explicitly clicked an option (including
  // "none"). The shell owns this flag because `value === null` cannot
  // distinguish "untouched" from "explicit none". See ProfilingShell.tsx.
  picked: boolean;
  pending: boolean;
  onChange: (next: string | null) => void;
  onAdvance: () => void;
  ctaLabel: string;
}

export function Step7PreferredTool({
  copy,
  toolsSelected,
  value,
  picked,
  pending,
  onChange,
  onAdvance,
  ctaLabel,
}: Props) {
  const candidates = ideToolsFromSlugs(toolsSelected);
  const noneActive = picked && value === null;

  return (
    <div className="flex flex-col gap-6">
      <SparkLine emphasis="lead">{copy.sparkIntro}</SparkLine>

      <fieldset className="flex flex-col gap-3" disabled={pending}>
        <legend className="sr-only">{copy.sparkIntro}</legend>
        {candidates.map((tool) => {
          const active = value === tool.slug;
          return (
            <label
              key={tool.slug}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-2xl border bg-surface px-4 py-3 transition-colors",
                active
                  ? "border-primary shadow-[0_0_0_3px_rgba(232,112,63,0.12)]"
                  : "border-border hover:border-primary/60",
                pending && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name="preferred-tool"
                checked={active}
                onChange={() => onChange(tool.slug)}
                className="sr-only"
              />
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={tool.icon}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </span>
              <span className="flex-1 text-base font-medium text-text-primary">
                {tool.name}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  active ? "border-primary" : "border-border",
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    active ? "bg-primary" : "bg-transparent",
                  )}
                />
              </span>
            </label>
          );
        })}

        <label
          className={cn(
            "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors",
            noneActive
              ? "border-primary bg-primary-light/40"
              : "border-border bg-surface hover:border-primary/60",
            pending && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            type="radio"
            name="preferred-tool"
            checked={noneActive}
            onChange={() => onChange(null)}
            className="sr-only"
          />
          <span className="text-sm font-medium text-text-primary">
            {copy.optionNone}
          </span>
        </label>
      </fieldset>

      <SparkMicro>{copy.sparkMicro}</SparkMicro>

      <div>
        <PrimaryCta onClick={onAdvance} pending={pending} disabled={!picked}>
          {ctaLabel}
        </PrimaryCta>
      </div>
    </div>
  );
}
