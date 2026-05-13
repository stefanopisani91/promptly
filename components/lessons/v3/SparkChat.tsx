"use client";

// Free-chat modal with Spark.
//
// Visual design (May 2026 refresh):
//   - Enters from ABOVE with a bounce — like a speech bubble dropped by Spark.
//   - Speech-bubble tail at the top-right of the panel pointing toward Spark's
//     position in SparkHeader.
//   - No orange inside the conversation: user bubbles are dark charcoal,
//     send button is gold (Spark's colour family), textarea uses neutral focus.
//   - Empty state is a full hero: big Spark + bold "Chiedimi pure!" so the
//     modal feels alive from the first frame.

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import type { PathSlug } from "@/types";
import { track } from "@/lib/analytics/posthog";
import { Spark } from "./Spark";

// "Helper mode": when the panel is opened on a V3 quick-win step it talks
// to /api/spark-helper instead of /api/spark-chat — a tutor scoped to that
// exercise (per-widget anti-leak context, its own quota, never gives the
// answer) plus the widget's quick-question chips. Same panel UI, different
// brain. LessonV3View flips it on for helper-enabled interactive steps.
export interface SparkHelperStrings {
  // Panel title while in helper mode (instead of the plain "Spark").
  panelTitle: string;
  // Spark's opening line in the empty state (replaces the free-chat hint).
  intro: string;
  // Gentle "you've talked plenty" nudge — per-quick-win cap hit.
  quotaQuickWinHit: string;
  // "come back tomorrow" — per-day helper cap hit.
  quotaDailyHit: string;
  // 503 — the helper's DB columns aren't provisioned yet.
  unavailable: string;
  // widgetKey -> up to 4 stable quick-question chips.
  suggestions: Record<string, readonly string[]>;
  // Inline link that appears under the latest reply once the chips
  // collapse (after the first send) — lets the user pull them back.
  showSuggestionsLabel: string;
  hideSuggestionsLabel: string;
}

export interface SparkChatStrings {
  launcherLabel: string;
  modalTitle: string;
  modalSubtitleTemplate: string;
  closeLabel: string;
  placeholder: string;
  sendCta: string;
  sending: string;
  emptyHero: string;
  emptyHint: string;
  quotaExhausted: string;
  dailyQuotaExhausted: string;
  networkError: string;
  apiError: string;
  unauthorized: string;
  hintExamples: string[];
}

interface ChatMessage {
  role: "user" | "spark";
  content: string;
}

interface Props {
  lessonId: string;
  // Authenticated user id, scoping the local chat-history cache so two
  // users on the same browser don't see each other's transcripts.
  userId: string;
  lessonTitle: string;
  stepIndex: number;
  totalSteps?: number;
  pathSlug?: PathSlug;
  remaining: number;
  totalLimit: number;
  strings: SparkChatStrings;
  // Optional prefill for the textarea. Used by the Glossario Vivo
  // "approfondisci" CTA so the chat opens with a ready-to-send question
  // about the clicked term. The user can still edit before sending.
  initialDraft?: string;
  // When set, the panel runs in "helper mode" for the named quick-win
  // widget — routes to /api/spark-helper, shows the widget's chips, uses
  // the helper's own quota messages. Absent => normal lesson-wide chat.
  // `currentPhase` is the (optional) per-widget phase computed by the
  // parent from the widget's persisted state — see LessonV3View's
  // `helperPhase`. POSTed to the route so Spark can focus on the right
  // sub-task (e.g. recovery vs pivot in lesson 5). `previousAttempt` is
  // only meaningful on `currentPhase === "between_attempts"`; the route
  // drops it otherwise.
  helper?: {
    widgetKey: string;
    strings: SparkHelperStrings;
    currentPhase?: string | null;
    previousAttempt?: {
      score: number;
      weakness: string | null;
      sparkReply: string | null;
    } | null;
  };
  onClose: () => void;
  onMessageSent: (newRemaining: number) => void;
}

export function SparkChat({
  lessonId,
  userId,
  lessonTitle,
  stepIndex,
  totalSteps = 14,
  pathSlug = "mindset",
  remaining,
  totalLimit,
  strings,
  initialDraft,
  helper,
  onClose,
  onMessageSent,
}: Props) {
  // Helper mode caps a message at 200 chars (the /api/spark-helper
  // contract) and replays the last few turns; free chat allows 600 and
  // sends no history.
  const maxChars = helper ? 200 : 600;
  // Per-user, per-lesson key (per-widget too in helper mode, so the tutor
  // transcript doesn't bleed into the free-chat one). The remaining
  // counter is server-authoritative so transcript replay can't cheat the
  // quota — this cache is purely UX so the user sees their history when
  // reopening the panel in the same browser session.
  const historyStorageKey = helper
    ? `spark-helper:${userId}:${lessonId}:${helper.widgetKey}`
    : `spark-chat:${userId}:${lessonId}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = window.sessionStorage.getItem(historyStorageKey);
      if (!cached) return [];
      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (m): m is ChatMessage =>
          typeof m === "object" &&
          m !== null &&
          (m.role === "user" || m.role === "spark") &&
          typeof m.content === "string",
      );
    } catch {
      return [];
    }
  });
  // User's explicit override on the chip visibility. Helper-mode only:
  //   null  → derive from messages.length (collapsed iff there's history)
  //   "show" → user pulled the chips back via the inline link
  //   "hide" → user explicitly hid them again after expanding
  // Persisted per-widget so re-opening the panel preserves the choice; a
  // new lesson / widget key gets a fresh `null` because the storage key
  // includes widgetKey.
  const suggestionsPrefStorageKey = helper
    ? `${historyStorageKey}:suggestions`
    : null;
  const [userSuggestionPref, setUserSuggestionPref] = useState<
    "show" | "hide" | null
  >(() => {
    if (typeof window === "undefined" || !suggestionsPrefStorageKey) return null;
    try {
      const v = window.sessionStorage.getItem(suggestionsPrefStorageKey);
      return v === "show" || v === "hide" ? v : null;
    } catch {
      return null;
    }
  });
  // Seed the textarea with `initialDraft` when present (e.g. Glossario
  // Vivo's "approfondisci" CTA). The seed runs once at mount; subsequent
  // changes to the prop don't replace what the user has typed.
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Helper-mode quota state — separate from the free chat's `remaining`
  // prop. Set when /api/spark-helper answers a 403.
  const [helperCapped, setHelperCapped] = useState<"quick_win" | "daily" | null>(
    null,
  );
  // Tracks the current visualViewport height so the panel can shrink when
  // the iOS virtual keyboard appears. `null` = no measurement yet (SSR /
  // first paint) → fall back to the CSS dvh-based formula.
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fire-once when the panel opens in helper mode. The panel remounts
  // (key=chatOpenSeq in LessonV3View) on every open, so [] is the right
  // dep list — "on mount" == "on open".
  useEffect(() => {
    if (helper) {
      track({
        name: "spark_helper_opened",
        props: { widget: helper.widgetKey, lesson_id: lessonId },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock the page scroll while the modal is open. Without this, swiping
  // inside the chat on iOS scrolls the lesson page underneath the modal.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Mirror window.visualViewport.height into state so the panel can resize
  // when the iOS virtual keyboard opens. 100dvh in CSS only adapts to the
  // URL bar — it does NOT shrink when the keyboard appears, which would
  // otherwise leave the textarea hidden behind the keyboard. Reading
  // visualViewport on every resize/scroll covers both cases.
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const update = () => setVvHeight(vv.height);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, sending]);

  // Persist the in-memory transcript so closing and reopening the chat
  // (same browser session) shows the previous turns. sessionStorage —
  // not localStorage — so it clears with the tab. The historyStorageKey
  // is user+lesson-scoped to avoid the cross-user leak we fixed earlier
  // for the CLAUDE.md draft.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(historyStorageKey, JSON.stringify(messages));
    } catch {
      /* sessionStorage may be disabled (private mode) — silent skip */
    }
  }, [messages, historyStorageKey]);

  // Persist the chip-visibility override per widget so re-opening the
  // panel within the same quick-win keeps the user's choice.
  useEffect(() => {
    if (typeof window === "undefined" || !suggestionsPrefStorageKey) return;
    try {
      if (userSuggestionPref === null) {
        window.sessionStorage.removeItem(suggestionsPrefStorageKey);
      } else {
        window.sessionStorage.setItem(
          suggestionsPrefStorageKey,
          userSuggestionPref,
        );
      }
    } catch {
      /* private mode — silent skip */
    }
  }, [userSuggestionPref, suggestionsPrefStorageKey]);

  // Source of `text`: the textarea (send()) or a tapped chip (helper mode).
  async function sendText(
    text: string,
    opts?: { fromChip?: boolean; chipIndex?: number },
  ) {
    const trimmed = text.trim().slice(0, maxChars);
    if (sending || trimmed.length < 2) return;
    if (helper ? helperCapped !== null : remaining <= 0) return;
    if (helper && opts?.fromChip && typeof opts.chipIndex === "number") {
      track({
        name: "spark_helper_suggestion_clicked",
        props: { widget: helper.widgetKey, suggestion_index: opts.chipIndex },
      });
    }
    // The helper wants `message` = current turn, `history` = the turns
    // before it. `messages` here is still the pre-append value.
    const priorHistory = helper ? messages.slice(-6) : [];
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setDraft("");
    setSending(true);
    setError(null);
    try {
      const res = helper
        ? await fetch("/api/spark-helper", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonId,
              pathSlug,
              widgetKey: helper.widgetKey,
              message: trimmed,
              history: priorHistory,
              currentPhase: helper.currentPhase ?? null,
              previousAttempt: helper.previousAttempt ?? null,
            }),
          })
        : await fetch("/api/spark-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonId,
              pathSlug,
              lessonTitle,
              stepIndex,
              totalSteps,
              message: trimmed,
            }),
          });
      if (!res.ok) {
        if (res.status === 401) { setError(strings.unauthorized); return; }
        if (res.status === 403) {
          let errorCode: string | undefined;
          try {
            const errBody = (await res.json()) as { error?: string };
            errorCode = errBody.error;
          } catch { /* keep errorCode undefined */ }
          if (helper) {
            const scope =
              errorCode === "daily_quota_exceeded" ? "daily" : "quick_win";
            setHelperCapped(scope);
            track({
              name: "spark_helper_quota_hit",
              props: { widget: helper.widgetKey, scope },
            });
            // The cap message is shown by the input-area banner (isExhausted),
            // not as an error line — don't double it up.
          } else {
            setError(
              errorCode === "daily_quota_exceeded"
                ? strings.dailyQuotaExhausted
                : strings.quotaExhausted,
            );
            onMessageSent(0);
          }
          return;
        }
        if (res.status === 503) {
          setError(helper ? helper.strings.unavailable : strings.networkError);
          return;
        }
        if (res.status === 502) { setError(strings.networkError); return; }
        setError(strings.apiError);
        return;
      }
      const body = (await res.json()) as {
        reply?: string;
        remaining?: number;
        missedPersonalization?: boolean;
      };
      if (typeof body.reply !== "string") { setError(strings.apiError); return; }
      setMessages((prev) => [...prev, { role: "spark", content: body.reply! }]);
      if (helper) {
        track({
          name: "spark_helper_message_sent",
          props: { widget: helper.widgetKey, from_suggestion: Boolean(opts?.fromChip) },
        });
        // Server-flagged personalization miss (BUG 2 audit). Fire-and-forget;
        // purely diagnostic, no user-visible effect.
        if (body.missedPersonalization === true) {
          track({
            name: "spark_helper_missed_personalization",
            props: { widget: helper.widgetKey, lesson_id: lessonId },
          });
        }
      } else if (typeof body.remaining === "number") {
        onMessageSent(body.remaining);
      }
    } catch {
      setError(strings.networkError);
    } finally {
      setSending(false);
    }
  }

  function send() {
    void sendText(draft);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const subtitle = strings.modalSubtitleTemplate
    .replace("{remaining}", String(remaining))
    .replace("{limit}", String(totalLimit));

  const isEmpty = messages.length === 0;
  // In helper mode the chat's per-lesson `remaining` is irrelevant — the
  // tutor has its own quota, surfaced via helperCapped after a 403.
  const isExhausted = helper ? helperCapped !== null : remaining <= 0;
  const exhaustedMessage = helper
    ? helperCapped === "daily"
      ? helper.strings.quotaDailyHit
      : helper.strings.quotaQuickWinHit
    : strings.quotaExhausted;
  const panelTitle = helper ? helper.strings.panelTitle : strings.modalTitle;
  const chips = helper
    ? helper.strings.suggestions[helper.widgetKey] ?? []
    : [];
  // Chip visibility resolves as: explicit user override wins; otherwise
  // collapse as soon as there's any transcript (i.e. after the first chip
  // tap or first send). Free-chat panels never collapse — chips are a
  // helper-only affordance.
  const chipsCollapsed =
    helper && chips.length > 0
      ? userSuggestionPref === "hide" ||
        (userSuggestionPref === null && messages.length > 0)
      : false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={panelTitle}
      // Top offset is tight on mobile so the panel can use the full
      // visualViewport height — when the iOS keyboard opens we drop to
      // ~280-350px of usable space and a 72px top padding crushed the
      // body to zero. Desktop keeps the comfortable 72px breathing room.
      className="fixed inset-0 z-70 flex items-start justify-center px-4 pt-4 sm:pt-[72px]"
      style={{ zIndex: 70 }}
    >
      {/* ── Backdrop ── */}
      <button
        type="button"
        aria-label={strings.closeLabel}
        onClick={onClose}
        className="spark-chat-backdrop absolute inset-0 cursor-pointer border-none"
        style={{ background: "rgba(10, 14, 20, 0.60)", backdropFilter: "blur(3px)" }}
      />

      {/* ── Panel ── */}
      {/* Height precedence:
          - vvHeight present (modern browsers): use the full visualViewport
            height minus a tiny safety margin (32px) so the iOS keyboard
            can open without crushing the messages area to 0. Previously
            we subtracted 88px which, combined with a 72px top padding,
            left only ~190px of usable panel on a keyboard-open viewport
            and the chat history disappeared entirely.
          - vvHeight null (SSR / older browsers): CSS-only fallback to
            100dvh, which handles Safari's URL bar correctly. */}
      <div
        className="spark-chat-panel relative flex w-full max-w-md flex-col border border-border bg-surface shadow-2xl"
        style={{
          height:
            vvHeight !== null
              ? `${Math.min(580, vvHeight - 32)}px`
              : "min(580px, calc(100dvh - 32px))",
          borderRadius: "28px",
        }}
      >
        {/* Speech-bubble tail — moved further right to point toward Spark */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "-9px",
            right: "32px",
            width: "18px",
            height: "18px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRight: "none",
            borderBottom: "none",
            borderRadius: "3px 0 0 0",
            transform: "rotate(45deg)",
            zIndex: 1,
          }}
        />

        {/* ── Header — no Spark icon here, it lives only in the body ── */}
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-5" style={{ borderRadius: "28px 28px 0 0" }}>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate font-heading text-sm font-semibold text-text-primary">
              {panelTitle}
            </p>
            {/* The free-chat quota subtitle is meaningless in helper mode
                (the tutor has its own budget) — hide it there. */}
            {!helper && (
              <p className="text-[11px] text-text-muted">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.closeLabel}
            // 44×44 touch target (Apple HIG). The X glyph stays visually
            // small at 16px — only the hit area expands.
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted"
          >
            <X size={16} />
          </button>
        </header>

        {/* ── Messages area ── */}
        {/* min-h-0 is load-bearing: a flex child has min-height: auto by
            default, which equals min-content size — the section refuses to
            shrink below its content height, so a long Spark reply pushes
            the header and input out of the panel and breaks all clicks.
            min-h-0 lets flex-1 actually shrink, letting overflow-y-auto
            kick in and produce the expected internal scroll.
            We also enforce a minimum visible height on small viewports
            (mobile, keyboard open) so the chat history is always at
            least a few lines tall — never the zero-px collapse that
            users reported on production. */}
        <div
          ref={scrollRef}
          className="flex min-h-[120px] flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:min-h-0 sm:px-5"
        >
          {isEmpty && isExhausted ? (
            /* Quota esaurita senza storico — nessuna chat da mostrare */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4 text-center">
              <Spark state="sad" size={56} ariaLabel="Spark" />
              <p className="font-heading text-lg font-semibold text-text-primary">
                Nessuna conversazione
              </p>
              <p className="max-w-xs text-sm italic text-text-secondary">
                {exhaustedMessage}
              </p>
            </div>
          ) : isEmpty ? (
            /* Hero empty state — "Chiedimi pure!" (helper mode: Spark's
               intro line; the quick-question chips live in the input area
               below so they stay reachable after the first message). */
            <div className="flex flex-1 flex-col items-center justify-center gap-5 py-4 text-center">
              <div style={{ animation: "completion-spark-pop 380ms cubic-bezier(0.34,1.56,0.64,1) both" }}>
                <Spark state="happy" size={72} ariaLabel="Spark" />
              </div>
              <div style={{ animation: "completion-fade-up 300ms ease-out 160ms both" }}>
                <p className="font-heading text-2xl font-bold leading-tight text-text-primary">
                  {strings.emptyHero}
                </p>
                <p className="mt-2 text-sm italic text-text-secondary">
                  {helper ? helper.strings.intro : strings.emptyHint}
                </p>
              </div>
              {!helper && (
                <ul
                  className="flex flex-col gap-2"
                  style={{ animation: "completion-fade-up 300ms ease-out 300ms both" }}
                >
                  {strings.hintExamples.map((h, i) => (
                    <li key={i} className="text-xs italic text-text-muted before:mr-2 before:content-['·']">
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <p className="eyebrow text-text-muted">
                    {m.role === "user" ? "tu" : "spark"}
                  </p>
                  <p
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-tr-sm font-medium text-white"
                        : "rounded-tl-sm bg-primary-light/50 italic text-text-primary"
                    }`}
                    style={
                      m.role === "user"
                        ? { background: "#1f2937" }
                        : undefined
                    }
                  >
                    {m.content}
                  </p>
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2">
                  <Spark state="thinking" size={24} />
                  <p className="text-xs italic text-text-muted">{strings.sending}</p>
                </div>
              )}
              {error && (
                <p role="status" className="text-xs italic text-error">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Input area / read-only notice ── */}
        {isExhausted ? (
          /* Quota esaurita — banner sola lettura senza Spark (già nel body) */
          <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border bg-surface-muted/40 px-4 py-3 sm:px-5" style={{ borderRadius: "0 0 28px 28px" }}>
            {helper && <Spark state="happy" size={24} ariaLabel="Spark" />}
            <p className="text-xs italic text-text-secondary">
              {exhaustedMessage}
            </p>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-surface px-4 py-3 sm:px-5" style={{ borderRadius: "0 0 28px 28px" }}>
            {/* Helper mode: the quick-question chips. Stable per widget,
                always reachable (not just in the empty state) — tapping one
                sends it like a typed message. Collapsed after the first
                tap/send so the textarea + send button stay visible on
                small screens; a discreet inline link pulls them back. */}
            {helper && chips.length > 0 && (
              chipsCollapsed ? (
                <button
                  type="button"
                  onClick={() => setUserSuggestionPref("show")}
                  className="self-start px-0 py-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
                >
                  + {helper.strings.showSuggestionsLabel}
                </button>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {chips.map((chip, i) => (
                      <button
                        key={chip}
                        type="button"
                        disabled={sending}
                        onClick={() => void sendText(chip, { fromChip: true, chipIndex: i })}
                        className="rounded-full border border-border bg-surface-muted/60 px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-50 disabled:hover:bg-surface-muted/60"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUserSuggestionPref("hide")}
                      className="self-start px-0 py-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
                    >
                      − {helper.strings.hideSuggestionsLabel}
                    </button>
                  )}
                </div>
              )
            )}
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, maxChars))}
              onKeyDown={onKeyDown}
              placeholder={strings.placeholder}
              disabled={sending}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-surface-muted/30 p-3 text-sm leading-relaxed text-text-primary placeholder:text-text-muted transition-colors focus-visible:border-text-muted focus-visible:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || draft.trim().length < 2}
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all hover:brightness-105 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
              style={{ background: "var(--xp-gold)", color: "#1a1100" }}
            >
              {sending ? strings.sending : strings.sendCta}
              {!sending && <Send size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
