"use client";

import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine } from "../SparkLine";
import type { BuiltRecap } from "../recap";

interface Props {
  copy: ProfilingCopy["step10"];
  userName: string;
  recap: BuiltRecap;
  pending: boolean;
  onConfirm: () => void;
  onModify: () => void;
}

export function Step10Recap({
  copy,
  userName,
  recap,
  pending,
  onConfirm,
  onModify,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SparkLine emphasis="lead">{copy.sparkIntro(userName)}</SparkLine>
        <SparkLine>{copy.sparkLead}</SparkLine>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-6 py-5 shadow-sm">
        <p className="text-base leading-relaxed text-text-primary sm:text-lg">
          {recap.narrative}
        </p>
        {recap.motivationQuote.length > 0 ? (
          <p className="mt-4 text-base leading-relaxed text-text-primary sm:text-lg">
            {recap.motivationLead}{" "}
            <span className="italic text-text-secondary">
              “{recap.motivationQuote}”
            </span>
            .
          </p>
        ) : null}
      </div>

      <SparkLine>{copy.sparkConfirm}</SparkLine>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <PrimaryCta onClick={onConfirm} pending={pending}>
          {copy.confirmCta}
        </PrimaryCta>
        <PrimaryCta variant="secondary" onClick={onModify} disabled={pending}>
          {copy.modifyCta}
        </PrimaryCta>
      </div>
    </div>
  );
}
