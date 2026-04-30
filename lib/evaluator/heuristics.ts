import type { Lang } from "@/types";
import type { EvaluationResult, EvaluatorCopy, DimensionKey } from "./types";

const KEYWORDS: Record<Lang, Record<DimensionKey, RegExp[]>> = {
  it: {
    chiarezza: [
      /typeerror|referenceerror|syntaxerror|cannot read|is not (a )?function|undefined|null/i,
      /errore|crash|crasha|non funziona|fallisce|stack trace/i,
    ],
    contesto: [
      /\bapi\b|fetch|async|await|caric|chiamata|backend|server|endpoint/i,
      /funzione|componente|hook|react|next|app|pagina|setstate|usestate|useeffect/i,
      /intermitt|a volte|talvolta|qualche volta|saltuariam|random|alle volte/i,
      /produzione|sviluppo|locale|staging|test|database|browser/i,
    ],
    obiettivo: [
      /vorrei|voglio|dovrebbe|deve|aspetto|atteso|comportamento|risultato/i,
      /capire|comprendere|spiega|spiegami|perch[eé]|motivo|causa/i,
      /gestire|gestione|caso|fallback|default|controll|validare/i,
      /risolv|fix|correg|sistem/i,
    ],
    protezione: [
      /non tocc|non modific|non camb|senza modific|senza tocc/i,
      /minim|piccol|solo questa|solo questo|esclusivam/i,
      /spiega|spiegami|motivazio|cosa modific|cosa camb/i,
      /effetti collateral|side effect|altre parti|resto del/i,
    ],
  },
  en: {
    chiarezza: [
      /typeerror|referenceerror|syntaxerror|cannot read|is not (a )?function|undefined|null/i,
      /error|crash|broken|fails|stack trace|exception/i,
    ],
    contesto: [
      /\bapi\b|fetch|async|await|loading|backend|server|endpoint/i,
      /function|component|hook|react|next|app|page|setstate|usestate|useeffect/i,
      /intermitt|sometimes|occasion|random|flaky/i,
      /production|development|local|staging|test|database|browser/i,
    ],
    obiettivo: [
      /want|would like|should|expect|expected|behavior|outcome/i,
      /understand|explain|why|reason|cause/i,
      /handle|case|fallback|default|guard|validate/i,
      /fix|solve|correct|repair/i,
    ],
    protezione: [
      /don'?t (touch|modify|change)|without (modifying|touching|changing)|leave .* alone/i,
      /minimal|small|only this|just this|exclusively/i,
      /explain|reason(ing)?|what (you )?(modify|change|update)/i,
      /side effects?|other parts|rest of the/i,
    ],
  },
};

interface HeuristicConfig {
  chiarezza: { floor: number; weights: number[]; lengthBonus: { threshold: number; pts: number } };
  contesto: { floor: number; weights: number[]; lengthBonus: { threshold: number; pts: number } };
  obiettivo: { floor: number; weights: number[] };
  protezione: { floor: number; weights: number[] };
}

const CONFIG: HeuristicConfig = {
  chiarezza: {
    floor: 20,
    weights: [30, 20],
    lengthBonus: { threshold: 80, pts: 10 },
  },
  contesto: {
    floor: 15,
    weights: [25, 20, 15, 15],
    lengthBonus: { threshold: 120, pts: 10 },
  },
  obiettivo: {
    floor: 15,
    weights: [25, 25, 20, 15],
  },
  protezione: {
    floor: 25,
    weights: [25, 20, 20, 15],
  },
};

const DIMENSION_ORDER: DimensionKey[] = [
  "protezione",
  "obiettivo",
  "contesto",
  "chiarezza",
];

function scoreDimension(
  prompt: string,
  patterns: RegExp[],
  weights: number[],
  floor: number,
  lengthBonus?: { threshold: number; pts: number },
): number {
  let total = floor;
  patterns.forEach((re, i) => {
    if (re.test(prompt) && weights[i] !== undefined) {
      total += weights[i];
    }
  });
  if (lengthBonus && prompt.length > lengthBonus.threshold) {
    total += lengthBonus.pts;
  }
  return Math.min(100, total);
}

function pickWeakest(
  scores: Record<DimensionKey, number>,
): { key: DimensionKey; value: number } {
  let weakest: { key: DimensionKey; value: number } = {
    key: DIMENSION_ORDER[0],
    value: scores[DIMENSION_ORDER[0]],
  };
  for (const key of DIMENSION_ORDER) {
    if (scores[key] < weakest.value) {
      weakest = { key, value: scores[key] };
    }
  }
  return weakest;
}

export function evaluatePromptLocal(
  prompt: string,
  lang: Lang,
  copy: EvaluatorCopy,
): EvaluationResult {
  const kws = KEYWORDS[lang];

  const chiarezza = scoreDimension(
    prompt,
    kws.chiarezza,
    CONFIG.chiarezza.weights,
    CONFIG.chiarezza.floor,
    CONFIG.chiarezza.lengthBonus,
  );
  const contesto = scoreDimension(
    prompt,
    kws.contesto,
    CONFIG.contesto.weights,
    CONFIG.contesto.floor,
    CONFIG.contesto.lengthBonus,
  );
  const obiettivo = scoreDimension(
    prompt,
    kws.obiettivo,
    CONFIG.obiettivo.weights,
    CONFIG.obiettivo.floor,
  );
  const protezione = scoreDimension(
    prompt,
    kws.protezione,
    CONFIG.protezione.weights,
    CONFIG.protezione.floor,
  );

  const totale = Math.round((chiarezza + contesto + obiettivo + protezione) / 4);

  const scores: Record<DimensionKey, number> = {
    chiarezza,
    contesto,
    obiettivo,
    protezione,
  };
  const weakest = pickWeakest(scores);
  const weakestAdvice = copy.dimensions[weakest.key].advice;

  let consiglio: string;
  if (totale >= 85) {
    consiglio =
      weakest.value < 75
        ? copy.consiglio.excellentWithWeak
            .replace("{dim}", copy.dimensions[weakest.key].label)
            .replace("{advice}", weakestAdvice)
        : copy.consiglio.excellent;
  } else if (totale >= 70) {
    consiglio = copy.consiglio.good
      .replace("{dim}", copy.dimensions[weakest.key].label)
      .replace("{advice}", weakestAdvice);
  } else if (totale >= 45) {
    consiglio = copy.consiglio.medium
      .replace("{dim}", copy.dimensions[weakest.key].label)
      .replace("{advice}", weakestAdvice);
  } else {
    consiglio = copy.consiglio.low.replace("{advice}", weakestAdvice);
  }

  return { chiarezza, contesto, obiettivo, protezione, totale, consiglio };
}

export function makeLocalEvaluator(lang: Lang, copy: EvaluatorCopy) {
  return async (prompt: string, signal?: AbortSignal): Promise<EvaluationResult> => {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 700);
      if (signal) {
        const onAbort = () => {
          clearTimeout(t);
          reject(new DOMException("Aborted", "AbortError"));
        };
        if (signal.aborted) onAbort();
        else signal.addEventListener("abort", onAbort, { once: true });
      }
    });
    return evaluatePromptLocal(prompt, lang, copy);
  };
}
