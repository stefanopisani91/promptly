"use client";

// Inline clickable glossary term. Renders the visible label inside a
// span styled like a highlighter pen (yellow band on the bottom 40% of
// the line-height). Click → opens GlossaryPopover anchored to the span;
// outside-click / Esc / X / "approfondisci" close it.
//
// The "already seen" attenuated style (lower opacity highlight) kicks
// in via context.seenTerms; mark-as-seen is fired the first time the
// popover opens — but only if the user actually keeps it open for at
// least 500ms, to avoid logging accidental click-throughs.

import { useEffect, useRef, useState } from "react";
import { useGlossary } from "./GlossaryProvider";
import { GlossaryPopover } from "./GlossaryPopover";
import { getGlossaryTerm } from "@/lib/glossary/glossary";

interface Props {
  termId: string;
  // Visible text — may differ from the canonical label (e.g. when the
  // wrapped word is conjugated: "dipendenze" while the term is "dipendenza").
  children: React.ReactNode;
}

const MARK_AS_SEEN_DELAY_MS = 500;

export function GlossaryTerm({ termId, children }: Props) {
  const ctx = useGlossary();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const markTimerRef = useRef<number | null>(null);

  // Cleanup pending dwell timer on unmount. Must be declared before any
  // early return so React's hook order stays stable when the provider
  // / dictionary lookup falls through to the plain-text fallback below.
  useEffect(() => {
    return () => {
      if (markTimerRef.current !== null) {
        window.clearTimeout(markTimerRef.current);
      }
    };
  }, []);

  // No provider in scope → render the children as plain inline text.
  // Lets us drop <GlossaryTerm> into pages outside lessons without
  // crashing; just degrades gracefully.
  if (!ctx) {
    return <>{children}</>;
  }
  const term = getGlossaryTerm(termId);
  if (!term) {
    // Authoring bug — markup references an id that's not in the dictionary.
    // Render plain text so the lesson still reads correctly.
    return <>{children}</>;
  }

  const seen = ctx.seenTerms.has(termId);

  function handleClick() {
    setOpen((prev) => {
      if (prev) {
        if (markTimerRef.current !== null) {
          window.clearTimeout(markTimerRef.current);
          markTimerRef.current = null;
        }
        return false;
      }
      // Just-opened: schedule the mark-as-seen call. If the user closes
      // the popover within 500ms (accidental tap), the timer is cleared
      // and we don't pollute glossary_seen.
      if (!seen) {
        markTimerRef.current = window.setTimeout(() => {
          ctx?.markSeen(termId);
          markTimerRef.current = null;
        }, MARK_AS_SEEN_DELAY_MS);
      }
      return true;
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`glossary-term ${seen ? "glossary-term-seen" : ""}`}
      >
        {children}
      </button>
      {open && (
        <GlossaryPopover
          term={term}
          anchorRef={triggerRef}
          onClose={() => {
            if (markTimerRef.current !== null) {
              window.clearTimeout(markTimerRef.current);
              markTimerRef.current = null;
              // User closed within the dwell window → don't mark seen.
            }
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
