"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Clock, Crown, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Lang, PathSlug } from "@/types";
import type { MapNodeData } from "@/lib/map/data";
import { getMapCopy } from "@/lib/i18n/map";

import { MapNodeDetailsModal, type NodeModalContent } from "./MapNodeDetailsModal";

interface Props {
  node: MapNodeData;
  bioma: PathSlug;
  pathTitle: string;
  positionLabel: number;
  lang: Lang;
  topPx: number;
  leftPercent: number;
  /**
   * Where to anchor the hover popover relative to the node.
   * "top" places the card above the node, "bottom" below — chosen by the
   * caller based on the node's position in the section so the card never
   * gets clipped at the section edge.
   */
  popoverSide?: "top" | "bottom";
}

const NODE_SIZE_CLASS = "h-14 w-14 sm:h-16 sm:w-16";

/**
 * Animated SVG checkmark — draw-on effect via CSS stroke-dashoffset
 * animation. Replaces the static Lucide <Check> on completed nodes so
 * the check "writes itself" on every render (e.g. after a lesson is
 * just completed and the map re-renders).
 */
function AnimatedCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="white"
        strokeWidth={2.8}
        className="animate-check-draw"
      />
    </svg>
  );
}

export function MapNode({
  node,
  bioma,
  pathTitle,
  positionLabel,
  lang,
  topPx,
  leftPercent,
  popoverSide = "top",
}: Props) {
  const copy = getMapCopy(lang);
  const [modal, setModal] = useState<NodeModalContent | null>(null);

  function openCompletedModal() {
    setModal({
      eyebrow: pathTitle,
      title: copy.modal.completedTitle(node.title ?? ""),
      body: copy.modal.completedReviewSub,
      stat:
        node.xpEarned !== undefined
          ? copy.modal.completedXp(node.xpEarned)
          : null,
      primary: node.lessonId
        ? { label: copy.modal.completedReopenCta, href: `/lesson/${node.lessonId}` }
        : null,
    });
  }

  function openProModal() {
    setModal({
      eyebrow: pathTitle,
      title: copy.modal.proPathTitle(pathTitle),
      body: copy.modal.proPathDesc(pathTitle),
      stat: null,
      primary: { label: copy.modal.proCta, href: "/pro" },
      tone: "pro",
    });
  }

  function openComingSoonModal() {
    // No CTA — the close button is the only action. Mirrors the "bonus
    // unlocked but content not shipped yet" pattern used by MapBonusBadge.
    setModal({
      eyebrow: copy.modal.comingSoonEyebrow,
      title: copy.modal.comingSoonTitle(pathTitle),
      body: copy.modal.comingSoonDesc,
      stat: null,
      primary: null,
    });
  }

  const accent = `var(--bioma-${bioma}-accent)`;

  const baseClasses = cn(
    "flex shrink-0 items-center justify-center rounded-full border-2 font-heading text-base font-bold transition-transform",
    NODE_SIZE_CLASS,
  );

  let content: ReactNode;
  let stateClass = "";
  let stateStyle: React.CSSProperties = {};
  let stateLabel: string;
  let stateColor: string;

  switch (node.state) {
    case "completed": {
      content = <AnimatedCheck />;
      stateClass = "border-transparent text-white shadow-md hover:scale-110";
      stateStyle = { background: accent };
      stateLabel = copy.legend.completed;
      stateColor = "#16A34A";
      break;
    }
    case "current": {
      content = <span className="text-text-primary">{positionLabel}</span>;
      stateClass =
        "map-node-pulse border-primary bg-surface text-primary shadow-lg hover:scale-110";
      stateLabel = copy.legend.current;
      stateColor = "var(--primary)";
      break;
    }
    case "available": {
      content = <span style={{ color: accent }}>{positionLabel}</span>;
      stateClass = "bg-surface hover:scale-110";
      stateStyle = { borderColor: accent };
      stateLabel = copy.legend.current;
      stateColor = accent;
      break;
    }
    case "locked_sequential": {
      content = <Lock className="h-5 w-5 text-text-muted" aria-hidden />;
      stateClass = "border-border bg-surface-muted opacity-70";
      stateLabel = copy.legend.locked;
      stateColor = "var(--text-muted)";
      break;
    }
    case "locked_pro": {
      content = <Crown className="h-5 w-5 text-pro-accent" aria-hidden />;
      stateClass = "border-pro-accent bg-pro-light text-pro-accent";
      stateLabel = copy.legend.pro;
      stateColor = "var(--pro-accent)";
      break;
    }
    case "locked_coming_soon": {
      // Visually similar to locked_sequential (greyed out, lower
      // affordance) but uses a clock to signal "time-gated, not
      // prerequisite-gated", and the click opens a modal instead of
      // being inert.
      content = <Clock className="h-5 w-5 text-text-muted" aria-hidden />;
      stateClass = "border-border bg-surface-muted opacity-70";
      stateLabel = copy.legend.comingSoon;
      stateColor = "var(--text-muted)";
      break;
    }
  }

  const sharedClasses = cn(baseClasses, stateClass);
  const accessibleLabel = node.title
    ? `${pathTitle} — ${node.title}`
    : `${pathTitle} — ${positionLabel}`;

  // Inner element — link / button / span depending on state.
  let inner: ReactNode;
  if (node.state === "completed") {
    inner = (
      <button
        type="button"
        onClick={openCompletedModal}
        className={sharedClasses}
        style={stateStyle}
        aria-label={accessibleLabel}
      >
        {content}
      </button>
    );
  } else if (node.state === "locked_pro") {
    inner = (
      <button
        type="button"
        onClick={openProModal}
        className={sharedClasses}
        style={stateStyle}
        aria-label={`${accessibleLabel} — ${copy.legend.pro}`}
      >
        {content}
      </button>
    );
  } else if (node.state === "locked_coming_soon") {
    inner = (
      <button
        type="button"
        onClick={openComingSoonModal}
        className={sharedClasses}
        style={stateStyle}
        aria-label={`${accessibleLabel} — ${copy.legend.comingSoon}`}
      >
        {content}
      </button>
    );
  } else if ((node.state === "current" || node.state === "available") && node.href) {
    inner = (
      <Link
        href={node.href}
        className={sharedClasses}
        style={stateStyle}
        aria-label={accessibleLabel}
      >
        {content}
      </Link>
    );
  } else {
    inner = (
      <span
        className={cn(sharedClasses, "cursor-not-allowed")}
        style={stateStyle}
        title={`${accessibleLabel} — ${copy.legend.locked}`}
        aria-label={`${accessibleLabel} — ${copy.legend.locked}`}
      >
        {content}
      </span>
    );
  }

  // Hover popover — desktop-only (lg+). Hidden via Tailwind below the
  // breakpoint; on touch devices it'd be a UX regression to show on tap.
  const popoverClasses = cn(
    "pointer-events-none absolute left-1/2 z-30 hidden w-56 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 text-left opacity-0 shadow-lg transition-opacity duration-150",
    "lg:group-hover:block lg:group-hover:opacity-100",
    "lg:group-focus-within:block lg:group-focus-within:opacity-100",
    popoverSide === "top" ? "bottom-full mb-3" : "top-full mt-3",
  );

  return (
    <>
      <div
        className="group absolute"
        style={{
          top: topPx,
          left: `${leftPercent}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {inner}
        <div role="tooltip" className={popoverClasses}>
          <div className="mb-1 flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: stateColor }}
              aria-hidden
            />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: stateColor }}
            >
              {stateLabel}
            </span>
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {pathTitle}
            </span>
          </div>
          <p className="font-heading text-sm font-bold leading-snug text-text-primary">
            {node.title ?? `${pathTitle} ${positionLabel}`}
          </p>
          {node.xpEarned !== undefined && (
            <p className="mt-1 text-xs font-medium text-text-muted">
              ⚡ {node.xpEarned} XP
            </p>
          )}
        </div>
      </div>
      {modal && (
        <MapNodeDetailsModal
          content={modal}
          onClose={() => setModal(null)}
          closeAria={copy.modal.closeAria}
        />
      )}
    </>
  );
}
