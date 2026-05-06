"use client";

// "Chiedi a Spark" — bubble anchored to Spark's bottom-right in SparkHeader.
//
// States:
//   - active  : gold, pulse, "?" icon — opens chat to send messages.
//   - exhausted: slightly dimmed gold, clock-history icon — STILL CLICKABLE
//               to view the session's chat history in read-only mode.
//               We never disable this button completely: the user earned the
//               right to re-read what Spark told them during the lesson.

interface Props {
  onOpen: () => void;
  remaining: number;
  limit: number;
  label: string;
  exhaustedLabel: string;
}

export function AskSparkBubble({
  onOpen,
  remaining,
  limit,
  label,
  exhaustedLabel,
}: Props) {
  const isExhausted = remaining <= 0;
  const tooltip = isExhausted
    ? exhaustedLabel
    : `${label} · ${remaining}/${limit}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      // Never disabled — exhausted users can still open the history.
      aria-label={tooltip}
      title={tooltip}
      className="ask-spark-bubble pointer-events-auto absolute inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
      style={{
        bottom: "-10px",
        right: "-14px",
        background: isExhausted
          ? "linear-gradient(135deg, #c8a830 0%, #a88520 100%)"
          : "linear-gradient(135deg, #F5C544 0%, #E0A82E 100%)",
        border: "2px solid rgba(255,255,255,0.9)",
        opacity: isExhausted ? 0.72 : 1,
        zIndex: 40,
      }}
    >
      {isExhausted ? <HistoryIcon /> : <QuestionMarkIcon />}
    </button>
  );
}

/** Bold "?" — active state */
function QuestionMarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
