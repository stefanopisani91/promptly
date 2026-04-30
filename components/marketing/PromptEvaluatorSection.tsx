"use client";

import { useMemo } from "react";
import type { Lang } from "@/types";
import type { EvaluatorCopy } from "@/lib/evaluator/types";
import { makeLocalEvaluator } from "@/lib/evaluator/heuristics";
import PromptEvaluator from "./PromptEvaluator";

interface Props {
  copy: EvaluatorCopy;
  lang: Lang;
}

export function PromptEvaluatorSection({ copy, lang }: Props) {
  const evaluator = useMemo(() => makeLocalEvaluator(lang, copy), [lang, copy]);
  return (
    <PromptEvaluator
      copy={copy}
      evaluator={evaluator}
      variant="showcase"
      mode="local"
    />
  );
}
