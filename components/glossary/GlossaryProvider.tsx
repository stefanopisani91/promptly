"use client";

// Context provider for the Glossario Vivo. Sits inside LessonV3View so
// every <GlossaryTerm /> rendered in the lesson body can:
//   - read the user's `seen` set (for the "already seen" attenuated
//     style — no extra DB roundtrip per term)
//   - mark a term as seen via a server action (idempotent at the DB
//     layer, so the optimistic local update is safe)
//   - open the lesson's SparkChat with a prefilled draft when the user
//     clicks "Vuoi che approfondisca?" — the chat ownership lives in
//     LessonV3View, this provider is the bridge.
//
// `lang` is forwarded so the popover doesn't need to import the i18n
// catalogue; we already have the full glossary in lib/glossary/glossary.ts
// and the popover just renders pre-resolved IT/EN strings.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Lang } from "@/types";
import { markGlossaryTermSeenAction } from "@/app/(app)/lesson/[id]/actions";

export interface GlossaryStrings {
  // Header eyebrow above the term name in the popover.
  popoverEyebrow: string;
  // Footer CTA — "Vuoi che approfondisca?" / "Want me to dig deeper?".
  deeperCta: string;
  // Aria-label for the close button.
  closeLabel: string;
  // Mobile drag-handle aria-label (no visual text).
  bottomSheetGrabberLabel: string;
  // Template that builds the prefilled chat message. {term} is replaced
  // with the IT/EN label of the clicked term.
  prefillTemplate: string;
}

interface GlossaryContextValue {
  lang: Lang;
  seenTerms: ReadonlySet<string>;
  markSeen: (termId: string) => void;
  openChatWithDraft: (draft: string) => void;
  strings: GlossaryStrings;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

interface ProviderProps {
  lang: Lang;
  initialSeen: string[];
  strings: GlossaryStrings;
  // Hooked into LessonV3View — when the user taps "approfondisci" we
  // call this with the prefilled draft string. The view then opens the
  // chat with the draft seeded into its input.
  onOpenChatWithDraft: (draft: string) => void;
  children: React.ReactNode;
}

export function GlossaryProvider({
  lang,
  initialSeen,
  strings,
  onOpenChatWithDraft,
  children,
}: ProviderProps) {
  // Seen ids start from the server-rendered profile and grow optimistically
  // as the user clicks new terms. The Set is recreated on every mutation
  // so consumers re-render on changes (a Set instance reused via mutation
  // would not trigger React updates).
  const [seenTerms, setSeenTerms] = useState<ReadonlySet<string>>(
    () => new Set(initialSeen),
  );

  const markSeen = useCallback((termId: string) => {
    setSeenTerms((prev) => {
      if (prev.has(termId)) return prev;
      const next = new Set(prev);
      next.add(termId);
      return next;
    });
    // Fire-and-forget — server action is idempotent. A failed write just
    // means the user's set is local-only until the next page load reloads
    // from the server; not worth surfacing an error.
    markGlossaryTermSeenAction({ termId }).catch(() => {
      /* silent */
    });
  }, []);

  const value = useMemo<GlossaryContextValue>(
    () => ({
      lang,
      seenTerms,
      markSeen,
      openChatWithDraft: onOpenChatWithDraft,
      strings,
    }),
    [lang, seenTerms, markSeen, onOpenChatWithDraft, strings],
  );

  return (
    <GlossaryContext.Provider value={value}>{children}</GlossaryContext.Provider>
  );
}

/**
 * Hook for components rendered inside <GlossaryProvider> (typically the
 * lesson body) to access the seen set, mark a term as seen, or open the
 * chat with a prefilled draft. Returns null if used outside the provider
 * — callers can fall back to "no glossary" rendering (plain text).
 */
export function useGlossary(): GlossaryContextValue | null {
  return useContext(GlossaryContext);
}
