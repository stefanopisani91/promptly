import type { Lang } from "@/types";

export type DimensionKey = "chiarezza" | "contesto" | "obiettivo" | "protezione";

export interface DimensionScore {
  key: DimensionKey;
  value: number;
}

export interface EvaluationResult {
  chiarezza: number;
  contesto: number;
  obiettivo: number;
  protezione: number;
  totale: number;
  consiglio: string;
}

export type Evaluator = (
  prompt: string,
  signal?: AbortSignal,
) => Promise<EvaluationResult>;

export type EvaluatorMode = "local" | "api";

export interface BugExample {
  code: string;
  error: string;
  hint: string;
}

export interface DimensionMeta {
  key: DimensionKey;
  label: string;
  desc: string;
  color: string;
  advice: string;
}

export interface EvaluatorCopy {
  badge: string;
  modeLabel: string;
  title: string;
  titleEm: string;
  sub: string;
  bug: BugExample;
  bashTab: string;
  cmdCat: string;
  cmdRun: string;
  editorTab: string;
  resultTab: string;
  evalLabel: string;
  evaluatingLabel: string;
  adviceLabel: string;
  textareaPlaceholder: string;
  ariaTextarea: string;
  ariaScore: string;
  ariaBar: string;
  runBtn: string;
  runningBtn: string;
  resetBtn: string;
  statusReady: string;
  statusEvaluating: string;
  statusEvaluated: string;
  charsLabel: string;
  scoreLabels: {
    excellent: string;
    good: string;
    improve: string;
    insufficient: string;
  };
  dimensions: Record<DimensionKey, { label: string; desc: string; advice: string }>;
  consiglio: {
    excellent: string;
    excellentWithWeak: string;
    good: string;
    medium: string;
    low: string;
  };
  footer: string;
}

export interface EvaluatorLocaleConfig {
  lang: Lang;
  copy: EvaluatorCopy;
}
