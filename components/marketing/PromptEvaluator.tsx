"use client";

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
  Sparkles,
  Terminal,
} from "lucide-react";
import type {
  DimensionKey,
  EvaluationResult,
  Evaluator,
  EvaluatorCopy,
  EvaluatorMode,
} from "@/lib/evaluator/types";
import { Fireworks } from "./Fireworks";

const ANIM_FRAMES = 60;
const ANIM_INTERVAL_MS = 16;
const FIREWORKS_DELAY_MS = 900;
const FIREWORKS_DURATION_MS = 4200;
const EXCELLENT_SCORE_THRESHOLD = 85;
const STRONG_DIM_THRESHOLD = 75;

const DIMENSION_ORDER: DimensionKey[] = [
  "chiarezza",
  "contesto",
  "obiettivo",
  "protezione",
];

const DIM_COLORS: Record<DimensionKey, string> = {
  chiarezza: "#00F0FF",
  contesto: "#FF00E5",
  obiettivo: "#C5F432",
  protezione: "#FFB800",
};

type VariantKind = "showcase" | "lesson";

export interface PromptEvaluatorProps {
  copy: EvaluatorCopy;
  evaluator: Evaluator;
  variant?: VariantKind;
  mode?: EvaluatorMode;
  targetScore?: number;
  onComplete?: (result: EvaluationResult) => void;
  className?: string;
}

const ZERO_DIMS: Record<DimensionKey, number> = {
  chiarezza: 0,
  contesto: 0,
  obiettivo: 0,
  protezione: 0,
};

const TERMINAL_BAR_STYLE: CSSProperties = {
  background: "#1A1A1A",
  padding: "0.6rem 1rem",
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid #2A2A2A",
};

const DOTS_STYLE: CSSProperties = { display: "flex", gap: "0.4rem" };

const dotStyle = (bg: string): CSSProperties => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: bg,
});

function getScoreColor(score: number): string {
  if (score >= STRONG_DIM_THRESHOLD) return "#C5F432";
  if (score >= 50) return "#FFB800";
  return "#FF3366";
}

function getSeverityIcon(score: number): string {
  if (score >= STRONG_DIM_THRESHOLD) return "✓";
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

export default function PromptEvaluator({
  copy,
  evaluator,
  variant = "showcase",
  mode = "local",
  targetScore,
  onComplete,
  className,
}: PromptEvaluatorProps) {
  const reducedMotion = usePrefersReducedMotion();

  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedDims, setAnimatedDims] =
    useState<Record<DimensionKey, number>>(ZERO_DIMS);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [fireworks, setFireworks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  const mountedRef = useRef(true);
  const completedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (result?.totale === undefined) return;
    if (reducedMotion) {
      setAnimatedScore(result.totale);
      setAnimatedDims({
        chiarezza: result.chiarezza,
        contesto: result.contesto,
        obiettivo: result.obiettivo,
        protezione: result.protezione,
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
      setAnimatedScore(Math.round(result.totale * ease));
      setAnimatedDims({
        chiarezza: Math.round(result.chiarezza * ease),
        contesto: Math.round(result.contesto * ease),
        obiettivo: Math.round(result.obiettivo * ease),
        protezione: Math.round(result.protezione * ease),
      });
      if (frame >= ANIM_FRAMES) clearInterval(interval);
    }, ANIM_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [result, reducedMotion]);

  useEffect(() => {
    if (variant !== "showcase") return;
    if (reducedMotion) return;
    if (!result || result.totale < EXCELLENT_SCORE_THRESHOLD) return;
    const start = setTimeout(() => {
      if (mountedRef.current) setFireworks(true);
    }, FIREWORKS_DELAY_MS);
    const stop = setTimeout(() => {
      if (mountedRef.current) setFireworks(false);
    }, FIREWORKS_DURATION_MS);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [result, reducedMotion, variant]);

  useEffect(() => {
    if (!result) return;
    if (completedRef.current) return;
    if (targetScore !== undefined && result.totale < targetScore) return;
    completedRef.current = true;
    onComplete?.(result);
  }, [result, targetScore, onComplete]);

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

  const handleEvaluate = useCallback(async () => {
    if (!userPrompt.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const seq = ++seqRef.current;

    setLoading(true);
    setResult(null);
    setError(null);
    setAnimatedScore(0);
    setAnimatedDims(ZERO_DIMS);
    completedRef.current = false;

    try {
      const r = await evaluator(userPrompt, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (seq !== seqRef.current) return;
      if (!mountedRef.current) return;
      setResult(r);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      if (!mountedRef.current) return;
      if (seq !== seqRef.current) return;
      setError((err as Error).message ?? "evaluation_failed");
    } finally {
      if (mountedRef.current && seq === seqRef.current) {
        setLoading(false);
      }
    }
  }, [userPrompt, evaluator]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    seqRef.current++;
    setUserPrompt("");
    setResult(null);
    setError(null);
    setLoading(false);
    setAnimatedScore(0);
    setAnimatedDims(ZERO_DIMS);
    setCursorPos({ line: 1, col: 1 });
    setFireworks(false);
    completedRef.current = false;
  }, []);

  const lineNumbers = useMemo(() => {
    const count = Math.max(userPrompt.split("\n").length, 8);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [userPrompt]);

  const scoreColor = getScoreColor(animatedScore);

  const scoreLabel = (s: number): string => {
    const labels = copy.scoreLabels;
    if (s >= EXCELLENT_SCORE_THRESHOLD) return labels.excellent;
    if (s >= 70) return labels.good;
    if (s >= 50) return labels.improve;
    return labels.insufficient;
  };

  const isLessonComplete =
    variant === "lesson" &&
    result !== null &&
    targetScore !== undefined &&
    result.totale >= targetScore;

  return (
    <section
      id="prompt-evaluator"
      aria-labelledby="evaluator-title"
      className={`relative py-16 sm:py-20 lg:py-24 ${className ?? ""}`}
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-text-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[#C5F432]">
          <Sparkles size={14} aria-hidden /> Promptly · {copy.badge}
        </div>
        <h2
          id="evaluator-title"
          className="font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl"
        >
          {copy.title}
          <br />
          <em className="not-italic text-primary-deep">{copy.titleEm}</em>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-text-secondary sm:text-lg">
          {copy.sub}
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 px-4 sm:px-6 md:grid-cols-2">
        {/* TERMINAL CARD - Bug */}
        <div
          aria-label="Bug example"
          style={{
            background: "#0A0A0A",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "6px 6px 0 #C5F432",
            border: "2px solid #0A0A0A",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={TERMINAL_BAR_STYLE}>
            <div style={DOTS_STYLE}>
              <span style={dotStyle("#FF5F57")} />
              <span style={dotStyle("#FEBC2E")} />
              <span style={dotStyle("#28C840")} />
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                color: "#888",
                fontSize: "0.75rem",
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <Terminal size={11} aria-hidden /> {copy.bashTab}
            </div>
          </div>
          <div style={{ padding: "1.25rem", flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.7rem",
                color: "#C5F432",
                marginBottom: "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              {copy.cmdCat}
            </div>
            <pre
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.78rem",
                lineHeight: 1.55,
                background: "#141414",
                padding: "0.9rem",
                borderRadius: "6px",
                overflow: "auto",
                margin: "0 0 1rem 0",
                color: "#E5E5E5",
                border: "1px solid #2A2A2A",
              }}
            >
              <code>{copy.bug.code}</code>
            </pre>

            <div
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.7rem",
                color: "#C5F432",
                marginBottom: "0.5rem",
              }}
            >
              {copy.cmdRun}
            </div>
            <div
              role="alert"
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.72rem",
                lineHeight: 1.5,
                color: "#FCA5A5",
                background: "rgba(220, 38, 38, 0.12)",
                borderLeft: "3px solid #DC2626",
                padding: "0.7rem 0.9rem",
                borderRadius: "4px",
                marginBottom: "1rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {copy.bug.error}
            </div>

            <div
              style={{
                fontSize: "0.82rem",
                color: "#A3A3A3",
                fontStyle: "italic",
                lineHeight: 1.4,
                paddingTop: "0.5rem",
                borderTop: "1px dashed #2A2A2A",
              }}
            >
              💡 {copy.bug.hint}
            </div>
          </div>
        </div>

        {/* IDE EDITOR / RESULT */}
        <div
          aria-busy={loading}
          style={{
            background: result ? "#0F1218" : "#282C34",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow:
              result && animatedScore >= STRONG_DIM_THRESHOLD
                ? `6px 6px 0 ${scoreColor}, 0 0 30px ${scoreColor}40`
                : "6px 6px 0 #0A0A0A",
            border: "2px solid #0A0A0A",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            transition: "box-shadow 0.5s",
          }}
        >
          <div
            style={{
              background: "#21252B",
              padding: "0.6rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div style={DOTS_STYLE}>
              <span style={dotStyle("#FF5F57")} />
              <span style={dotStyle("#FEBC2E")} />
              <span style={dotStyle("#28C840")} />
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                color: "#888",
                fontSize: "0.75rem",
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              }}
            >
              Promptly Editor
            </div>
          </div>

          <div
            style={{
              background: "#21252B",
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #181A1F",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: result ? "#0F1218" : "#282C34",
                padding: "0.55rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.78rem",
                color: "#ABB2BF",
                borderTop: `2px solid ${result ? scoreColor : "#C5F432"}`,
                borderRight: "1px solid #181A1F",
                transition: "all 0.3s",
              }}
            >
              {result ? (
                <FileJson size={13} color={scoreColor} aria-hidden />
              ) : (
                <FileCode size={13} color="#61AFEF" aria-hidden />
              )}
              {result ? copy.resultTab : copy.editorTab}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    userPrompt || result
                      ? result
                        ? scoreColor
                        : "#C5F432"
                      : "transparent",
                  marginLeft: "0.25rem",
                  boxShadow: result ? `0 0 8px ${scoreColor}` : "none",
                }}
                aria-hidden
              />
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "right",
                paddingRight: "0.9rem",
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.65rem",
                color: "#5C6370",
                letterSpacing: "0.1em",
              }}
            >
              {mode === "local" ? copy.modeLabel : "gpt-4o-mini"}
            </div>
          </div>

          {!result ? (
            <div style={{ display: "flex", flex: 1 }}>
              <div
                aria-hidden
                style={{
                  background: "#282C34",
                  padding: "0.85rem 0.6rem 0.85rem 1rem",
                  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                  fontSize: "0.78rem",
                  lineHeight: 1.55,
                  color: "#5C6370",
                  textAlign: "right",
                  userSelect: "none",
                  minWidth: "2.5rem",
                  borderRight: "1px solid #21252B",
                }}
              >
                {lineNumbers.map((n) => (
                  <div
                    key={n}
                    style={{
                      color: n === cursorPos.line ? "#ABB2BF" : "#4B5263",
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
              <textarea
                value={userPrompt}
                onChange={(e) => {
                  setUserPrompt(e.target.value);
                  updateCursor(e);
                }}
                onKeyUp={updateCursor}
                onClick={updateCursor}
                onFocus={updateCursor}
                placeholder={copy.textareaPlaceholder}
                disabled={loading}
                spellCheck={false}
                aria-label={copy.ariaTextarea}
                style={{
                  flex: 1,
                  minHeight: "240px",
                  padding: "0.85rem 1rem",
                  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                  fontSize: "0.82rem",
                  lineHeight: 1.55,
                  border: "none",
                  outline: "none",
                  resize: "none",
                  background: "#282C34",
                  color: "#ABB2BF",
                  caretColor: "#C5F432",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ) : (
            <div
              role="region"
              aria-live="polite"
              aria-label={copy.evalLabel}
              style={{
                flex: 1,
                padding: "1.5rem 1.25rem",
                position: "relative",
                overflow: "hidden",
                minHeight: "320px",
              }}
            >
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

              <Fireworks active={fireworks} />

              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      fontFamily:
                        "var(--font-jetbrains), ui-monospace, monospace",
                      fontSize: "0.65rem",
                      color: "#5C6370",
                      letterSpacing: "0.25em",
                    }}
                  >
                    {"// "}
                    {copy.evalLabel}
                  </div>
                  <div
                    role="meter"
                    aria-label={copy.ariaScore}
                    aria-valuenow={result.totale}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "clamp(3.5rem, 13vw, 5.8rem)",
                      fontWeight: 700,
                      lineHeight: 1,
                      color: scoreColor,
                      textShadow: `0 0 18px ${scoreColor}cc, 0 0 36px ${scoreColor}66, 0 0 60px ${scoreColor}33`,
                      margin: "0.4rem 0 0.2rem 0",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {animatedScore}
                  </div>
                  <div
                    style={{
                      fontFamily:
                        "var(--font-jetbrains), ui-monospace, monospace",
                      fontSize: "0.72rem",
                      color: "#5C6370",
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
                      {scoreLabel(result.totale)}
                    </span>
                  </div>
                </div>

                <div
                  aria-hidden
                  style={{
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${scoreColor}, transparent)`,
                    boxShadow: `0 0 8px ${scoreColor}80`,
                    margin: "1.1rem 0",
                  }}
                />

                <div>
                  {DIMENSION_ORDER.map((key, i) => {
                    const dimMeta = copy.dimensions[key];
                    const c = DIM_COLORS[key];
                    const v = animatedDims[key];
                    const finalV = result[key];
                    const sev = getSeverityIcon(finalV);
                    return (
                      <div
                        key={key}
                        style={{
                          marginBottom: "0.75rem",
                          fontFamily:
                            "var(--font-jetbrains), ui-monospace, monospace",
                          opacity: reducedMotion ? 1 : 0,
                          animation: reducedMotion
                            ? undefined
                            : `evalFadeInRow 0.5s ease-out ${
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
                            fontSize: "0.76rem",
                          }}
                        >
                          <span>
                            <span aria-hidden style={{ color: "#5C6370" }}>
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
                                color: "#4B5263",
                                marginLeft: "0.5rem",
                                fontSize: "0.7rem",
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
                              fontSize: "0.78rem",
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
                          aria-label={`${copy.ariaBar}: ${dimMeta.label}`}
                          aria-valuenow={finalV}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          style={{
                            height: 5,
                            background: "#0A0D12",
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
                                : `evalGrowBar 0.9s cubic-bezier(0.4, 0, 0.2, 1) ${
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
                    margin: "1.1rem 0 0.8rem 0",
                  }}
                />

                <div
                  style={{
                    fontFamily:
                      "var(--font-jetbrains), ui-monospace, monospace",
                    opacity: reducedMotion ? 1 : 0,
                    animation: reducedMotion
                      ? undefined
                      : "evalFadeInRow 0.5s ease-out 1s forwards",
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      color: "#5C6370",
                      fontSize: "0.68rem",
                      letterSpacing: "0.18em",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {"// "}
                    {copy.adviceLabel}
                  </div>
                  <div
                    style={{
                      padding: "0.7rem 0.9rem",
                      background: "rgba(197, 244, 50, 0.06)",
                      border: "1px solid rgba(197, 244, 50, 0.25)",
                      borderLeft: "2px solid #C5F432",
                      borderRadius: "4px",
                      color: "#D7DCE3",
                      fontSize: "0.78rem",
                      lineHeight: 1.55,
                      boxShadow:
                        "0 0 12px rgba(197, 244, 50, 0.08), inset 0 0 12px rgba(197, 244, 50, 0.03)",
                    }}
                  >
                    {result.consiglio}
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    style={{
                      marginTop: "0.8rem",
                      padding: "0.6rem 0.9rem",
                      background: "rgba(220, 38, 38, 0.12)",
                      borderLeft: "3px solid #DC2626",
                      borderRadius: "4px",
                      color: "#FCA5A5",
                      fontSize: "0.75rem",
                      fontFamily:
                        "var(--font-jetbrains), ui-monospace, monospace",
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              background: "#21252B",
              padding: "0.4rem 1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.7rem",
              color: "#ABB2BF",
              borderTop: "1px solid #181A1F",
              flexWrap: "wrap",
              gap: "0.5rem",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div style={{ display: "flex", gap: "0.9rem", alignItems: "center" }}>
              <span style={{ color: result ? scoreColor : "#C5F432" }}>
                ●{" "}
                {loading
                  ? copy.statusEvaluating
                  : result
                    ? copy.statusEvaluated
                    : copy.statusReady}
              </span>
              {!result && !loading && (
                <span>
                  Ln {cursorPos.line}, Col {cursorPos.col}
                </span>
              )}
              {result && <span>score: {result.totale}/100</span>}
            </div>
            <div style={{ display: "flex", gap: "0.9rem", color: "#5C6370" }}>
              <span>
                {userPrompt.length} {copy.charsLabel}
              </span>
              <span>{result ? "JSON" : "Markdown"}</span>
            </div>
          </div>

          <div
            style={{
              background: "#1C1F25",
              padding: "0.85rem 1rem",
              display: "flex",
              justifyContent: "flex-end",
              borderTop: "1px solid #181A1F",
              position: "relative",
              zIndex: 2,
            }}
          >
            {!result ? (
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={loading || !userPrompt.trim()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: !userPrompt.trim() ? "#3A3F4B" : "#C5F432",
                  color: !userPrompt.trim() ? "#5C6370" : "#0A0A0A",
                  border: "none",
                  padding: "0.6rem 1.3rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor:
                    !userPrompt.trim() || loading ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                  transition: "transform 0.1s",
                  boxShadow:
                    userPrompt.trim() && !loading
                      ? "0 0 14px rgba(197, 244, 50, 0.5)"
                      : "none",
                }}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={15}
                      className="evaluator-spin"
                      aria-hidden
                    />{" "}
                    {copy.runningBtn}
                  </>
                ) : (
                  <>
                    <span aria-hidden>▶</span> {copy.runBtn}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "transparent",
                  color: "#ABB2BF",
                  border: "1.5px solid #3A3F4B",
                  padding: "0.55rem 1.2rem",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                }}
              >
                <RotateCcw size={13} aria-hidden /> {copy.resetBtn}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-3xl px-4 text-center text-sm text-text-muted sm:px-6">
        {copy.footer}
      </p>

      {variant === "lesson" && isLessonComplete && (
        <p className="sr-only" role="status">
          Lesson exercise completed.
        </p>
      )}

      <style jsx global>{`
        @keyframes evalGrowBar {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes evalFadeInRow {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes evaluator-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .evaluator-spin {
          animation: evaluator-spin 1s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .evaluator-spin {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
