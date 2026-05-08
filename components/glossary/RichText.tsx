"use client";

// Renders a paragraph string that may contain Glossario Vivo markup
// (`[[term:<id>]]testo[[/term]]`) into a span tree where the wrapped
// fragments become <GlossaryTerm /> components.
//
// Plain strings without any markup short-circuit through hasGlossaryMarkup
// so the typical lesson paragraph pays zero parsing cost. Drop-in
// replacement for `{paragraphs[i]}` in any text-rendering step.

import { Fragment } from "react";
import { hasGlossaryMarkup, parseGlossaryMarkup } from "@/lib/glossary/markup";
import { GlossaryTerm } from "./GlossaryTerm";

interface Props {
  text: string;
}

export function RichText({ text }: Props) {
  if (!hasGlossaryMarkup(text)) {
    return <>{text}</>;
  }
  const nodes = parseGlossaryMarkup(text);
  return (
    <>
      {nodes.map((node, i) => {
        if (node.kind === "text") {
          return <Fragment key={i}>{node.text}</Fragment>;
        }
        return (
          <GlossaryTerm key={i} termId={node.id}>
            {node.text}
          </GlossaryTerm>
        );
      })}
    </>
  );
}
