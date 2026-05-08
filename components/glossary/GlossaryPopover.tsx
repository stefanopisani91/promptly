"use client";

// Floating panel that explains a glossary term in Spark's voice.
//
// Two variants chosen at runtime by viewport width:
//   - Desktop (≥ 768px): popover anchored to the trigger span. Uses
//     getBoundingClientRect() to compute placement (above vs below)
//     based on available room. Portal'd to document.body so the popover
//     escapes any parent `overflow: hidden` (lesson cards sometimes clip).
//   - Mobile (< 768px): bottom sheet with backdrop, slides up from the
//     bottom. Drag-handle on top is visual only (no swipe-to-dismiss yet
//     — backdrop tap and X both close).
//
// Animations: CSS keyframes (defined in globals.css). No framer-motion.
// Esc + outside click + X all close. The "approfondisci" button calls
// the provider's openChatWithDraft and closes the popover.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { useGlossary } from "./GlossaryProvider";
import {
  type GlossaryTerm,
  definitionForTerm,
  labelForTerm,
} from "@/lib/glossary/glossary";

interface Props {
  term: GlossaryTerm;
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
}

interface DesktopPlacement {
  top: number;
  left: number;
  // Whether the popover sits above or below the trigger — drives the
  // arrow direction (down arrow when above, up arrow when below).
  arrow: "down" | "up";
}

const POPOVER_WIDTH = 360;
const POPOVER_VERT_GAP = 10;
const VIEWPORT_PAD = 12;

export function GlossaryPopover({ term, anchorRef, onClose }: Props) {
  const ctx = useGlossary();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false,
  );
  const [desktopPlacement, setDesktopPlacement] =
    useState<DesktopPlacement | null>(null);
  // Defer rendering the portal until mount so SSR doesn't try to access
  // document. The boolean flips on first effect.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Desktop placement — computed after mount + on resize/scroll.
  useLayoutEffect(() => {
    if (isMobile) return;
    if (!anchorRef.current) return;
    const compute = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Centre horizontally on the trigger, then clamp to viewport.
      let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
      left = Math.max(VIEWPORT_PAD, Math.min(left, vw - POPOVER_WIDTH - VIEWPORT_PAD));
      // Pick above when there's at least 200px above; otherwise below.
      const spaceAbove = rect.top;
      const spaceBelow = vh - rect.bottom;
      const above = spaceAbove > 240 && spaceAbove >= spaceBelow;
      // We don't know the popover height yet — but it's bounded around
      // 220px for the typical 1-3 sentence definition. Read measured
      // height after first paint to refine if needed.
      const measuredH = panelRef.current?.offsetHeight ?? 220;
      const top = above
        ? rect.top - measuredH - POPOVER_VERT_GAP
        : rect.bottom + POPOVER_VERT_GAP;
      setDesktopPlacement({
        top,
        left,
        arrow: above ? "down" : "up",
      });
    };
    compute();
    // Re-compute on scroll/resize. Throttling skipped — these events
    // are infrequent for the duration the popover is open.
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [isMobile, anchorRef]);

  // Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Outside-click on desktop. (Mobile uses an explicit backdrop element.)
  useEffect(() => {
    if (isMobile) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    // Defer to next tick so the click that opened the popover doesn't
    // immediately close it (it bubbles to document after our setState).
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onClick);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onClick);
    };
  }, [isMobile, anchorRef, onClose]);

  if (!mounted || !ctx) return null;

  const lang = ctx.lang;
  const label = labelForTerm(term, lang);
  const definition = definitionForTerm(term, lang);

  function handleAskMore() {
    if (!ctx) return;
    const draft = ctx.strings.prefillTemplate.replace("{term}", label);
    ctx.openChatWithDraft(draft);
    onClose();
  }

  if (isMobile) {
    return createPortal(
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="glossary-backdrop absolute inset-0 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          className="glossary-bottom-sheet relative w-full max-w-xl rounded-t-3xl border border-orange-200 bg-white shadow-xl"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
        >
          <div className="flex items-center justify-center pt-2">
            <span
              className="block h-1 w-10 rounded-full bg-stone-300"
              aria-label={ctx.strings.bottomSheetGrabberLabel}
              role="presentation"
            />
          </div>
          <PopoverBody
            label={label}
            definition={definition}
            eyebrow={ctx.strings.popoverEyebrow}
            deeperCta={ctx.strings.deeperCta}
            closeLabel={ctx.strings.closeLabel}
            seen={ctx.seenTerms.has(term.id)}
            onClose={onClose}
            onAskMore={handleAskMore}
          />
        </div>
      </div>,
      document.body,
    );
  }

  // Desktop popover.
  if (!desktopPlacement) {
    // First paint: render the panel off-screen so we can measure it. The
    // useLayoutEffect re-positions it before the user can perceive the
    // jump.
    return createPortal(
      <div
        ref={panelRef}
        className="glossary-popover-desktop fixed -top-[9999px] -left-[9999px] z-[60] w-[360px] rounded-2xl border border-orange-200 bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="false"
      >
        <PopoverBody
          label={label}
          definition={definition}
          eyebrow={ctx.strings.popoverEyebrow}
          deeperCta={ctx.strings.deeperCta}
          closeLabel={ctx.strings.closeLabel}
          seen={ctx.seenTerms.has(term.id)}
          onClose={onClose}
          onAskMore={handleAskMore}
        />
      </div>,
      document.body,
    );
  }
  return createPortal(
    <div
      ref={panelRef}
      className="glossary-popover-desktop fixed z-[60] w-[360px] rounded-2xl border border-orange-200 bg-white p-5 shadow-xl"
      style={{
        top: desktopPlacement.top,
        left: desktopPlacement.left,
      }}
      role="dialog"
      aria-modal="false"
    >
      <PopoverArrow side={desktopPlacement.arrow} />
      <PopoverBody
        label={label}
        definition={definition}
        eyebrow={ctx.strings.popoverEyebrow}
        deeperCta={ctx.strings.deeperCta}
        closeLabel={ctx.strings.closeLabel}
        seen={ctx.seenTerms.has(term.id)}
        onClose={onClose}
        onAskMore={handleAskMore}
      />
    </div>,
    document.body,
  );
}

function PopoverArrow({ side }: { side: "up" | "down" }) {
  // Triangle drawn with two adjacent border tricks: a 12×12 square
  // rotated 45deg, with two of its sides matching the popover's border
  // colour. Side="up" → arrow points up (popover is below trigger);
  // side="down" → arrow points down (popover is above trigger).
  return (
    <span
      className={`absolute left-1/2 -translate-x-1/2 ${
        side === "up" ? "-top-[7px]" : "-bottom-[7px]"
      }`}
      aria-hidden="true"
    >
      <span
        className="block h-3 w-3 rotate-45 border border-orange-200 bg-white"
        style={
          side === "up"
            ? { borderTopColor: "#FED7AA", borderLeftColor: "#FED7AA", borderBottomColor: "transparent", borderRightColor: "transparent" }
            : { borderBottomColor: "#FED7AA", borderRightColor: "#FED7AA", borderTopColor: "transparent", borderLeftColor: "transparent" }
        }
      />
    </span>
  );
}

function PopoverBody({
  label,
  definition,
  eyebrow,
  deeperCta,
  closeLabel,
  seen,
  onClose,
  onAskMore,
}: {
  label: string;
  definition: string;
  eyebrow: string;
  deeperCta: string;
  closeLabel: string;
  seen: boolean;
  onClose: () => void;
  onAskMore: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:p-0">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary-deep">
          <Sparkles size={12} aria-hidden="true" />
          <span>{eyebrow}</span>
          {seen && (
            <span className="ml-1 text-[10px] font-normal italic text-stone-400">
              ✓
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="-m-1 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          <X size={16} />
        </button>
      </div>
      <p className="font-heading text-lg font-semibold text-text-primary">
        {label}
      </p>
      <p className="text-sm leading-relaxed text-text-secondary">{definition}</p>
      <button
        type="button"
        onClick={onAskMore}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary-light px-4 py-2 text-sm font-medium text-primary-deep transition-all hover:bg-primary-light/70 active:scale-[0.97]"
      >
        {deeperCta}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
