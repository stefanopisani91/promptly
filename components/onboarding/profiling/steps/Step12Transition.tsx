"use client";

import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine } from "../SparkLine";

interface Props {
  copy: ProfilingCopy["step12"];
  userName: string;
  pending: boolean;
  onAdvance: () => void;
}

export function Step12Transition({
  copy,
  userName,
  pending,
  onAdvance,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <SparkLine emphasis="lead">{copy.sparkLine1(userName)}</SparkLine>
      <SparkLine>{copy.sparkLine2}</SparkLine>
      <div>
        <PrimaryCta onClick={onAdvance} pending={pending}>
          {copy.cta}
        </PrimaryCta>
      </div>
    </div>
  );
}
