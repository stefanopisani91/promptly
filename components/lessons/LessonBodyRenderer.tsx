"use client";

import { useState } from "react";
import { TheoryRenderer } from "@/components/lessons/TheoryRenderer";
import { SectionHeading } from "@/components/lessons/SectionHeading";
import {
  OpenQuestion,
  type OpenQuestionStrings,
} from "@/components/lessons/OpenQuestion";
import {
  ArchetypeQuiz,
  type ArchetypeQuizStrings,
} from "@/components/lessons/ArchetypeQuiz";
import type { LessonV2BodyBlock, TheoryBlock } from "@/types";

export interface LessonBodyStrings {
  openQuestion: OpenQuestionStrings;
  archetypeQuiz: ArchetypeQuizStrings;
}

interface Props {
  lessonId: string;
  body: LessonV2BodyBlock[];
  strings: LessonBodyStrings;
  // Bubbled up so the lesson page can compose engagement signals (which
  // questions answered, which quiz revealed) for analytics + completion.
  onAnswered?: (questionId: string) => void;
  onSkipped?: (questionId: string) => void;
  onRevealed?: (quizId: string, archetypeKey: string) => void;
}

const STATIC_THEORY_TYPES = new Set([
  "paragraph",
  "callout",
  "example",
  "simulated_output",
  "comparison_table",
  "quote",
]);

function isStaticTheoryBlock(block: LessonV2BodyBlock): block is TheoryBlock {
  return STATIC_THEORY_TYPES.has(block.type);
}

/**
 * V2 body renderer. Walks the lesson body in document order and dispatches
 * each block to the right renderer. Static blocks (paragraph, callout, ...)
 * go through the existing TheoryRenderer; interactive blocks
 * (open_question, archetype_quiz, section_heading) get their dedicated
 * components.
 *
 * Static blocks are rendered together when adjacent to keep TheoryRenderer's
 * vertical spacing intact, instead of one-by-one wrapping which would
 * compound the gap.
 */
export function LessonBodyRenderer({
  lessonId,
  body,
  strings,
  onAnswered,
  onSkipped,
  onRevealed,
}: Props) {
  const [, forceRerender] = useState(0);
  // Suppress lint for unused var: we keep setState in scope for potential
  // future "scroll-to-next-question" jumps without restructuring props.
  void forceRerender;

  // Group consecutive static blocks together so TheoryRenderer's gap
  // styling stays consistent.
  const groups: Array<
    | { kind: "static"; blocks: TheoryBlock[]; key: string }
    | { kind: "interactive"; block: LessonV2BodyBlock; key: string }
  > = [];

  for (let i = 0; i < body.length; i++) {
    const block = body[i];
    if (isStaticTheoryBlock(block)) {
      const last = groups[groups.length - 1];
      if (last && last.kind === "static") {
        last.blocks.push(block);
      } else {
        groups.push({ kind: "static", blocks: [block], key: `static-${i}` });
      }
    } else {
      groups.push({ kind: "interactive", block, key: `${block.type}-${i}` });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        if (group.kind === "static") {
          return <TheoryRenderer key={group.key} blocks={group.blocks} />;
        }
        const block = group.block;
        switch (block.type) {
          case "section_heading":
            return <SectionHeading key={group.key} block={block} />;
          case "open_question":
            return (
              <OpenQuestion
                key={group.key}
                lessonId={lessonId}
                block={block}
                strings={strings.openQuestion}
                onAnswered={onAnswered}
                onSkipped={onSkipped}
              />
            );
          case "archetype_quiz":
            return (
              <ArchetypeQuiz
                key={group.key}
                block={block}
                strings={strings.archetypeQuiz}
                onRevealed={onRevealed}
              />
            );
          // Static block types (paragraph/callout/example/...) are caught by
          // the "static" group branch above and never reach here. Render nothing
          // defensively if a block somehow slipped through.
          default:
            return null;
        }
      })}
    </div>
  );
}
