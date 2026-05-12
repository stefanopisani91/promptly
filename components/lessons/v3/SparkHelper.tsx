"use client";

// Spark Helper — the contextual tutor that lives INSIDE a V3 quick-win
// widget (lessons 2-6). Manual-trigger only: a small floating "Spark,
// aiutami" button sits at the bottom-right of the interactive step; tapping
// it opens a panel (bottom-sheet on phone, drawer on desktop) where the
// learner can ask about a term, ask for an example, or get a nudge — never
// the answer. Distinct from the free chat (`SparkChat`, lesson-wide): this
// one is scoped to the exercise, doesn't consume quick-win attempts, and
// disappears once the quick-win is finished.
//
// Backed by /api/spark-helper (auth-gated, double-quota, server-only
// scenario brief). This component never imports lib/lessons/v3/
// spark-helper-config.ts — that's server-only; the widgets it shows a
// trigger for are simply the ones with chips in strings.suggestions.
//
// IMPORTANT for new widgets: a quick-win gets a Spark Helper as soon as it
// has an entry in `strings.suggestions` AND in SPARK_HELPER_WIDGETS on the
// server. Keep the two lists in sync.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import type { PathSlug } from "@/types";
import { track } from "@/lib/analytics/posthog";
import { Spark } from "./Spark";

export interface SparkHelperStrings {
  triggerLabel: string;
  triggerSubLabel: string;
  panelTitle: string;
  intro: string;
  inputPlaceholder: string;
  sendCta: string;
  sending: string;
  closeLabel: string;
  quotaQuickWinHit: string;
  quotaDailyHit: string;
  unauthorized: string;
  unavailable: string;
  networkError: string;
  apiError: string;
  suggestions: Record<string, readonly string[]>;
}

interface HelperMessage {
  role: "user" | "spark";
  content: string;
}

const MAX_MESSAGE_CHARS = 200;
// History the panel keeps in memory / replays to the server. The server
// re-clamps anyway; this just bounds the local list.
const MAX_HISTORY_TURNS = 6;

interface HostProps {
  /** Quick-win widget key — e.g. "broken_session_debugger". */
  widgetKey: string;
  lessonId: string;
  pathSlug: PathSlug;
  strings: SparkHelperStrings;
}

export function SparkHelperHost({
  widgetKey,
  lessonId,
  pathSlug,
  strings,
}: HostProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Re-focus the trigger when the panel closes (so keyboard users land
  // somewhere sane).
  const handleClose = useCallback(() => {
    setOpen(false);
    // Defer so the panel has unmounted before we move focus.
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    track({
      name: "spark_helper_opened",
      props: { widget: widgetKey, lesson_id: lessonId },
    });
  }, [widgetKey, lessonId]);

  return (
    <>
      {!open && (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpen}
          title={strings.triggerSubLabel}
          aria-haspopup="dialog"
          className="spark-helper-trigger fixed right-3 bottom-[calc(env(safe-area-inset-bottom,0px)+6.25rem)] z-40 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text-primary shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:right-6 sm:bottom-6"
        >
          <Spark state="idle" size={22} />
          <span>{strings.triggerLabel}</span>
        </button>
      )}

      {open && (
        <SparkHelperPanel
          widgetKey={widgetKey}
          lessonId={lessonId}
          pathSlug={pathSlug}
          strings={strings}
          onClose={handleClose}
        />
      )}
    </>
  );
}

interface PanelProps extends HostProps {
  onClose: () => void;
}

type CapHit = "quick_win" | "daily" | null;

function SparkHelperPanel({
  widgetKey,
  lessonId,
  pathSlug,
  strings,
  onClose,
}: PanelProps) {
  const [messages, setMessages] = useState<HelperMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capHit, setCapHit] = useState<CapHit>(null);

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Synchronous lock against double-submit — `sending` (state) updates
  // async, so a fast double-tap could fire two calls. Mirrors the pattern
  // in the quick-win widgets.
  const inFlightRef = useRef(false);

  const chips = strings.suggestions[widgetKey] ?? [];
  const disabled = sending || capHit !== null;

  // Esc closes; Tab stays trapped inside the panel; body scroll locked
  // while open. One document-level listener so we don't need an onKeyDown
  // on a non-interactive <div> (which the a11y linter — rightly — dislikes).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const insidePanel = active instanceof Node && panelRef.current.contains(active);
      if (!insidePanel) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Autofocus the input on open.
  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, []);

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  const send = useCallback(
    async (text: string, fromSuggestion: boolean, suggestionIndex?: number) => {
      const trimmed = text.trim();
      if (inFlightRef.current || disabled || trimmed.length < 2) return;
      if (fromSuggestion && typeof suggestionIndex === "number") {
        track({
          name: "spark_helper_suggestion_clicked",
          props: { widget: widgetKey, suggestion_index: suggestionIndex },
        });
      }
      inFlightRef.current = true;
      setSending(true);
      setError(null);
      const priorHistory = messages.slice(-MAX_HISTORY_TURNS);
      try {
        const res = await fetch("/api/spark-helper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            pathSlug,
            widgetKey,
            message: trimmed.slice(0, MAX_MESSAGE_CHARS),
            history: priorHistory,
          }),
        });
        if (!res.ok) {
          let body: { error?: string } = {};
          try {
            body = (await res.json()) as { error?: string };
          } catch {
            /* ignore */
          }
          if (res.status === 403 && body.error === "quota_exceeded") {
            setCapHit("quick_win");
            track({
              name: "spark_helper_quota_hit",
              props: { widget: widgetKey, scope: "quick_win" },
            });
          } else if (res.status === 403 && body.error === "daily_quota_exceeded") {
            setCapHit("daily");
            track({
              name: "spark_helper_quota_hit",
              props: { widget: widgetKey, scope: "daily" },
            });
          } else if (res.status === 401) {
            setError(strings.unauthorized);
          } else if (res.status === 503) {
            setError(strings.unavailable);
          } else if (res.status === 502) {
            setError(strings.networkError);
          } else {
            setError(strings.apiError);
          }
          return;
        }
        const body = (await res.json()) as { reply?: string };
        if (!body.reply) {
          setError(strings.apiError);
          return;
        }
        setMessages((prev) => [
          ...prev,
          { role: "user", content: trimmed.slice(0, MAX_MESSAGE_CHARS) },
          { role: "spark", content: body.reply as string },
        ]);
        setDraft("");
        track({
          name: "spark_helper_message_sent",
          props: { widget: widgetKey, from_suggestion: fromSuggestion },
        });
      } catch {
        setError(strings.networkError);
      } finally {
        setSending(false);
        inFlightRef.current = false;
      }
    },
    [disabled, lessonId, messages, pathSlug, strings, widgetKey],
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft, false);
    }
  }

  const capMessage =
    capHit === "quick_win"
      ? strings.quotaQuickWinHit
      : capHit === "daily"
      ? strings.quotaDailyHit
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-stretch sm:justify-end"
    >
      <button
        type="button"
        aria-label={strings.closeLabel}
        onClick={onClose}
        className="spark-helper-overlay absolute inset-0 cursor-pointer border-none"
        style={{ background: "rgba(10, 14, 20, 0.5)", backdropFilter: "blur(2px)" }}
      />

      <div
        ref={panelRef}
        className="spark-helper-panel relative flex max-h-[85vh] w-full flex-col border border-border bg-surface shadow-2xl sm:max-h-none sm:h-full sm:w-[min(420px,100vw)] sm:border-y-0 sm:border-r-0"
        style={{ borderRadius: "24px 24px 0 0" }}
      >
        {/* On desktop the drawer is full-height with no top radius. */}
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-5">
          <Spark state="listening" size={36} />
          <h2
            id={titleId}
            className="flex-1 truncate font-heading text-sm font-semibold text-text-primary"
          >
            {strings.panelTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.closeLabel}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex min-h-[140px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:min-h-0 sm:px-5"
        >
          {messages.length === 0 && (
            <p className="text-sm italic leading-relaxed text-text-secondary">
              {strings.intro}
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <p className="eyebrow text-text-muted">
                {m.role === "user" ? "tu" : "spark"}
              </p>
              <p
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-tr-sm bg-text-primary font-medium text-white"
                    : "rounded-tl-sm bg-primary-light/50 italic text-text-primary"
                }`}
              >
                {m.content}
              </p>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2">
              <Spark state="thinking" size={26} />
              <p className="text-xs italic text-text-muted">{strings.sending}</p>
            </div>
          )}
          {error && (
            <p role="status" className="text-xs italic text-error">
              {error}
            </p>
          )}
        </div>

        {capMessage ? (
          <div className="flex shrink-0 items-start gap-2 border-t border-border bg-surface-muted/40 px-4 py-3 sm:px-5">
            <Spark state="happy" size={26} />
            <p className="text-sm italic leading-relaxed text-text-secondary">
              {capMessage}
            </p>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-surface px-4 py-3 sm:px-5">
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip, i) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={disabled}
                    onClick={() => void send(chip, true, i)}
                    className="rounded-full border border-border bg-surface-muted/60 px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-50 disabled:hover:bg-surface-muted/60"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
                onKeyDown={onInputKeyDown}
                placeholder={strings.inputPlaceholder}
                rows={2}
                disabled={disabled}
                className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border bg-surface-muted/40 px-3 py-2 text-sm leading-relaxed text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void send(draft, false)}
                disabled={disabled || draft.trim().length < 2}
                aria-label={strings.sendCta}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-xp-gold text-text-primary transition-all hover:brightness-95 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
              >
                {sending ? (
                  <Sparkles size={16} className="animate-pulse" aria-hidden />
                ) : (
                  <Send size={16} aria-hidden />
                )}
              </button>
            </div>
            <p className="text-right text-[10px] text-text-muted">
              {draft.length}/{MAX_MESSAGE_CHARS}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
