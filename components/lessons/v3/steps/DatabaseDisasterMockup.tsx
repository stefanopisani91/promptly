"use client";

// Cartoonish mock of a database admin UI that "breaks" before the user's
// eyes — the seed scenario for Lesson 4's constraints quick-win.
//
// Visual style: dark surface (#1C1C1C / #21252B chrome), green accent
// (#3ECF8E) inspired by Supabase Studio but intentionally NOT using the
// real logo or screenshots. A dashed banner at the top reminds the user
// it's a simulation. The disaster (the 🔥 emoji on the `users` table +
// the error banner on the right) is animated in with a small shake.
//
// On a verdict that "would_have_prevented" the disaster (excellent), the
// mockup repairs itself: 🔥 fades out, the error banner slides away, the
// row turns green. Used as positive reinforcement at the end of step 13.

import { useEffect, useState } from "react";
import { AlertTriangle, Database, Sparkles } from "lucide-react";

interface Props {
  // "broken" (default on first paint) drives the break animation.
  // "repaired" plays the dissolve / fix animation when the user lands
  // an excellent verdict.
  state: "broken" | "repaired";
  // Localised strings — IT/EN, pre-resolved by the parent so the mockup
  // stays language-agnostic.
  strings: DatabaseDisasterStrings;
}

export interface DatabaseDisasterStrings {
  // Dashed banner at the top.
  simulationBadge: string;
  // App-bar title (top of the chrome).
  windowTitle: string;
  // Sidebar label above the tables list.
  sidebarLabel: string;
  // Active table name.
  activeTable: string;
  // Other (inert) tables — kept short, two of them.
  otherTables: string[];
  // Right-pane title.
  paneTitle: string;
  // Error banner short label.
  errorLabel: string;
  // Error banner long description (1-2 sentences).
  errorDescription: string;
  // Records / backup metadata lines (key:value pairs rendered inline).
  recordsAffected: string;
  recordsCount: string;
  lastBackup: string;
  lastBackupValue: string;
  // Repair-state pill text shown after the verdict ("Disaster prevented").
  preventedLabel: string;
}

export function DatabaseDisasterMockup({ state, strings }: Props) {
  // Hold the disaster state for at least one paint after mount so the
  // entrance animation actually runs. Without this, the FIRST paint
  // shows the "broken" elements instantly without animation.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(t);
  }, []);

  const isRepaired = state === "repaired";

  return (
    <div className="db-disaster-frame relative rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-2 sm:p-3">
      {/* "Simulation" disclaimer — absolutely required (Lezione4_Blueprint.md
          §"Vincoli del componente"). Sits inside the dashed border so the
          user reads "fake" before they read the disaster. */}
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
        <AlertTriangle size={11} aria-hidden="true" />
        <span>{strings.simulationBadge}</span>
      </div>

      {/* The fake window — chrome bar + sidebar + active pane. Colours
          intentionally "Supabase-flavoured" (greens) without the brand
          marks. */}
      <div
        className={`db-disaster-window ${
          mounted && !isRepaired ? "db-disaster-shake" : ""
        } overflow-hidden rounded-lg border border-stone-700 bg-[#1C1C1C] text-stone-200 shadow-lg`}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between gap-2 border-b border-black/40 bg-[#21252B] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="block h-2.5 w-2.5 rounded-full bg-[#FF5F57]" aria-hidden="true" />
            <span className="block h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" aria-hidden="true" />
            <span className="block h-2.5 w-2.5 rounded-full bg-[#28C840]" aria-hidden="true" />
            <p className="ml-2 font-mono text-[11px] font-medium text-stone-300">
              {strings.windowTitle}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles size={11} className="text-[#3ECF8E]" aria-hidden="true" />
            <span className="font-mono text-[10px] text-stone-400">AI</span>
          </div>
        </div>

        <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr]">
          {/* Sidebar */}
          <aside className="border-r border-black/40 bg-[#16181C] p-3">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-500">
              <Database size={11} aria-hidden="true" />
              <span>{strings.sidebarLabel}</span>
            </p>
            <ul className="flex flex-col gap-1">
              <li
                className={`flex items-center justify-between rounded px-2 py-1 font-mono text-[11px] transition-colors ${
                  isRepaired
                    ? "bg-[#0F2B1F] text-[#3ECF8E]"
                    : "bg-[#3A1715] text-rose-200"
                }`}
              >
                <span className="truncate">{strings.activeTable}</span>
                <span aria-hidden="true">
                  {isRepaired ? (
                    <span className="text-[#3ECF8E]">✓</span>
                  ) : (
                    <span className="db-disaster-fire">🔥</span>
                  )}
                </span>
              </li>
              {strings.otherTables.map((t) => (
                <li
                  key={t}
                  className="rounded px-2 py-1 font-mono text-[11px] text-stone-400"
                >
                  {t}
                </li>
              ))}
            </ul>
          </aside>

          {/* Active pane — error banner + metadata */}
          <main className="flex flex-col gap-3 p-3 sm:p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-stone-500">
              {strings.paneTitle}: {strings.activeTable}
            </p>

            {/* Error / repaired banner */}
            <div
              className={`db-disaster-banner relative overflow-hidden rounded-md border p-3 text-[12px] leading-relaxed transition-all ${
                isRepaired
                  ? "border-[#3ECF8E]/40 bg-[#0F2B1F]/60 text-[#3ECF8E]"
                  : "border-rose-500/40 bg-[#3A1715]/60 text-rose-100"
              }`}
            >
              <div className="flex items-start gap-2">
                {isRepaired ? (
                  <Sparkles
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[#3ECF8E]"
                  />
                ) : (
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="db-disaster-alert mt-0.5 shrink-0 text-rose-400"
                  />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-wider">
                    {isRepaired ? strings.preventedLabel : strings.errorLabel}
                  </p>
                  {!isRepaired && (
                    <p className="font-mono text-[11px] leading-relaxed">
                      {strings.errorDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata lines */}
            {!isRepaired && (
              <div className="db-disaster-meta grid grid-cols-1 gap-1 font-mono text-[11px] text-stone-400 sm:grid-cols-2">
                <p>
                  <span className="text-stone-500">{strings.recordsAffected}: </span>
                  <span className="text-rose-200">{strings.recordsCount}</span>
                </p>
                <p>
                  <span className="text-stone-500">{strings.lastBackup}: </span>
                  <span className="text-stone-300">{strings.lastBackupValue}</span>
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
