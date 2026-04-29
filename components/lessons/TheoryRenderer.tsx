import type { TheoryBlock } from "@/types";

interface Props {
  blocks: TheoryBlock[];
}

const calloutVariantStyles: Record<
  Exclude<TheoryBlock & { type: "callout" }, never>["variant"],
  string
> = {
  key: "border-primary/40 bg-primary/10 text-text-primary",
  warning: "border-warning/40 bg-warning/10 text-text-primary",
  tip: "border-success/40 bg-success-light/40 text-text-primary",
};

const calloutLabel: Record<"key" | "warning" | "tip", string> = {
  key: "💡",
  warning: "⚠️",
  tip: "✨",
};

export function TheoryRenderer({ blocks }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={idx}
                className="text-base leading-relaxed text-text-secondary sm:text-lg sm:leading-relaxed"
              >
                {block.text}
              </p>
            );

          case "quote":
            return (
              <figure
                key={idx}
                className="border-l-4 border-primary bg-primary/5 px-5 py-4"
              >
                <blockquote className="font-heading text-lg italic leading-relaxed text-text-primary sm:text-xl">
                  &ldquo;{block.text}&rdquo;
                </blockquote>
                <figcaption className="mt-2 text-sm text-text-muted">
                  — {block.attribution}
                </figcaption>
              </figure>
            );

          case "callout":
            return (
              <aside
                key={idx}
                className={`rounded-xl border px-5 py-4 ${calloutVariantStyles[block.variant]}`}
                role="note"
              >
                <p className="text-base leading-relaxed">
                  <span className="mr-2" aria-hidden>
                    {calloutLabel[block.variant]}
                  </span>
                  {block.text}
                </p>
              </aside>
            );

          case "example":
            return (
              <div
                key={idx}
                className="rounded-xl border border-border bg-surface-muted px-5 py-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-deep">
                  {block.label}
                </p>
                <p className="mt-2 text-base leading-relaxed text-text-secondary">
                  {block.text}
                </p>
              </div>
            );

          case "simulated_output":
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
              >
                <div className="border-b border-border bg-prompt-bg px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-prompt-text/60">
                    Prompt
                  </p>
                  <p className="mt-1 font-mono text-sm leading-relaxed text-prompt-text">
                    {block.prompt}
                  </p>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-text-secondary sm:text-sm">
                  {block.output}
                </pre>
              </div>
            );

          case "comparison_table":
            return (
              <div
                key={idx}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <div className="rounded-xl border border-error/30 bg-error/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-error">
                    {block.bad.label}
                  </p>
                  <p className="mt-2 font-mono text-sm leading-relaxed text-text-secondary">
                    {block.bad.content}
                  </p>
                </div>
                <div className="rounded-xl border border-success/30 bg-success-light/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-success">
                    {block.good.label}
                  </p>
                  <p className="mt-2 font-mono text-sm leading-relaxed text-text-secondary">
                    {block.good.content}
                  </p>
                </div>
              </div>
            );

          default: {
            const _exhaustive: never = block;
            void _exhaustive;
            return null;
          }
        }
      })}
    </div>
  );
}
