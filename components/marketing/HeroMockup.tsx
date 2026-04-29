import { Check } from "lucide-react";
import { Fragment } from "react";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["hero"]["mockup"];
}

function renderPromptWithBlanks(template: string, blanks: string[]) {
  const parts = template.split("___");
  return parts.map((part, i) => {
    const blank = blanks[i];
    return (
      <Fragment key={i}>
        {part}
        {blank !== undefined && i < parts.length - 1 ? (
          <span className="rounded bg-prompt-fill-done/20 px-1.5 py-0.5 text-prompt-fill-done">
            {blank}
          </span>
        ) : null}
      </Fragment>
    );
  });
}

export function HeroMockup({ copy }: Props) {
  return (
    <div
      role="img"
      aria-label={`${copy.lessonStep}: ${copy.lessonTitle}`}
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-primary/10"
    >
      {/* Mac-style top bar */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <div className="ml-3 flex-1 truncate rounded-md bg-surface px-2 py-1 text-center text-[10px] text-text-muted">
          {copy.url}
        </div>
      </div>

      {/* App content */}
      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-deep">
            {copy.lessonStep}
          </p>
          <h3 className="font-heading text-base font-semibold text-text-primary">
            {copy.lessonTitle}
          </h3>
        </div>

        {/* Prompt area — dark per design system */}
        <div className="rounded-lg bg-prompt-bg p-3 font-mono text-[11px] leading-relaxed text-prompt-text">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-prompt-text/60">
            {copy.promptLabel}
          </p>
          <p>{renderPromptWithBlanks(copy.promptText, [copy.blank1, copy.blank2])}</p>
        </div>

        {/* Correct feedback */}
        <div className="flex items-center gap-2 rounded-md bg-success-light px-3 py-2 text-sm font-medium text-success">
          <Check className="h-4 w-4" strokeWidth={3} />
          {copy.correct}
        </div>
      </div>

      {/* XP toast — animated */}
      <div className="pointer-events-none absolute bottom-4 right-4">
        <div className="animate-xp-toast inline-flex items-center gap-1.5 rounded-full bg-text-primary px-3 py-1.5 text-xs font-bold text-white shadow-lg">
          <span className="text-xp-gold">⚡</span>
          {copy.xpToast}
        </div>
      </div>
    </div>
  );
}
