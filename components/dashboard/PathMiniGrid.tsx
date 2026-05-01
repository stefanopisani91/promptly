// 5 path thumbnails with mini progress bars — sits above the LearningMap
// as a quick at-a-glance navigation. Click jumps to the next available
// lesson in that path (when unlocked + has content).
//
// On lg+ screens this duplicates info already shown on the horizontal map;
// kept here per request — TODO ask user if they want to keep it after
// trying the dashboard a few times.

import Image from "next/image";
import Link from "next/link";
import { Check, Crown, Lock } from "lucide-react";

import type { AuthCopy } from "@/lib/i18n/auth";
import type { MapData, MapPathSection } from "@/lib/map/data";
import type { PathSlug } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  paths: MapData["paths"];
  copy: AuthCopy["dashboard"]["pathsGrid"];
}

const PATH_NUMBER: Record<PathSlug, number> = {
  mindset: 1,
  prompt: 2,
  build: 3,
  debug: 4,
  ship: 5,
};

const ICON_BY_SLUG: Record<PathSlug, string> = {
  mindset: "/brand/icon-path-mindset.svg",
  prompt: "/brand/icon-path-prompt.svg",
  build: "/brand/icon-path-build.svg",
  debug: "/brand/icon-path-debug.svg",
  ship: "/brand/icon-path-ship.svg",
};

function findFirstAvailableHref(section: MapPathSection): string | null {
  // First node that has an href (current/available) — that's where the
  // user would land if they tap the thumbnail.
  for (const node of section.nodes) {
    if (node.href) return node.href;
  }
  return null;
}

export function PathMiniGrid({ paths, copy }: Props) {
  return (
    <section aria-labelledby="paths-grid-heading">
      <div className="mb-3 flex items-baseline justify-between">
        <h2
          id="paths-grid-heading"
          className="font-heading text-base font-bold text-text-primary"
        >
          {copy.title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {paths.map((path) => {
          const href = findFirstAvailableHref(path);
          const pct =
            path.totalLessons > 0
              ? path.completedLessons / path.totalLessons
              : 0;
          const isLocked = !path.isUnlocked && !path.isPro;
          const isProLocked = path.isPro && !path.isUnlocked;
          const isInteractive = !!href && !isLocked && !isProLocked;

          const inner = (
            <article
              className={cn(
                "flex h-full flex-col rounded-2xl border border-[#d1d5db] bg-surface p-3 shadow-sm transition-all sm:p-4",
                isInteractive && "hover:-translate-y-0.5 hover:shadow-md",
                (isLocked || isProLocked) && "opacity-70",
              )}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="rounded-xl bg-primary-light p-1.5">
                  <Image
                    src={ICON_BY_SLUG[path.slug]}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7"
                    aria-hidden
                  />
                </div>
                {path.isCompletedAll ? (
                  <Check
                    className="h-4 w-4 text-success"
                    strokeWidth={3}
                    aria-label={copy.completedBadge}
                  />
                ) : isProLocked ? (
                  <Crown className="h-4 w-4 text-pro-accent" aria-hidden />
                ) : isLocked ? (
                  <Lock className="h-4 w-4 text-text-muted" aria-hidden />
                ) : null}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                Path {PATH_NUMBER[path.slug]}
              </p>
              <p className="mt-0.5 font-heading text-sm font-semibold text-text-primary">
                {path.title}
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    path.isCompletedAll ? "bg-success" : "bg-primary",
                  )}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-text-muted">
                {path.completedLessons} / {path.totalLessons}
              </p>
            </article>
          );

          if (isInteractive && href) {
            return (
              <Link key={path.slug} href={href} className="block h-full">
                {inner}
              </Link>
            );
          }
          return (
            <div
              key={path.slug}
              className="h-full"
              title={
                isProLocked
                  ? "Pro"
                  : isLocked
                  ? copy.lockedHint
                  : undefined
              }
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
