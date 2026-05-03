import type { SectionHeadingBlock } from "@/types";

interface Props {
  block: SectionHeadingBlock;
}

/**
 * V2 block: in-lesson section divider. Renders as a small uppercase eyebrow
 * + larger heading, with optional subtitle. Used to chunk longer V2 lessons
 * into named chapters without inflating the page hierarchy (h2-level).
 */
export function SectionHeading({ block }: Props) {
  return (
    <header className="flex flex-col gap-1.5 border-t border-border/60 pt-6">
      {block.subtitle ? (
        <>
          <p className="eyebrow text-primary-deep">
            {block.text}
          </p>
          <h2 className="font-heading text-lg font-semibold leading-snug text-text-primary sm:text-xl">
            {block.subtitle}
          </h2>
        </>
      ) : (
        <h2 className="font-heading text-lg font-semibold leading-snug text-text-primary sm:text-xl">
          {block.text}
        </h2>
      )}
    </header>
  );
}
