"use client";

// Free-chat modal with Spark, mounted from LessonV3View when the user taps
// the floating "Ask Spark" launcher. Per-lesson quota is enforced server-
// side; this component only renders what's left and surfaces the proper
// error states. Conversation history is session-only (lives in component
// state) — refreshes the page wipe it. That's intentional: the lesson is
// the "source of truth" and Spark's chat is a side helper, not a journal.

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import type { PathSlug } from "@/types";
import { Spark } from "./Spark";

export interface SparkChatStrings {
  launcherLabel: string;
  modalTitle: string;
  modalSubtitleTemplate: string; // "{remaining} / {limit} messaggi rimasti"
  closeLabel: string;
  placeholder: string;
  sendCta: string;
  sending: string;
  emptyHint: string;
  quotaExhausted: string;
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
  lessonTitle: string;
  stepIndex: number;
  totalSteps?: number;
  pathSlug?: PathSlug;
  remaining: number;
  totalLimit: number;
  strings: SparkChatStrings;
  onClose: () => void;
  onMessageSent: (newRemaining: number) => void;
}

export function SparkChat({
  lessonId,
  lessonTitle,
  stepIndex,
  totalSteps = 14,
  pathSlug = "mindset",
  remaining,
  totalLimit,
  strings,
  onClose,
  onMessageSent,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, sending]);

  async function send() {
    if (sending || draft.trim().length < 2 || remaining <= 0) return;
    const userMessage = draft.trim().slice(0, 600);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setDraft("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/spark-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          pathSlug,
          lessonTitle,
          stepIndex,
          totalSteps,
          message: userMessage,
        }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError(strings.unauthorized);
          return;
        }
        if (res.status === 403) {
          setError(strings.quotaExhausted);
          onMessageSent(0);
          return;
        }
        if (res.status === 502 || res.status === 503) {
          setError(strings.networkError);
          return;
        }
        setError(strings.apiError);
        return;
      }
      const body = (await res.json()) as {
        reply?: string;
        remaining?: number;
      };
      if (typeof body.reply !== "string") {
        setError(strings.apiError);
        return;
      }
      setMessages((prev) => [...prev, { role: "spark", content: body.reply! }]);
      if (typeof body.remaining === "number") {
        onMessageSent(body.remaining);
      }
    } catch {
      setError(strings.networkError);
    } finally {
      setSending(false);
    }
  }

  const subtitle = strings.modalSubtitleTemplate
    .replace("{remaining}", String(remaining))
    .replace("{limit}", String(totalLimit));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={strings.modalTitle}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      {/* Backdrop is its own button so click-to-close stays accessible
          (Escape is handled by the keydown listener above). */}
      <button
        type="button"
        aria-label={strings.closeLabel}
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 18, 24, 0.55)",
          backdropFilter: "blur(2px)",
          border: "none",
          cursor: "pointer",
        }}
      />
      <div
        className="relative flex h-[80vh] w-full max-w-md flex-col rounded-t-3xl border border-border bg-surface shadow-2xl sm:h-[70vh] sm:rounded-3xl"
        style={{ maxHeight: "min(680px, 92vh)" }}
      >
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <Spark state="listening" size={36} />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate font-heading text-sm font-semibold text-text-primary">
              {strings.modalTitle}
            </p>
            <p className="text-[11px] text-text-muted">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.closeLabel}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted"
          >
            <X size={16} />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5"
        >
          {messages.length === 0 && (
            <div className="flex flex-col gap-3 rounded-2xl bg-surface-muted/40 p-4">
              <p className="text-sm italic text-text-secondary">
                {strings.emptyHint}
              </p>
              <ul className="flex flex-col gap-1.5">
                {strings.hintExamples.map((h, i) => (
                  <li
                    key={i}
                    className="text-xs italic text-text-muted before:mr-2 before:content-['·']"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </div>
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
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "bg-surface-muted/60 italic text-text-primary"
                }`}
              >
                {m.content}
              </p>
            </div>
          ))}

          {sending && (
            <p className="text-xs italic text-text-muted">{strings.sending}</p>
          )}
          {error && (
            <p
              role="status"
              className="text-xs italic text-error"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:px-5">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 600))}
            placeholder={
              remaining <= 0 ? strings.quotaExhausted : strings.placeholder
            }
            disabled={remaining <= 0 || sending}
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-surface-muted/30 p-3 text-sm leading-relaxed text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:opacity-60"
          />
          <button
            type="button"
            onClick={send}
            disabled={
              sending ||
              draft.trim().length < 2 ||
              remaining <= 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {sending ? strings.sending : strings.sendCta}
            {!sending && <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
