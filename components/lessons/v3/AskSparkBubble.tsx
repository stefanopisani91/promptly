"use client";

// "Chiedi a Spark" — bubble anchored to Spark's bottom-right in SparkHeader.
//
// States:
//   - active  : gold, pulse, "?" icon — opens chat to send messages.
//   - exhausted: slightly dimmed gold, clock-history icon — STILL CLICKABLE
//               to view the session's chat history in read-only mode.
//               We never disable this button completely: the user earned the
//               right to re-read what Spark told them during the lesson.
//   - boosted : on a quick-win step. Bigger, a stronger pulse (+ a one-shot
//               grow-in — see .ask-spark-bubble-boosted in globals.css), and
//               always the active "?" regardless of the free-chat quota —
//               because there the panel opens in helper mode, which has its
//               own quota.

interface Props {
  onOpen: () => void;
  remaining: number;
  limit: number;
  label: string;
  exhaustedLabel: string;
  boosted?: boolean;
}

export function AskSparkBubble({
  onOpen,
  remaining,
  limit,
  label,
  exhaustedLabel,
  boosted = false,
}: Props) {
  // In boosted mode the free-chat quota is irrelevant — never show the
  // "history" state, never dim.
  const isExhausted = !boosted && remaining <= 0;
  const tooltip = isExhausted
    ? exhaustedLabel
    : boosted
    ? label
    : `${label} · ${remaining}/${limit}`;
  const size = boosted ? 48 : 40; // px — h-12/w-12 vs h-10/w-10

  return (
    <button
      type="button"
      onClick={onOpen}
      // Never disabled — exhausted users can still open the history.
      aria-label={tooltip}
      title={tooltip}
      className={`${
        boosted ? "ask-spark-bubble-boosted" : "ask-spark-bubble"
      } pointer-events-auto absolute inline-flex items-center justify-center rounded-full text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep`}
      style={{
        width: size,
        height: size,
        bottom: boosted ? "-12px" : "-10px",
        right: boosted ? "-16px" : "-14px",
        background: isExhausted
          ? "linear-gradient(135deg, #d4b83a 0%, #b07010 100%)"
          : "linear-gradient(135deg, #FFE442 0%, #FF9A0A 100%)",
        border: "2px solid rgba(255,255,255,0.9)",
        opacity: isExhausted ? 0.72 : 1,
        zIndex: 40,
      }}
    >
      {isExhausted ? <HistoryIcon /> : <QuestionMarkIcon size={boosted ? 24 : 20} />}
    </button>
  );
}

/** Bold "?" — active state */
function QuestionMarkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="16.5" r="1.5" fill="white" />
      <path
        d="M6.5 6.8 C6.5 4.4 8.0 3 10 3 C12.0 3 13.5 4.4 13.5 6.5 C13.5 8.2 12.4 9.2 11.2 9.9 C10.5 10.3 10 10.9 10 11.8 L10 13"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Clock / history icon — exhausted state */
function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Clock circle */}
      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* Clock hands: 12 o'clock to 10 o'clock (history feel) */}
      <path d="M12 7v5l-3 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
