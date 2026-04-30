// Top-level orchestrator for the Learning Map. Server component — composes
// the path sections, the endgame (PathT), and renders the robot cursor at
// the user's current location.
//
// Render order is *reverse* progression order: PathT (endgame) → Ship →
// Debug → Build → Prompt → Mindset. The user starts at the bottom (the
// village) and climbs up.

import { Crown, Lock, Star } from "lucide-react";

import type { Lang } from "@/types";
import { describeUnlockState, getBonusPathsCopy } from "@/lib/i18n/bonus-paths";
import type { MapCopy } from "@/lib/i18n/map";
import type { MapData } from "@/lib/map/data";
import { cn } from "@/lib/utils";

import { MapSection } from "./MapSection";

interface Props {
  data: MapData;
  copy: MapCopy;
  lang: Lang;
  level: number;
}

export function LearningMap({ data, copy, lang, level }: Props) {
  // Render reversed: highest path first (top of the map).
  const sectionsTopDown = [...data.paths].reverse();

  return (
    <div
      role="region"
      aria-label="Learning map"
      className="-mx-4 overflow-hidden rounded-3xl border border-border bg-background sm:-mx-6"
    >
      <EndgameBanner endgame={data.endgame} copy={copy} lang={lang} />

      {sectionsTopDown.map((section) => {
        const isRobotInSection = data.current.pathSlug === section.slug;
        return (
          <MapSection
            key={section.slug}
            section={section}
            lang={lang}
            copy={copy}
            level={level}
            robotAtIndex={
              isRobotInSection ? data.current.lessonIndex : null
            }
            showStart={isRobotInSection && data.current.isAtStart}
          />
        );
      })}

      <ScrollHint copy={copy} />
    </div>
  );
}

// ─── Endgame banner (PathT) ─────────────────────────────────────────

interface EndgameBannerProps {
  endgame: MapData["endgame"];
  copy: MapCopy;
  lang: Lang;
}

function EndgameBanner({ endgame, copy, lang }: EndgameBannerProps) {
  const { bonus, unlock } = endgame;
  const bonusCopy = getBonusPathsCopy(lang);
  const stateLabel = unlock.unlocked
    ? bonusCopy.badge.unlocked
    : describeUnlockState(unlock, bonusCopy);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 px-6 py-10 text-center",
        "border-b border-[var(--bioma-endgame-accent)]/30",
      )}
      style={{
        background: `linear-gradient(to bottom, var(--bioma-endgame-bg), var(--bioma-bonus-bg))`,
      }}
    >
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-md",
          unlock.unlocked
            ? "border-[var(--bioma-endgame-accent)] bg-white text-[var(--bioma-endgame-accent)]"
            : "border-dashed border-[var(--bioma-endgame-accent)]/50 bg-white/70 text-[var(--bioma-endgame-accent)]/60",
        )}
      >
        {unlock.unlocked ? (
          <Star className="h-7 w-7" strokeWidth={2.5} aria-hidden />
        ) : (
          <Lock className="h-6 w-6" aria-hidden />
        )}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--bioma-endgame-accent)]">
        {copy.endgame.eyebrow}
      </p>
      <h2 className="font-heading text-xl font-bold text-text-primary">
        {lang === "it" ? bonus.title_it : bonus.title_en}
      </h2>
      <p className="max-w-md text-sm text-text-secondary">
        {copy.endgame.teaser}
      </p>
      <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[var(--bioma-endgame-accent)]">
        <Crown className="h-3 w-3" aria-hidden />
        {stateLabel}
      </p>
    </div>
  );
}

// ─── Scroll hint at the bottom of the map ───────────────────────────

function ScrollHint({ copy }: { copy: MapCopy }) {
  return (
    <p className="px-6 py-4 text-center font-mono text-[11px] text-text-muted">
      ↑ {copy.scrollHint}
    </p>
  );
}
