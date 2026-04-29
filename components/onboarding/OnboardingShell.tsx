"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { type DailyGoal, type Lang } from "@/types";
import { getAuthCopy } from "@/lib/i18n/auth";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/app/(auth)/onboarding/actions";
import { OnboardingStepName } from "./OnboardingStepName";
import { OnboardingStepLanguage } from "./OnboardingStepLanguage";
import { OnboardingStepGoal } from "./OnboardingStepGoal";

const NAME_REGEX = /^[\p{L}\p{N}\s\-']+$/u;
const NAME_MAX = 40;
const LOCALE_COOKIE = "NEXT_LOCALE";
const TOTAL_STEPS = 3;

type Step = 1 | 2 | 3;

interface Props {
  initialName: string;
  initialLang: Lang;
  signupSource: string | null;
  completedDemo: boolean;
}

function validateName(value: string, errors: { empty: string; tooLong: string; invalidChars: string }): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return errors.empty;
  if (trimmed.length > NAME_MAX) return errors.tooLong;
  if (!NAME_REGEX.test(trimmed)) return errors.invalidChars;
  return null;
}

export function OnboardingShell({
  initialName,
  initialLang,
  signupSource,
  completedDemo,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(initialName);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [goal, setGoal] = useState<DailyGoal>("easy");
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();

  const copy = useMemo(() => getAuthCopy(lang).onboarding, [lang]);

  function persistLocaleCookie(next: Lang) {
    if (typeof document === "undefined") return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  function handleNameChange(value: string) {
    setName(value);
    if (nameError) setNameError(null);
  }

  function handleContinueFromName() {
    const error = validateName(name, copy.step1.errors);
    if (error) {
      setNameError(error);
      return;
    }
    setStep(2);
  }

  function handleLanguageChange(next: Lang) {
    setLang(next);
    persistLocaleCookie(next);
  }

  function handleContinueFromLanguage() {
    setStep(3);
  }

  function handleFinalSubmit() {
    if (submitting) return;
    const error = validateName(name, copy.step1.errors);
    if (error) {
      setNameError(error);
      setStep(1);
      return;
    }
    setSubmitError(null);

    startTransition(async () => {
      const result = await completeOnboarding({
        fullName: name.trim().replace(/\s+/g, " "),
        language: lang,
        dailyGoal: goal,
        signupSource,
      });

      if (!result.ok) {
        setSubmitError(copy.genericError);
        return;
      }

      const params = new URLSearchParams({ welcome: "true" });
      if (completedDemo) params.set("completed_demo", "true");
      router.push(`/dashboard?${params.toString()}`);
      router.refresh();
    });
  }

  const ctaLabel =
    step === 3
      ? submitting
        ? copy.submitting
        : copy.finalCta
      : copy.continueCta;

  function onPrimaryClick() {
    if (step === 1) return handleContinueFromName();
    if (step === 2) return handleContinueFromLanguage();
    return handleFinalSubmit();
  }

  return (
    <div className="w-full max-w-[480px] rounded-2xl border border-border bg-surface p-7 shadow-sm sm:p-9">
      <ProgressDots
        current={step}
        total={TOTAL_STEPS}
        label={copy.progressLabel(step, TOTAL_STEPS)}
      />

      <div className="mt-6">
        {step === 1 && (
          <OnboardingStepName
            copy={copy.step1}
            value={name}
            error={nameError}
            disabled={submitting}
            onChange={handleNameChange}
            onSubmit={handleContinueFromName}
          />
        )}
        {step === 2 && (
          <OnboardingStepLanguage
            copy={copy.step2}
            value={lang}
            disabled={submitting}
            onChange={handleLanguageChange}
          />
        )}
        {step === 3 && (
          <OnboardingStepGoal
            copy={copy.step3}
            value={goal}
            disabled={submitting}
            onChange={setGoal}
          />
        )}
      </div>

      <button
        type="button"
        onClick={onPrimaryClick}
        disabled={submitting}
        className={cn(
          "mt-7 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover",
          submitting && "cursor-not-allowed opacity-60",
        )}
      >
        {ctaLabel}
      </button>

      {submitError && (
        <p role="alert" className="mt-3 text-sm text-error">
          {submitError}
        </p>
      )}
    </div>
  );
}

interface ProgressDotsProps {
  current: number;
  total: number;
  label: string;
}

function ProgressDots({ current, total, label }: ProgressDotsProps) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={label}
    >
      {Array.from({ length: total }, (_, i) => {
        const filled = i < current;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              filled ? "bg-primary" : "bg-border",
            )}
          />
        );
      })}
    </div>
  );
}
