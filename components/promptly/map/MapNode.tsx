"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Check, Crown, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PathSlug } from "@/types";
import type { MapNodeData } from "@/lib/map/data";
import type { MapCopy } from "@/lib/i18n/map";

import { MapNodeDetailsModal, type NodeModalContent } from "./MapNodeDetailsModal";

interface Props {
  node: MapNodeData;
  bioma: PathSlug;
  pathTitle: string;
  /** lesson-display index (1-based) shown inside the node when available */
  positionLabel: number;
  copy: MapCopy;
  /** Position styling from the layout helper. */
  bottomPx: number;
  leftPercent: number;
}

const NODE_SIZE_CLASS = "h-14 w-14 sm:h-16 sm:w-16";

export function MapNode({
  node,
  bioma,
  pathTitle,
  positionLabel,
  copy,
  bottomPx,
  leftPercent,
}: Props) {
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

  // Clickable states: completed/current/available navigate or open a modal;
  // locked nodes are non-interactive but still expose an accessible label.
  const accent = `var(--bioma-${bioma}-accent)`;

  const baseClasses = cn(
    "absolute flex shrink-0 items-center justify-center rounded-full border-2 font-heading text-base font-bold transition-transform",
    NODE_SIZE_CLASS,
  );

  const positionStyle: React.CSSProperties = {
    bottom: bottomPx,
    left: `${leftPercent}%`,
    transform: "translate(-50%, 50%)",
  };

  let content: ReactNode;
  let stateClass = "";
  let stateStyle: React.CSSProperties = {};

  switch (node.state) {
    case "completed": {
      content = <Check className="h-6 w-6 text-white" strokeWidth={3} aria-hidden />;
      stateClass = "border-transparent text-white shadow-md hover:scale-110";
      stateStyle = { background: accent };
      break;
    }
    case "current": {
      content = <span className="text-text-primary">{positionLabel}</span>;
      stateClass =
        "map-node-pulse border-primary bg-surface text-primary shadow-lg hover:scale-110";
      break;
    }
    case "available": {
      content = (
        <span style={{ color: accent }}>{positionLabel}</span>
      );
      stateClass = "bg-surface hover:scale-110";
      stateStyle = { borderColor: accent };
      break;
    }
    case "locked_sequential": {
      content = <Lock className="h-5 w-5 text-text-muted" aria-hidden />;
      stateClass = "border-border bg-surface-muted opacity-70";
      break;
    }
    case "locked_pro": {
      content = <Crown className="h-5 w-5 text-pro-accent" aria-hidden />;
      stateClass = "border-pro-accent bg-pro-light text-pro-accent";
      break;
    }
  }

  const sharedClasses = cn(baseClasses, stateClass);
  const accessibleLabel = node.title
    ? `${pathTitle} — ${node.title}`
    : `${pathTitle} — ${positionLabel}`;

  // Render: nav link / modal trigger / non-interactive — picked per state.
  let element: ReactNode;
  if (node.state === "completed") {
    element = (
      <button
        type="button"
        onClick={openCompletedModal}
        className={sharedClasses}
        style={{ ...positionStyle, ...stateStyle }}
        aria-label={accessibleLabel}
      >
        {content}
      </button>
    );
  } else if (node.state === "locked_pro") {
    element = (
      <button
        type="button"
        onClick={openProModal}
        className={sharedClasses}
        style={{ ...positionStyle, ...stateStyle }}
        aria-label={`${accessibleLabel} — ${copy.legend.pro}`}
      >
        {content}
      </button>
    );
  } else if ((node.state === "current" || node.state === "available") && node.href) {
    element = (
      <Link
        href={node.href}
        className={sharedClasses}
        style={{ ...positionStyle, ...stateStyle }}
        aria-label={accessibleLabel}
      >
        {content}
      </Link>
    );
  } else {
    // locked_sequential or any state without a target — render a span with
    // a native title tooltip rather than an inert button.
    element = (
      <span
        className={cn(sharedClasses, "cursor-not-allowed")}
        style={{ ...positionStyle, ...stateStyle }}
        title={`${accessibleLabel} — ${copy.legend.locked}`}
        aria-label={`${accessibleLabel} — ${copy.legend.locked}`}
      >
        {content}
      </span>
    );
  }

  return (
    <>
      {element}
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
