"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface NodeModalAction {
  label: string;
  href: string;
}

export interface NodeModalContent {
  eyebrow: string;
  title: string;
  body: string;
  stat: string | null;
  primary: NodeModalAction | null;
  /** Visual tone — `pro` styles the CTA in pro-accent purple. */
  tone?: "default" | "pro" | "bonus";
}

interface Props {
  content: NodeModalContent;
  onClose: () => void;
  closeAria: string;
}

export function MapNodeDetailsModal({ content, onClose, closeAria }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tone = content.tone ?? "default";
  const ctaClass = cn(
    "inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-heading text-sm font-bold text-white transition",
    tone === "pro" && "bg-pro-accent hover:opacity-90",
    tone === "bonus" && "bg-warning hover:opacity-90",
    tone === "default" && "bg-primary hover:bg-primary-hover",
  );

  const eyebrowClass = cn(
    "text-xs font-bold uppercase tracking-[0.18em]",
    tone === "pro" && "text-pro-accent",
    tone === "bonus" && "text-warning",
    tone === "default" && "text-primary",
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-node-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface p-7 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeAria}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </button>

        <p className={eyebrowClass}>{content.eyebrow}</p>

        <h2
          id="map-node-modal-title"
          className="mt-3 font-heading text-2xl font-bold leading-tight text-text-primary"
        >
          {content.title}
        </h2>

        <p className="mt-3 text-sm text-text-secondary">{content.body}</p>

        {content.stat && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-xp-gold/10 px-3 py-1.5 font-mono text-sm font-semibold text-text-primary">
            <span className="text-xp-gold" aria-hidden>
              ⚡
            </span>
            {content.stat}
          </p>
        )}

        {content.primary && (
          <Link href={content.primary.href} className={cn(ctaClass, "mt-6")}>
            {content.primary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
