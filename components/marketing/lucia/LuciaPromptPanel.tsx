"use client";

// Right-card of the demo: code-editor look that morphs from "prompt editor"
// (initial) to "result viewer" (cyberpunk-terminal score panel) once the
// evaluation completes. Loosely adapted from the previous PromptEvaluator.tsx
// but driven by the parent orchestrator (no internal state for the
// evaluation itself — the orchestrator owns it so it can also drive the
// homepage fix animations on the left).

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  FileCode,
  FileJson,
  Loader2,
  RotateCcw,
  Terminal,
} from "lucide-react";
import type {
  DimensionKey,
  LuciaDemoCopy,
  LuciaEvaluation,
  ScoreBand,
} from "@/lib/landing-demo/types";
import { bandFromScore } from "@/lib/landing-demo/types";

const ANIM_FRAMES = 60;
const ANIM_INTERVAL_MS = 16;

const DIMENSION_ORDER: DimensionKey[] = [
  "chiarezza",
  "contesto",
  "obiettivo",
  "protezione",
];

// Cyberpunk dimension colours — diegetic to the "tool view" result panel
// only. Kept as hex (not CSS variables) because they're concatenated with
// alpha suffixes (e.g. `${c}80`) in inline glow/shadow strings, which
// `var(--token)` can't satisfy. `obiettivo` mirrors `--tool-accent`,
// `great`/`perfect` mirror `--tool-accent-victory` — keep them in sync.
const DIM_COLORS: Record<DimensionKey, string> = {
  chiarezza: "#00f0ff",
  contesto: "#ff00e5",
  obiettivo: "#c5f432",
  protezione: "#ffb800",
};

const BAND_COLORS: Record<ScoreBand, string> = {
  review: "#ff6b4a",
  improve: "#ffd700",
  good: "#b8ff00",
  great: "#00c853",
  perfect: "#00c853",
};

const ZERO_DIMS: Record<DimensionKey, number> = {
  chiarezza: 0,
  contesto: 0,
  obiettivo: 0,
  protezione: 0,
};

const TERMINAL_BAR_STYLE: CSSProperties = {
  background: "var(--tool-bg-chrome)",
  padding: "0.55rem 0.95rem",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  position: "relative",
  zIndex: 2,
};

const DOTS_STYLE: CSSProperties = { display: "flex", gap: "0.4rem" };

const dotStyle = (bg: string): CSSProperties => ({
  width: 11,
  height: 11,
  borderRadius: "50%",
  background: bg,
});

function getSeverityIcon(score: number): string {
  if (score >= 75) return "✓";
  if (score >= 50) return "•";
  return "!";
}

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
}: Props) {
  const reducedMotion = usePrefersReducedMotion();

  const [userPrompt, setUserPrompt] = useState("");
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
    <div
      aria-busy={isLoading}
      style={{
        background: showResult
          ? "var(--tool-bg-result)"
          : "var(--tool-bg-elevated)",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow:
          showResult && evaluation && evaluation.totale >= 75
            ? `6px 6px 0 ${scoreColor}, 0 0 30px ${scoreColor}40`
            : "6px 6px 0 var(--tool-bg)",
        // Round 4 vignettazione: orange brand bar identifies V3 as "the
        // user's tool" (Promptly's side), distinct from the lime-bordered
        // Lucia + console vignettes on the left.
        borderLeft: "4px solid var(--primary)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "box-shadow 0.5s",
      }}
    >
      {/* macOS chrome */}
      <div style={TERMINAL_BAR_STYLE}>
        <div style={DOTS_STYLE}>
          <span style={dotStyle("var(--macos-red)")} />
          <span style={dotStyle("var(--macos-yellow)")} />
          <span style={dotStyle("var(--macos-green)")} />
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            color: "var(--tool-text-faint)",
            fontSize: "0.74rem",
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}
        >
          <Terminal size={11} aria-hidden /> {copy.editor.windowTitle}
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          background: "var(--tool-bg-chrome)",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--tool-divider)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: showResult
              ? "var(--tool-bg-result)"
              : "var(--tool-bg-elevated)",
            padding: "0.5rem 0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.75rem",
            color: "var(--tool-text)",
            borderTop: `2px solid ${
              showResult ? scoreColor : "var(--primary)"
            }`,
            borderRight: "1px solid var(--tool-divider)",
            transition: "all 0.3s",
          }}
        >
          {showResult ? (
            <FileJson size={13} color={scoreColor} aria-hidden />
          ) : (
            <FileCode size={13} color="var(--primary)" aria-hidden />
          )}
          {showResult ? "result.json" : "prompt.md"}
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background:
                userPrompt || showResult
                  ? showResult
                    ? scoreColor
                    : "var(--primary)"
                  : "transparent",
              marginLeft: "0.25rem",
              boxShadow: showResult ? `0 0 8px ${scoreColor}` : "none",
            }}
            aria-hidden
          />
        </div>

        {showPrevAttempt && (
          <div
            style={{
              flex: 1,
              textAlign: "right",
              paddingRight: "0.9rem",
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.66rem",
              color: "var(--tool-text-faint)",
              letterSpacing: "0.05em",
            }}
          >
            {copy.editor.previousAttempt.replace(
              "{score}",
              String(prevScore),
            )}
          </div>
        )}
      </div>

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
          }}
          onCursor={updateCursor}
          isLoading={isLoading}
          lineNumbers={lineNumbers}
          cursorLine={cursorPos.line}
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

      {/* Status bar */}
      <div
        style={{
          background: "var(--tool-bg-chrome)",
          padding: "0.4rem 0.95rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: "0.68rem",
          color: "var(--tool-text)",
          borderTop: "1px solid var(--tool-divider)",
          flexWrap: "wrap",
          gap: "0.5rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.85rem",
            alignItems: "center",
          }}
        >
          <span style={{ color: showResult ? scoreColor : "var(--primary)" }}>
            ●{" "}
            {isLoading
              ? copy.editor.statusEvaluating
              : showResult
                ? copy.editor.statusEvaluated
                : copy.editor.statusReady}
          </span>
          {showEditor && !isLoading && (
            <span>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
          )}
          {showResult && evaluation && (
            <span>score: {evaluation.totale}/100</span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.85rem",
            color: "var(--tool-text-muted)",
          }}
        >
          <span>
            {userPrompt.length} {copy.editor.charsLabel}
          </span>
          <span>{showResult ? "JSON" : "Markdown"}</span>
        </div>
      </div>

      {/* Action bar */}
      <div
        style={{
          background: "var(--tool-bg-action)",
          padding: "0.8rem 0.95rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
          borderTop: "1px solid var(--tool-divider)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          role="status"
          aria-live="polite"
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.68rem",
            color: errorMessage ? "#fca5a5" : "transparent",
            minHeight: "1.2em",
            flex: 1,
            textAlign: "left",
            paddingRight: "0.5rem",
          }}
        >
          {errorMessage ?? "·"}
        </div>

        {!showResult ? (
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={editButtonDisabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: editButtonDisabled
                ? "var(--tool-bg-card)"
                : "var(--primary)",
              color: editButtonDisabled
                ? "var(--tool-text-muted)"
                : "#ffffff",
              border: "none",
              padding: "0.55rem 1.2rem",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: editButtonDisabled ? "not-allowed" : "pointer",
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              transition: "transform 0.1s, background 0.2s",
              boxShadow: editButtonDisabled
                ? "none"
                : "0 0 14px rgba(232, 112, 63, 0.5)",
            }}
          >
            {isLoading ? (
              <>
                <Loader2
                  size={15}
                  className="lucia-spin"
                  aria-hidden
                />{" "}
                {copy.editor.btnEvaluating}
              </>
            ) : (
              <>
                <span aria-hidden>▶</span> {copy.editor.btnEvaluate}
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
              gap: "0.5rem",
              background: "transparent",
              color: "var(--tool-text)",
              border: "1.5px solid var(--tool-bg-card)",
              padding: "0.5rem 1.1rem",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.78rem",
              cursor: "pointer",
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
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
        @media (prefers-reduced-motion: reduce) {
          .lucia-spin {
            animation: none;
          }
        }
      `}</style>
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
  isLoading,
  lineNumbers,
  cursorLine,
}: {
  copy: LuciaDemoCopy["editor"];
  userPrompt: string;
  onChange: (
    value: string,
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onCursor: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  lineNumbers: number[];
  cursorLine: number;
}) {
  return (
    <div style={{ display: "flex", flex: 1 }}>
      <div
        aria-hidden
        style={{
          background: "var(--tool-bg-elevated)",
          padding: "0.85rem 0.55rem 0.85rem 0.95rem",
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: "0.78rem",
          lineHeight: 1.55,
          color: "var(--tool-text-muted)",
          textAlign: "right",
          userSelect: "none",
          minWidth: "2.5rem",
          borderRight: "1px solid var(--tool-bg-chrome)",
        }}
      >
        {lineNumbers.map((n) => (
          <div
            key={n}
            style={{
              color:
                n === cursorLine
                  ? "var(--tool-text)"
                  : "var(--tool-text-subtle)",
            }}
          >
            {n}
          </div>
        ))}
      </div>
      <textarea
        value={userPrompt}
        onChange={(e) => onChange(e.target.value, e)}
        onKeyUp={onCursor}
        onClick={onCursor}
        onFocus={onCursor}
        placeholder={copy.placeholder}
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
          background: "var(--tool-bg-elevated)",
          color: "var(--tool-text)",
          caretColor: "var(--primary)",
          boxSizing: "border-box",
          opacity: isLoading ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}
      />
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
        padding: "1.4rem 1.15rem",
        position: "relative",
        overflow: "hidden",
        minHeight: "320px",
      }}
    >
      {/* Subtle terminal grid background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 3px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Score header */}
        <div style={{ textAlign: "center", marginBottom: "1.15rem" }}>
          <div
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.62rem",
              color: "var(--tool-text-muted)",
              letterSpacing: "0.25em",
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
              fontSize: "clamp(3.2rem, 12vw, 5.4rem)",
              fontWeight: 700,
              lineHeight: 1,
              color: scoreColor,
              textShadow: `0 0 18px ${scoreColor}cc, 0 0 36px ${scoreColor}66, 0 0 60px ${scoreColor}33`,
              margin: "0.3rem 0 0.15rem 0",
              letterSpacing: "-0.02em",
            }}
          >
            {animatedScore}
          </div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.7rem",
              color: "var(--tool-text-muted)",
              letterSpacing: "0.2em",
            }}
          >
            / 100 ·{" "}
            <span
              style={{
                color: scoreColor,
                textShadow: `0 0 6px ${scoreColor}80`,
              }}
            >
              {scoreLabel}
            </span>
          </div>
        </div>

        <div
          aria-hidden
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${scoreColor}, transparent)`,
            boxShadow: `0 0 8px ${scoreColor}80`,
            margin: "1rem 0",
          }}
        />

        {/* Dimensions */}
        <div>
          {DIMENSION_ORDER.map((key, i) => {
            const dimMeta = copy.result.dimensions[key];
            const c = DIM_COLORS[key];
            const v = animatedDims[key];
            const finalV = evaluation[key];
            const sev = getSeverityIcon(finalV);
            return (
              <div
                key={key}
                style={{
                  marginBottom: "0.7rem",
                  fontFamily:
                    "var(--font-jetbrains), ui-monospace, monospace",
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
                    marginBottom: "0.22rem",
                    fontSize: "0.74rem",
                  }}
                >
                  <span>
                    <span aria-hidden style={{ color: "var(--tool-text-muted)" }}>
                      {"> "}
                    </span>
                    <span
                      style={{
                        color: c,
                        textShadow: `0 0 6px ${c}80`,
                        fontWeight: 600,
                      }}
                    >
                      {dimMeta.label}
                    </span>
                    <span
                      aria-hidden
                      style={{
                        color: "var(--tool-text-subtle)",
                        marginLeft: "0.45rem",
                        fontSize: "0.68rem",
                      }}
                    >
                      {"// "}
                      {dimMeta.desc}
                    </span>
                  </span>
                  <span
                    style={{
                      color: c,
                      fontWeight: 700,
                      textShadow: `0 0 6px ${c}80`,
                      fontSize: "0.76rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span aria-hidden>{sev}</span>
                    {String(v).padStart(3, "0")}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${copy.editor.ariaBar}: ${dimMeta.label}`}
                  aria-valuenow={finalV}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{
                    height: 5,
                    background: "var(--tool-bg)",
                    borderRadius: 2,
                    overflow: "hidden",
                    border: `1px solid ${c}40`,
                    boxShadow: `inset 0 0 4px ${c}20`,
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: `${finalV}%`,
                      height: "100%",
                      background: c,
                      boxShadow: `0 0 8px ${c}, 0 0 16px ${c}80`,
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
            background:
              "linear-gradient(90deg, transparent, #00F0FF80, transparent)",
            boxShadow: "0 0 6px #00F0FF40",
            margin: "1rem 0 0.75rem 0",
          }}
        />

        {/* Advice */}
        <div
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            opacity: reducedMotion ? 1 : 0,
            animation: reducedMotion
              ? undefined
              : "lucia-eval-fade 0.5s ease-out 1s forwards",
          }}
        >
          <div
            aria-hidden
            style={{
              color: "var(--tool-text-muted)",
              fontSize: "0.66rem",
              letterSpacing: "0.18em",
              marginBottom: "0.35rem",
            }}
          >
            {"// "}
            {copy.result.adviceLabel}
          </div>
          <div
            style={{
              padding: "0.7rem 0.85rem",
              background: "rgba(197, 244, 50, 0.06)",
              border: "1px solid rgba(197, 244, 50, 0.25)",
              borderLeft: "2px solid var(--tool-accent)",
              borderRadius: "4px",
              color: "#d7dce3",
              fontSize: "0.76rem",
              lineHeight: 1.55,
              boxShadow:
                "0 0 12px rgba(197, 244, 50, 0.08), inset 0 0 12px rgba(197, 244, 50, 0.03)",
            }}
          >
            {evaluation.consiglio}
          </div>
        </div>
      </div>
    </div>
  );
}
