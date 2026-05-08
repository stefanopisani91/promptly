"use client";

// ProfilingShell — orchestrator for the 12-step onboarding/profilazione flow
// described in Profilazione.md. Owns the answers state, step pointer,
// branching logic, Spark's emotional state per step and the server-action
// calls (progressive save + final complete + promise generation).
//
// Branching:
//   • Step 5 (project description) skipped when project_clarity = "exploring".
//   • Step 7 (preferred tool) skipped when no IDE-category tool was selected.
//
// Spark animation states (5 trigger points + idle baseline) per spec
// "Animazioni di Spark — TRIGGER POINTS".
//
// Persistence:
//   • Each step calls saveOnboardingStep on advance — best-effort, never
//     blocks UX.
//   • Step 11 calls generatePromises — Anthropic with static fallback.
//   • Step 12 calls completeOnboarding — flips onboarding_completed_at and
//     redirects to /dashboard.

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  type ExperienceLevel,
  type Lang,
  type ProfilePromises,
  type ProjectClarity,
  type SparkState,
} from "@/types";
import { getProfilingCopy } from "@/lib/i18n/profiling";
import { hasAnyIdeTool } from "@/lib/onboarding/tools";
import {
  completeOnboarding,
  generatePromises,
  saveOnboardingStep,
} from "@/app/(auth)/onboarding/actions";
import { ProfilingFrame } from "./ProfilingFrame";
import {
  INITIAL_ANSWERS,
  type ProfileAnswers,
  type StepDirection,
} from "./types";
import { buildRecap } from "./recap";
import { Step1Welcome } from "./steps/Step1Welcome";
import { Step2Name } from "./steps/Step2Name";
import { Step3Experience } from "./steps/Step3Experience";
import { Step4Intent } from "./steps/Step4Intent";
import { Step5Project } from "./steps/Step5Project";
import { Step6Tools } from "./steps/Step6Tools";
import { Step7PreferredTool } from "./steps/Step7PreferredTool";
import { Step8Time } from "./steps/Step8Time";
import { Step9Motivation } from "./steps/Step9Motivation";
import { Step10Recap } from "./steps/Step10Recap";
import { Step11Promises } from "./steps/Step11Promises";
import { Step12Transition } from "./steps/Step12Transition";

const TOTAL_STEPS = 12;
const LOCALE_COOKIE = "NEXT_LOCALE";
const NAME_REGEX = /^[\p{L}\p{N}\s\-']+$/u;
const NAME_MIN = 2;
const NAME_MAX = 30;
const PROJECT_DESCRIPTION_MIN = 10;
// Lowered from 300 → 200 (2026-05-09) to keep AI prompts cheap and
// downstream quotes readable. Existing DB rows are NOT migrated.
const PROJECT_DESCRIPTION_MAX = 200;
const DEEP_MOTIVATION_MIN = 15;
const DEEP_MOTIVATION_MAX = 500;
const STEP4_THINKING_MS = 1500;

type StepIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Normalised step counter for the progress label. The denominator is
// FIXED at the maximum possible (TOTAL_STEPS = 12) so it never changes
// mid-flow when branching kicks in. The numerator counts only visible
// steps reached so far, so the user sees a contiguous "1 of 12", "2 of
// 12" … and finishes at "10/12", "11/12", or "12/12" depending on how
// many steps their path skipped — an honest "you took a slightly
// shorter path".
function getVisibleStepInfo(
  step: StepIndex,
  isStep5Visible: boolean,
  isStep7Visible: boolean,
): { currentVisible: number; totalVisible: number } {
  let currentVisible = 0;
  for (let i = 1; i <= step; i++) {
    if (i === 5 && !isStep5Visible) continue;
    if (i === 7 && !isStep7Visible) continue;
    currentVisible++;
  }
  return { currentVisible, totalVisible: TOTAL_STEPS };
}

interface Props {
  initialName: string;
  initialLang: Lang;
  signupSource: string | null;
}

export function ProfilingShell({
  initialName,
  initialLang,
  signupSource,
}: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<ProfileAnswers>(() => ({
    ...INITIAL_ANSWERS,
    language: initialLang,
    full_name: initialName,
  }));
  const [step, setStep] = useState<StepIndex>(1);
  const [direction, setDirection] = useState<StepDirection>("forward");
  const [pending, startTransition] = useTransition();
  const [stepError, setStepError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  // Step 4 commentary: "non ancora" auto-shows the warm reassurance, then
  // advances on click; we keep a flag so re-rendering doesn't re-flash it.
  const [showStep4Commentary, setShowStep4Commentary] = useState(false);
  // Spark transitions to "thinking" briefly after Step 4's choice (per spec).
  const [step4Thinking, setStep4Thinking] = useState(false);
  // Step 11 — promise generation lifecycle.
  const [promisesLoading, setPromisesLoading] = useState(false);
  // Used to prevent double-firing the generation request when the user
  // re-enters Step 11 via the back button.
  const promisesGeneratedRef = useRef(false);
  // Step 7 — distinguishes "user explicitly picked an option (including
  // 'none')" from "user just landed on the step". `preferred_tool` is null
  // in both cases, so we need this side-channel to keep the no-default
  // rule (G3) and require an explicit click before advancing.
  const [step7Picked, setStep7Picked] = useState(false);

  const copy = useMemo(
    () => getProfilingCopy(answers.language),
    [answers.language],
  );

  // Persist locale cookie when language changes (parallels the previous
  // shell so the rest of the app immediately reflects the choice).
  // We also `router.refresh()` so the auth layout's server-rendered
  // header (logo aria-label, lang switcher aria-label) and the root
  // <html lang> pick up the new locale on the next paint. The shell's
  // local state is preserved across the refresh.
  const setLanguage = useCallback((next: Lang) => {
    setAnswers((s) => ({ ...s, language: next }));
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
    }
    router.refresh();
  }, [router]);

  const patchAnswers = useCallback((patch: Partial<ProfileAnswers>) => {
    setAnswers((s) => ({ ...s, ...patch }));
  }, []);

  // ───── Navigation helpers ─────────────────────────────────────────

  const isStep5Visible = answers.project_clarity !== "exploring";
  const isStep7Visible = hasAnyIdeTool(answers.tools_used);

  function nextStep(from: StepIndex): StepIndex {
    let n = from + 1;
    if (n === 5 && !isStep5Visible) n = 6;
    if (n === 7 && !isStep7Visible) n = 8;
    if (n > TOTAL_STEPS) n = TOTAL_STEPS;
    return n as StepIndex;
  }

  function prevStep(from: StepIndex): StepIndex {
    let p = from - 1;
    if (p === 7 && !isStep7Visible) p = 6;
    if (p === 5 && !isStep5Visible) p = 4;
    if (p < 1) p = 1;
    return p as StepIndex;
  }

  const goForward = useCallback(() => {
    setDirection("forward");
    setStepError(null);
    setStep((current) => nextStep(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStep5Visible, isStep7Visible]);

  const goBack = useCallback(() => {
    setDirection("backward");
    setStepError(null);
    setStep((current) => prevStep(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStep5Visible, isStep7Visible]);

  // Best-effort progressive save. Never blocks the user — if the network
  // hiccups we still let them continue; the next successful save will
  // overwrite stale fields.
  const saveAsync = useCallback(
    (patch: Parameters<typeof saveOnboardingStep>[0]) => {
      void saveOnboardingStep(patch).then((res) => {
        if (!res.ok && res.error === "unauthorized") {
          // Session lapsed mid-flow — bounce to /auth.
          router.replace("/auth");
        }
      });
    },
    [router],
  );

  // ───── Validation ─────────────────────────────────────────────────

  function validateName(value: string): string | null {
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (trimmed.length === 0) return copy.step2.errors.empty;
    if (trimmed.length < NAME_MIN) return copy.step2.errors.tooShort;
    if (trimmed.length > NAME_MAX) return copy.step2.errors.tooLong;
    if (!NAME_REGEX.test(trimmed)) return copy.step2.errors.invalidChars;
    return null;
  }

  function validateProjectDescription(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length < PROJECT_DESCRIPTION_MIN) return copy.step5.errors.tooShort;
    if (trimmed.length > PROJECT_DESCRIPTION_MAX) return copy.step5.errors.tooLong;
    return null;
  }

  function validateDeepMotivation(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length < DEEP_MOTIVATION_MIN) return copy.step9.errors.tooShort;
    if (trimmed.length > DEEP_MOTIVATION_MAX) return copy.step9.errors.tooLong;
    return null;
  }

  // ───── Per-step "advance" handlers ────────────────────────────────

  function advanceStep1() {
    saveAsync({ language: answers.language });
    goForward();
  }

  function advanceStep2() {
    const error = validateName(answers.full_name);
    if (error) {
      setStepError(error);
      return;
    }
    const cleaned = answers.full_name.trim().replace(/\s+/g, " ");
    if (cleaned !== answers.full_name) patchAnswers({ full_name: cleaned });
    saveAsync({ full_name: cleaned, language: answers.language });
    goForward();
  }

  function advanceStep3() {
    if (!answers.experience_level) return;
    saveAsync({ experience_level: answers.experience_level });
    goForward();
  }

  function chooseStep4(next: ProjectClarity) {
    patchAnswers({ project_clarity: next });
    saveAsync({ project_clarity: next });
    if (next === "exploring") {
      setShowStep4Commentary(true);
      // Brief Spark "thinking" pause as per spec, then advance.
      setStep4Thinking(true);
      window.setTimeout(() => {
        setStep4Thinking(false);
      }, STEP4_THINKING_MS);
    } else {
      setShowStep4Commentary(false);
    }
  }

  function advanceStep4() {
    if (!answers.project_clarity) return;
    goForward();
  }

  function advanceStep5() {
    if (answers.project_clarity === "exploring") {
      goForward();
      return;
    }
    const error = validateProjectDescription(answers.project_description);
    if (error) {
      setStepError(error);
      return;
    }
    saveAsync({ project_description: answers.project_description.trim() });
    goForward();
  }

  function advanceStep6() {
    saveAsync({
      tools_used: answers.tools_used,
      tools_other: answers.tools_other.trim() || null,
    });
    // If the user no longer qualifies for Step 7 (e.g. they removed all IDE
    // selections), make sure preferred_tool is reset.
    if (!hasAnyIdeTool(answers.tools_used)) {
      if (answers.preferred_tool) {
        patchAnswers({ preferred_tool: null });
        saveAsync({ preferred_tool: null });
      }
      // Re-arm the "explicit pick" guard so that, if the user later goes
      // back to step 6 and re-adds an IDE tool, step 7 won't auto-advance
      // on a stale touched flag.
      setStep7Picked(false);
    }
    goForward();
  }

  function advanceStep7() {
    if (!step7Picked) return;
    saveAsync({ preferred_tool: answers.preferred_tool });
    goForward();
  }

  function advanceStep8() {
    if (!answers.daily_goal) return;
    saveAsync({ daily_goal: answers.daily_goal });
    goForward();
  }

  function advanceStep9() {
    const error = validateDeepMotivation(answers.deep_motivation);
    if (error) {
      setStepError(error);
      return;
    }
    saveAsync({ deep_motivation: answers.deep_motivation.trim() });
    goForward();
  }

  function advanceStep10Confirm() {
    // Recap confirmed — kick off STEP 11 which will trigger generation.
    goForward();
  }

  function advanceStep10Modify() {
    // Take the user back to Step 4 (intent). They can re-walk the answers;
    // the persistent state is kept so they don't re-type things they're
    // happy with.
    setDirection("backward");
    setStepError(null);
    setStep(4);
  }

  function advanceStep11() {
    if (!answers.promises) return;
    goForward();
  }

  function advanceStep12() {
    if (
      !answers.full_name ||
      !answers.experience_level ||
      !answers.project_clarity ||
      !answers.daily_goal ||
      !answers.deep_motivation
    ) {
      setGlobalError(copy.shell.genericError);
      return;
    }
    setGlobalError(null);
    const dailyGoal = answers.daily_goal;
    startTransition(async () => {
      const res = await completeOnboarding({
        fullName: answers.full_name,
        language: answers.language,
        dailyGoal,
        experienceLevel: answers.experience_level as ExperienceLevel,
        projectClarity: answers.project_clarity as ProjectClarity,
        projectDescription:
          answers.project_clarity === "exploring"
            ? null
            : answers.project_description.trim(),
        toolsUsed: answers.tools_used,
        toolsOther: answers.tools_other.trim() || null,
        preferredTool: answers.preferred_tool,
        deepMotivation: answers.deep_motivation.trim(),
        signupSource,
      });
      if (!res.ok) {
        setGlobalError(copy.shell.genericError);
        return;
      }
      // Send the user to Lesson 1 (mindset/01-...) directly — per
      // Profilazione.md §"STEP 12 — Transizione alla Lezione 1".
      router.push("/lesson/mindset-01?from=onboarding");
      router.refresh();
    });
  }

  // ───── STEP 11 — promise generation (Anthropic) ────────────────────

  useEffect(() => {
    if (step !== 11) return;
    if (promisesGeneratedRef.current) return;
    if (
      !answers.experience_level ||
      !answers.project_clarity ||
      !answers.daily_goal ||
      !answers.deep_motivation
    ) {
      // Defensive — this shouldn't happen if validation worked. Bail and
      // send the user back to fix their answers.
      setStep(8);
      return;
    }

    promisesGeneratedRef.current = true;
    setPromisesLoading(true);
    void generatePromises({
      language: answers.language,
      user_name: answers.full_name.trim(),
      experience_level: answers.experience_level,
      project_clarity: answers.project_clarity,
      project_description:
        answers.project_clarity === "exploring"
          ? null
          : answers.project_description.trim() || null,
      tools_used: answers.tools_used,
      preferred_tool: answers.preferred_tool,
      daily_goal: answers.daily_goal,
      deep_motivation: answers.deep_motivation.trim(),
    })
      .then((res) => {
        if (res.ok) {
          patchAnswers({ promises: res.promises });
        } else {
          // generatePromises ALWAYS resolves with promises (falling back to
          // static text on Anthropic failures), so this branch only fires
          // for unauthorized/invalid_input. Reset the guard so a retry from
          // a back-and-forward navigation can recover.
          promisesGeneratedRef.current = false;
          patchAnswers({ promises: copy.step11.fallbackPromises });
        }
      })
      .finally(() => {
        setPromisesLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ───── Spark state per step ───────────────────────────────────────

  const sparkState: SparkState = useMemo(() => {
    switch (step) {
      case 1:
        return "listening";
      case 4:
        return step4Thinking ? "thinking" : "idle";
      case 6:
        return "surprised";
      case 9:
        return "listening";
      case 11:
        return promisesLoading ? "thinking" : "happy";
      case 12:
        return "happy";
      default:
        return "idle";
    }
  }, [step, step4Thinking, promisesLoading]);

  // ───── Render ─────────────────────────────────────────────────────

  const recap = step === 10 ? buildRecap(answers, copy.step10, answers.language) : null;

  // The visible counter normalises around skipped steps so the user never
  // sees the index jump (e.g. "6 of 12" → "8 of 12" when step 7 is hidden).
  // It counts only the steps that will actually render given the current
  // branching state.
  const { currentVisible, totalVisible } = getVisibleStepInfo(
    step,
    isStep5Visible,
    isStep7Visible,
  );

  return (
    <ProfilingFrame
      step={currentVisible}
      totalSteps={totalVisible}
      sparkState={sparkState}
      direction={direction}
      onBack={step > 1 ? goBack : undefined}
      backLabel={copy.shell.backLabel}
      progressLabel={copy.shell.progressLabel(currentVisible, totalVisible)}
      contentKey={`step-${step}-${direction}`}
    >
      <StepBody
        step={step}
        copy={copy}
        answers={answers}
        pending={pending}
        stepError={stepError}
        showStep4Commentary={showStep4Commentary}
        promisesLoading={promisesLoading}
        step7Picked={step7Picked}
        recap={recap}
        setLanguage={setLanguage}
        patchAnswers={patchAnswers}
        chooseStep4={chooseStep4}
        choosePreferredTool={(next) => {
          setStep7Picked(true);
          patchAnswers({ preferred_tool: next });
        }}
        advance={{
          step1: advanceStep1,
          step2: advanceStep2,
          step3: advanceStep3,
          step4: advanceStep4,
          step5: advanceStep5,
          step6: advanceStep6,
          step7: advanceStep7,
          step8: advanceStep8,
          step9: advanceStep9,
          step10Confirm: advanceStep10Confirm,
          step10Modify: advanceStep10Modify,
          step11: advanceStep11,
          step12: advanceStep12,
        }}
      />

      {globalError ? (
        <p role="alert" className="mt-4 text-sm text-error">
          {globalError}
        </p>
      ) : null}
    </ProfilingFrame>
  );
}

// Extracted body switch so the shell stays readable. Each branch only
// passes the props the step actually needs.
interface StepBodyProps {
  step: StepIndex;
  copy: ReturnType<typeof getProfilingCopy>;
  answers: ProfileAnswers;
  pending: boolean;
  stepError: string | null;
  showStep4Commentary: boolean;
  promisesLoading: boolean;
  step7Picked: boolean;
  recap: ReturnType<typeof buildRecap>;
  setLanguage: (lang: Lang) => void;
  patchAnswers: (patch: Partial<ProfileAnswers>) => void;
  chooseStep4: (next: ProjectClarity) => void;
  choosePreferredTool: (next: string | null) => void;
  advance: {
    step1: () => void;
    step2: () => void;
    step3: () => void;
    step4: () => void;
    step5: () => void;
    step6: () => void;
    step7: () => void;
    step8: () => void;
    step9: () => void;
    step10Confirm: () => void;
    step10Modify: () => void;
    step11: () => void;
    step12: () => void;
  };
}

function StepBody({
  step,
  copy,
  answers,
  pending,
  stepError,
  showStep4Commentary,
  promisesLoading,
  step7Picked,
  recap,
  setLanguage,
  patchAnswers,
  chooseStep4,
  choosePreferredTool,
  advance,
}: StepBodyProps) {
  const continueLabel = copy.shell.continueCta;
  // Visual highlight on the "no tools" card. Pure derived value — the
  // shell never persists a separate boolean for this; the empty arrays
  // are the source of truth.
  const noneSelected =
    answers.tools_used.length === 0 && answers.tools_other.trim().length === 0;

  switch (step) {
    case 1:
      return (
        <Step1Welcome
          copy={copy.step1}
          language={answers.language}
          onLanguageChange={setLanguage}
          onAdvance={advance.step1}
          pending={pending}
        />
      );
    case 2:
      return (
        <Step2Name
          copy={copy.step2}
          value={answers.full_name}
          error={stepError}
          pending={pending}
          onChange={(v) => patchAnswers({ full_name: v })}
          onAdvance={advance.step2}
          ctaLabel={continueLabel}
        />
      );
    case 3:
      return (
        <Step3Experience
          copy={copy.step3}
          userName={answers.full_name}
          value={answers.experience_level}
          pending={pending}
          onChange={(v: ExperienceLevel) => patchAnswers({ experience_level: v })}
          onAdvance={advance.step3}
          ctaLabel={continueLabel}
        />
      );
    case 4:
      return (
        <Step4Intent
          copy={copy.step4}
          value={answers.project_clarity}
          pending={pending}
          showExploringCommentary={showStep4Commentary}
          onChange={chooseStep4}
          onAdvance={advance.step4}
          ctaLabel={continueLabel}
        />
      );
    case 5: {
      // Defensive: if the user reaches step 5 with exploring, advance.
      if (
        answers.project_clarity !== "precise" &&
        answers.project_clarity !== "vague"
      ) {
        return null;
      }
      return (
        <Step5Project
          copy={copy.step5}
          clarity={answers.project_clarity}
          value={answers.project_description}
          error={stepError}
          pending={pending}
          onChange={(v) => patchAnswers({ project_description: v })}
          onAdvance={advance.step5}
          ctaLabel={continueLabel}
        />
      );
    }
    case 6:
      return (
        <Step6Tools
          copy={copy.step6}
          selected={answers.tools_used}
          toolsOther={answers.tools_other}
          noneSelected={noneSelected && answers.tools_used.length === 0 && false}
          pending={pending}
          onToggleTool={(slug) => {
            const next = answers.tools_used.includes(slug)
              ? answers.tools_used.filter((s) => s !== slug)
              : [...answers.tools_used, slug];
            patchAnswers({ tools_used: next });
          }}
          onChangeOther={(v) => patchAnswers({ tools_other: v })}
          onSelectNone={() =>
            patchAnswers({
              tools_used: [],
              tools_other: "",
              preferred_tool: null,
            })
          }
          onAdvance={advance.step6}
          ctaLabel={continueLabel}
          // The "none" pill stays visually subtle until the user explicitly
          // empties everything — keeps the default state from looking
          // pre-answered.
        />
      );
    case 7:
      return (
        <Step7PreferredTool
          copy={copy.step7}
          toolsSelected={answers.tools_used}
          value={answers.preferred_tool}
          picked={step7Picked}
          pending={pending}
          onChange={choosePreferredTool}
          onAdvance={advance.step7}
          ctaLabel={continueLabel}
        />
      );
    case 8:
      return (
        <Step8Time
          copy={copy.step8}
          value={answers.daily_goal}
          pending={pending}
          onChange={(v) => patchAnswers({ daily_goal: v })}
          onAdvance={advance.step8}
          ctaLabel={continueLabel}
        />
      );
    case 9:
      return (
        <Step9Motivation
          copy={copy.step9}
          value={answers.deep_motivation}
          error={stepError}
          pending={pending}
          onChange={(v) => patchAnswers({ deep_motivation: v })}
          onAdvance={advance.step9}
          ctaLabel={continueLabel}
        />
      );
    case 10:
      if (!recap) return null;
      return (
        <Step10Recap
          copy={copy.step10}
          userName={answers.full_name}
          recap={recap}
          pending={pending}
          onConfirm={advance.step10Confirm}
          onModify={advance.step10Modify}
        />
      );
    case 11:
      return (
        <Step11Promises
          copy={copy.step11}
          loading={promisesLoading}
          promises={answers.promises}
          pending={pending}
          onAdvance={advance.step11}
        />
      );
    case 12:
      return (
        <Step12Transition
          copy={copy.step12}
          userName={answers.full_name}
          pending={pending}
          onAdvance={advance.step12}
        />
      );
    default:
      return null;
  }
}

export type { ProfileAnswers };
export type { ProfilePromises };
