"use client";

// Renders a paragraph string that may contain:
//   - Glossario Vivo markup: `[[term:<id>]]testo[[/term]]` → clickable term
//   - Inline bold markdown: `**testo**` → <strong> (semibold + primary text)
//
// The two markups compose: `[[term:diff]]**diff**[[/term]]` works,
// `prima del **TASK**` works, etc. Plain strings (no markup at all)
// short-circuit so the typical lesson paragraph pays zero parsing
// cost. Drop-in replacement for `{paragraphs[i]}` in any text-rendering step.

import { Fragment } from "react";
import { hasGlossaryMarkup, parseGlossaryMarkup } from "@/lib/glossary/markup";
import { GlossaryTerm } from "./GlossaryTerm";

interface Props {
  text: string;
}

export function RichText({ text }: Props) {
  const hasGlossary = hasGlossaryMarkup(text);
  const hasBold = text.includes("**");
  // Fast path — no inline markup of any kind.
  if (!hasGlossary && !hasBold) {
    return <>{text}</>;
  }
  // Run the glossary parser first (or wrap the whole thing in a single
  // text node when there's no glossary markup), then process bold inside
  // each text segment.
  const nodes = hasGlossary
    ? parseGlossaryMarkup(text)
    : [{ kind: "text" as const, text }];
  return (
    <>
      {nodes.map((node, i) => {
        if (node.kind === "text") {
          return <Fragment key={i}>{renderInlineBold(node.text)}</Fragment>;
        }
        return (
          <GlossaryTerm key={i} termId={node.id}>
            {renderInlineBold(node.text)}
          </GlossaryTerm>
        );
      })}
    </>
  );
}

// Splits a string on `**bold**` segments and returns React nodes. The
// regex disallows asterisks inside the bold body so a stray `**` in
// prose can't accidentally swallow downstream text. Body text is
// `text-text-secondary`, so we lift the bold span up to `text-primary`
// + `font-semibold` for proper emphasis contrast.
const BOLD_RE = /\*\*([^*]+)\*\*/g;

function renderInlineBold(text: string): React.ReactNode {
  if (!text.includes("**")) return text;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  BOLD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = BOLD_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    parts.push(
      <strong key={key++} className="font-semibold text-text-primary">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return parts;
}
