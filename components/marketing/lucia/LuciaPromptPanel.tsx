"use client";

// Right-card of the demo: morphs from "prompt editor" (textarea) to
// "evaluation card" (score + dimensions + Spark advice) once the API
// returns. Editorial pass (May 2026): tutta la chrome stile IDE
// (macOS dots, tab bar, status bar a 2 righe, action bar dark, neon glow
// sul punteggio, scan-line + grid pattern di sfondo) è stata sostituita
// con il linguaggio editoriale della landing — surface bianco, hairline
// border, mono micro per i numeri di riga, bottone primary arancione
// come quello dell'hero, score in heading sans, barre dimensione
// hairline da 3px, consiglio in blockquote serif italic con uno Spark
// placeholder mini accanto. La logica (cursor tracking, animated score,
// honeypot, reduced motion, attempt cap) è invariata.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";
import type {
  DimensionKey,
  LuciaDemoCopy,
  LuciaEvaluation,
  ScoreBand,
} from "@/lib/landing-demo/types";
import { bandFromScore } from "@/lib/landing-demo/types";
import { LuciaWriteHereOverlay } from "./LuciaWriteHereOverlay";

const ANIM_FRAMES = 60;
const ANIM_INTERVAL_MS = 16;

const DIMENSION_ORDER: DimensionKey[] = [
  "chiarezza",
  "contesto",
  "obiettivo",
  "protezione",
];

// Editorial palette — 4 accenti dalla design palette della landing
// (CLAUDE.md § design system). Ogni dimensione ha un senso semantico:
//   chiarezza → text-primary  (neutro, "voce piena")
//   contesto  → streak-freeze (#38bdf8, "informativo")
//   obiettivo → primary brand (#e8703f, "qui sei tu")
//   protezione→ xp-gold       (#eab308, "fai attenzione")
// Niente glow, niente alpha-suffix tricks — colori opachi diretti.
const DIM_COLORS: Record<DimensionKey, string> = {
  chiarezza: "#0a0a0a",
  contesto: "#38bdf8",
  obiettivo: "#e8703f",
  protezione: "#eab308",
};

// Score band → colore del numero. Modulato sulla palette brand, niente
// rainbow neon. Le band basse restano in text-secondary (segnale "non
// abbastanza"); good salta al primary (siamo arrivati alla zona Promptly);
// great/perfect intensificano in primary-deep.
const BAND_COLORS: Record<ScoreBand, string> = {
  review: "#525252",
  improve: "#525252",
  good: "#e8703f",
  great: "#c8521f",
  perfect: "#a23e12",
};

const ZERO_DIMS: Record<DimensionKey, number> = {
  chiarezza: 0,
  contesto: 0,
  obiettivo: 0,
  protezione: 0,
};

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return prefers;
}

export type PanelPhase = "editing" | "evaluating" | "result" | "limit";

interface Props {
  copy: LuciaDemoCopy;
  phase: PanelPhase;
  evaluation: LuciaEvaluation | null;
  prevScore: number | null;
  errorMessage: string | null;
  onEvaluate: (prompt: string) => void;
  onReset: () => void;
  /** Disabled when the user has hit the per-session attempt cap. */
  evaluateDisabledReason: "limit" | null;
  /** When true, render the floating "write here" arrow above the
   * textarea. Falsey for logged-in users (they're not on the demo
   * surface in the same form). */
  showWriteHereOverlay?: boolean;
}

export function LuciaPromptPanel({
  copy,
  phase,
  evaluation,
  prevScore,
  errorMessage,
  onEvaluate,
  onReset,
  evaluateDisabledReason,
  showWriteHereOverlay = false,
}: Props) {
  const reducedMotion = usePrefersReducedMotion();

  const [userPrompt, setUserPrompt] = useState("");
  // True once the user has focused the textarea at least once. The
  // "write here" overlay watches this — it fades out the moment the
  // user signals they understood the affordance.
  const [textareaTouched, setTextareaTouched] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedDims, setAnimatedDims] =
    useState<Record<DimensionKey, number>>(ZERO_DIMS);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const mountedRef = useRef(true);

  // Honeypot — invisible field. If a bot fills the whole form we send the
  // value alongside the prompt to the API; the API rejects.
  // The orchestrator owns the API call, so we expose the value via DOM.
  // (See LuciaDemo.tsx — it reads via ref before sending.)
  const hpRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Counter + bar animation when a fresh result lands.
  useEffect(() => {
    if (!evaluation) {
      setAnimatedScore(0);
      setAnimatedDims(ZERO_DIMS);
      return;
    }
    if (reducedMotion) {
      setAnimatedScore(evaluation.totale);
      setAnimatedDims({
        chiarezza: evaluation.chiarezza,
        contesto: evaluation.contesto,
        obiettivo: evaluation.obiettivo,
        protezione: evaluation.protezione,
      });
      return;
    }
    let frame = 0;
    const interval = setInterval(() => {
      if (!mountedRef.current) {
        clearInterval(interval);
        return;
      }
      frame++;
      const t = Math.min(frame / ANIM_FRAMES, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(evaluation.totale * ease));
      setAnimatedDims({
        chiarezza: Math.round(evaluation.chiarezza * ease),
        contesto: Math.round(evaluation.contesto * ease),
        obiettivo: Math.round(evaluation.obiettivo * ease),
        protezione: Math.round(evaluation.protezione * ease),
      });
      if (frame >= ANIM_FRAMES) clearInterval(interval);
    }, ANIM_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [evaluation, reducedMotion]);

  // Reset prompt textarea when entering a fresh editing phase.
  useEffect(() => {
    if (phase === "editing") {
      setUserPrompt("");
      setCursorPos({ line: 1, col: 1 });
    }
  }, [phase]);

  const updateCursor = useCallback(
    (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;
      const before = ta.value.substring(0, ta.selectionStart);
      const lines = before.split("\n");
      setCursorPos({
        line: lines.length,
        col: lines[lines.length - 1].length + 1,
      });
    },
    [],
  );

  const handleEvaluate = useCallback(() => {
    if (!userPrompt.trim()) return;
    if (evaluateDisabledReason === "limit") return;
    // Honeypot: if filled, abort silently (no UX feedback to bots).
    const hpValue = hpRef.current?.value ?? "";
    if (hpValue.length > 0) return;
    onEvaluate(userPrompt);
  }, [userPrompt, onEvaluate, evaluateDisabledReason]);

  const lineNumbers = useMemo(() => {
    const count = Math.max(userPrompt.split("\n").length, 8);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [userPrompt]);

  const showResult = phase === "result" && evaluation !== null;
  const showEditor = !showResult; // editing, evaluating, limit
  const isLoading = phase === "evaluating";

  const band: ScoreBand | null = evaluation
    ? bandFromScore(evaluation.totale)
    : null;
  const scoreColor = band ? BAND_COLORS[band] : "#c5f432";
  const scoreLabel = band ? copy.result.scoreLabels[band] : "";

  const editButtonDisabled =
    isLoading ||
    !userPrompt.trim() ||
    evaluateDisabledReason === "limit";

  const showPrevAttempt = phase === "editing" && prevScore !== null;

  return (
    // Outer wrapper hosts the "write here" overlay so it can extend
    // above the panel without being clipped by the panel's
    // `overflow: hidden` (which we keep so the rounded corners + result
    // animations stay clean).
    <div style={{ position: "relative", display: "flex", flex: 1 }}>
      <LuciaWriteHereOverlay
        textDesktop={copy.writeHereOverlay.desktop}
        textMobile={copy.writeHereOverlay.mobile}
        visible={
          showWriteHereOverlay &&
          phase === "editing" &&
          userPrompt.length === 0 &&
          !textareaTouched
        }
      />
    <div
      aria-busy={isLoading}
      style={{
        background: "var(--surface)",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        flex: 1,
      }}
    >
      {/* Optional micro-strip in cima per "tentativo precedente" — non
          più una tab bar con file pill + indicator dot. Una sola riga di
          contesto mono allineata a destra, visibile solo se rilevante. */}
      {showPrevAttempt && (
        <div
          style={{
            padding: "0.5rem 0.85rem",
            borderBottom: "1px solid var(--border)",
            fontFamily:
              "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.68rem",
            color: "var(--text-muted)",
            textAlign: "right",
            letterSpacing: "0.03em",
          }}
        >
          {copy.editor.previousAttempt.replace(
            "{score}",
            String(prevScore),
          )}
        </div>
      )}

      {/* Honeypot — visually hidden but reachable to naive bots scraping forms */}
      <input
        ref={hpRef}
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {showEditor ? (
        <EditorBody
          copy={copy.editor}
          userPrompt={userPrompt}
          onChange={(v, e) => {
            setUserPrompt(v);
            updateCursor(e);
            // First keystroke also dismisses the overlay — covers the
            // edge case where the user types via mobile autofill /
            // paste without ever firing a focus event.
            if (!textareaTouched) setTextareaTouched(true);
          }}
          onCursor={updateCursor}
          onFirstFocus={() => {
            if (!textareaTouched) setTextareaTouched(true);
          }}
          isLoading={isLoading}
          lineNumbers={lineNumbers}
          cursorLine={cursorPos.line}
          showFakeCaret={userPrompt.length === 0}
        />
      ) : (
        <ResultBody
          copy={copy}
          evaluation={evaluation!}
          animatedScore={animatedScore}
          animatedDims={animatedDims}
          scoreColor={scoreColor}
          scoreLabel={scoreLabel}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Footer combinato: meta micro a sinistra + bottone primary a destra.
          Sostituisce la coppia status-bar/action-bar dark con un'unica riga
          editoriale su sfondo surface-muted, hairline top. */}
      <div
        style={{
          background: "var(--surface-muted)",
          padding: "0.7rem 0.95rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          borderTop: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        <div
          role="status"
          aria-live="polite"
          style={{
            fontFamily:
              "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.7rem",
            color: errorMessage
              ? "#c8521f"
              : "var(--text-muted)",
            flex: "1 1 auto",
            textAlign: "left",
            letterSpacing: "0.02em",
            minHeight: "1.2em",
          }}
        >
          {errorMessage ??
            (showEditor && !isLoading
              ? `Ln ${cursorPos.line}, Col ${cursorPos.col} · ${userPrompt.length} ${copy.editor.charsLabel}`
              : showResult && evaluation
                ? `${copy.editor.statusEvaluated} · ${evaluation.totale}/100`
                : isLoading
                  ? copy.editor.statusEvaluating
                  : copy.editor.statusReady)}
        </div>

        {!showResult ? (
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={editButtonDisabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              background: editButtonDisabled
                ? "var(--surface-muted)"
                : "var(--primary)",
              color: editButtonDisabled ? "var(--text-muted)" : "#ffffff",
              border: editButtonDisabled
                ? "1px solid var(--border)"
                : "none",
              padding: "0.55rem 1.1rem",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: editButtonDisabled ? "not-allowed" : "pointer",
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              transition: "background 0.2s",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="lucia-spin" aria-hidden />{" "}
                {copy.editor.btnEvaluating}
              </>
            ) : (
              <>
                {copy.editor.btnEvaluate}
                <ArrowRight size={14} aria-hidden />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "0.8rem",
              cursor: "pointer",
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            }}
          >
            <RotateCcw size={13} aria-hidden /> {copy.editor.btnRetry}
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes lucia-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .lucia-spin {
          animation: lucia-spin 1s linear infinite;
        }
        @keyframes lucia-eval-grow {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes lucia-eval-fade {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes lucia-caret-blink {
          0%,
          55% {
            opacity: 1;
          }
          55.01%,
          100% {
            opacity: 0;
          }
        }
        .lucia-fake-caret {
          animation: lucia-caret-blink 1.1s linear infinite;
          will-change: opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .lucia-spin {
            animation: none;
          }
          .lucia-fake-caret {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor body (initial / evaluating)
// ---------------------------------------------------------------------------

function EditorBody({
  copy,
  userPrompt,
  onChange,
  onCursor,
  onFirstFocus,
  isLoading,
  lineNumbers,
  cursorLine,
  showFakeCaret,
}: {
  copy: LuciaDemoCopy["editor"];
  userPrompt: string;
  onChange: (
    value: string,
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onCursor: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  /** Optional — fires on the FIRST focus event (used by the parent to
   * dismiss the "write here" overlay). Not de-duped here; the parent
   * guards re-firing via state. */
  onFirstFocus?: () => void;
  isLoading: boolean;
  lineNumbers: number[];
  cursorLine: number;
  /** Render a blinking fake caret at line 1 / col 1 of the textarea —
   * sostituisce il placeholder testuale ed è l'unico "vieni qui" dentro
   * al campo finché l'utente non lo focalizza o digita. */
  showFakeCaret: boolean;
}) {
  return (
    <div style={{ display: "flex", flex: 1, background: "var(--surface)" }}>
      <div
        aria-hidden
        style={{
          background: "var(--surface)",
          padding: "0.85rem 0.55rem 0.85rem 0.95rem",
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: "0.78rem",
          lineHeight: 1.55,
          color: "var(--text-muted)",
          textAlign: "right",
          userSelect: "none",
          minWidth: "2.5rem",
          borderRight: "1px solid var(--border)",
        }}
      >
        {lineNumbers.map((n) => (
          <div
            key={n}
            style={{
              color:
                n === cursorLine
                  ? "var(--text-secondary)"
                  : "var(--text-muted)",
            }}
          >
            {n}
          </div>
        ))}
      </div>
      <div style={{ position: "relative", flex: 1, display: "flex" }}>
        {showFakeCaret && (
          <span
            aria-hidden
            className="lucia-fake-caret"
            style={{
              position: "absolute",
              top: "0.85rem",
              left: "0.95rem",
              width: 9,
              height: "1.45em",
              background: "var(--primary)",
              borderRadius: 1,
              pointerEvents: "none",
              fontSize: "0.82rem",
              zIndex: 1,
            }}
          />
        )}
        <textarea
          value={userPrompt}
          onChange={(e) => onChange(e.target.value, e)}
          onKeyUp={onCursor}
          onClick={onCursor}
          onFocus={(e) => {
            onCursor(e);
            onFirstFocus?.();
          }}
          disabled={isLoading}
          spellCheck={false}
          aria-label={copy.ariaTextarea}
          maxLength={1500}
          style={{
            flex: 1,
            minHeight: "240px",
            padding: "0.85rem 0.95rem",
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.82rem",
            lineHeight: 1.55,
            border: "none",
            outline: "none",
            resize: "none",
            background: "var(--surface)",
            color: "var(--text-primary)",
            caretColor: showFakeCaret ? "transparent" : "var(--primary)",
            boxSizing: "border-box",
            opacity: isLoading ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result body (cyberpunk score panel)
// ---------------------------------------------------------------------------

function ResultBody({
  copy,
  evaluation,
  animatedScore,
  animatedDims,
  scoreColor,
  scoreLabel,
  reducedMotion,
}: {
  copy: LuciaDemoCopy;
  evaluation: LuciaEvaluation;
  animatedScore: number;
  animatedDims: Record<DimensionKey, number>;
  scoreColor: string;
  scoreLabel: string;
  reducedMotion: boolean;
}) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={copy.result.evalLabel}
      style={{
        flex: 1,
        padding: "1.4rem 1.25rem 1.25rem",
        background: "var(--surface)",
        minHeight: "320px",
      }}
    >
      {/* Score header — niente glow, niente scan-line. Kicker mono +
          numero in heading sans peso 500 + label band in mono micro. */}
      <div style={{ textAlign: "center", marginBottom: "1.15rem" }}>
        <div
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.66rem",
            color: "var(--text-muted)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {"// "}
          {copy.result.evalLabel}
        </div>
        <div
          role="meter"
          aria-label={copy.editor.ariaScore}
          aria-valuenow={evaluation.totale}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "clamp(3rem, 10vw, 4.6rem)",
            fontWeight: 600,
            lineHeight: 1,
            color: scoreColor,
            margin: "0.45rem 0 0.25rem 0",
            letterSpacing: "-0.025em",
          }}
        >
          {animatedScore}
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
          }}
        >
          / 100 ·{" "}
          <span style={{ color: scoreColor, fontWeight: 600 }}>
            {scoreLabel}
          </span>
        </div>
      </div>

      <div
        aria-hidden
        style={{
          height: 1,
          background: "var(--border)",
          margin: "0.85rem 0 1rem",
        }}
      />

      {/* Dimensions — hairline 3px, palette landing, niente neon glow */}
      <div>
        {DIMENSION_ORDER.map((key, i) => {
          const dimMeta = copy.result.dimensions[key];
          const c = DIM_COLORS[key];
          const v = animatedDims[key];
          const finalV = evaluation[key];
          return (
            <div
              key={key}
              style={{
                marginBottom: "0.7rem",
                opacity: reducedMotion ? 1 : 0,
                animation: reducedMotion
                  ? undefined
                  : `lucia-eval-fade 0.5s ease-out ${
                      0.2 + i * 0.12
                    }s forwards`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "0.25rem",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                }}
              >
                <span>
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {dimMeta.label.charAt(0).toUpperCase() +
                      dimMeta.label.slice(1)}
                  </span>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      marginLeft: "0.5rem",
                      fontSize: "0.72rem",
                    }}
                  >
                    {dimMeta.desc}
                  </span>
                </span>
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily:
                      "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "0.76rem",
                  }}
                >
                  {v}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${copy.editor.ariaBar}: ${dimMeta.label}`}
                aria-valuenow={finalV}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  height: 3,
                  background: "var(--surface-muted)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: `${finalV}%`,
                    height: "100%",
                    background: c,
                    transformOrigin: "left",
                    animation: reducedMotion
                      ? undefined
                      : `lucia-eval-grow 0.9s cubic-bezier(0.4, 0, 0.2, 1) ${
                          0.4 + i * 0.12
                        }s both`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        aria-hidden
        style={{
          height: 1,
          background: "var(--border)",
          margin: "1.1rem 0 0.85rem",
        }}
      />

      {/* Advice — Spark mini placeholder a sinistra (eredita
          .meet-spark-portrait dalla landing) + blockquote serif italic
          con hairline-left arancione a destra. È la voce di Spark
          editoriale, non più una notifica neon. */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
          opacity: reducedMotion ? 1 : 0,
          animation: reducedMotion
            ? undefined
            : "lucia-eval-fade 0.5s ease-out 1s forwards",
        }}
      >
        <div
          aria-hidden="true"
          className="meet-spark-portrait lucia-spark-mini"
        >
          <div aria-hidden="true" className="meet-spark-body">
            <div className="meet-spark-highlight" />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            aria-hidden
            style={{
              fontFamily:
                "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.66rem",
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "0.4rem",
            }}
          >
            {copy.result.adviceLabel}
          </div>
          <p
            style={{
              margin: 0,
              padding: "0 0 0 12px",
              borderLeft: "2px solid var(--primary)",
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontStyle: "italic",
              fontSize: "0.92rem",
              lineHeight: 1.55,
              color: "var(--text-primary)",
            }}
          >
            {evaluation.consiglio}
          </p>
        </div>
      </div>
    </div>
  );
}
