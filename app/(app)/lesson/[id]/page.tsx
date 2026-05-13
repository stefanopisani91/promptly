import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  isLang,
  isLessonV2Content,
  isLessonV3Content,
  type Lang,
} from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getLessonsCopy } from "@/lib/i18n/lessons";
import { getLandingCopy } from "@/lib/i18n/landing";
import { createClient } from "@/lib/supabase/server";
import {
  getLessonProgress,
  getUserProfile,
} from "@/lib/supabase/queries";
import { loadAvailableLessonsInPath, loadLessonById } from "@/lib/lessons/load";
import { isComingSoonPath } from "@/lib/map/data";
import {
  getLessonNeighbors,
  isPathUnlocked,
} from "@/lib/lessons/progress";
import { personaliseLessonForUser } from "@/lib/lessons/v3/personalize";
import { getToolBySlug } from "@/lib/onboarding/tools";
import { calculateLessonXp } from "@/lib/xp";
import { LessonShell } from "@/components/lessons/LessonShell";
import { TheoryRenderer } from "@/components/lessons/TheoryRenderer";
import {
  ExerciseFillBlank,
  type ExerciseFillBlankStrings,
} from "@/components/lessons/ExerciseFillBlank";
import {
  LessonV2View,
  type LessonV2ViewStrings,
} from "@/components/lessons/LessonV2View";
import { LessonNavigator } from "@/components/lessons/LessonNavigator";
import {
  LessonV3View,
  type LessonV3ViewStrings,
} from "@/components/lessons/v3/LessonV3View";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

const MAX_ATTEMPTS = 3;
const SPARK_CHAT_LIMIT = 5;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lang: Lang = resolveLangFromRequest();
  const lesson = await loadLessonById(params.id, lang);
  const description =
    lesson && "subtitle" in lesson && typeof lesson.subtitle === "string"
      ? lesson.subtitle
      : undefined;
  return {
    title: lesson ? lesson.title : `Lesson · ${params.id}`,
    description,
    robots: { index: false, follow: false },
  };
}

export default async function LessonPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) redirect("/auth");

  const profile = await getUserProfile(supabase, user.id);
  if (!profile || !profile.onboarding_completed_at) redirect("/onboarding");

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();

  const lesson = await loadLessonById(params.id, lang);
  if (!lesson) notFound();

  // Path 2 lessons exist on disk but are gated until launch (see
  // `COMING_SOON_PATHS` in lib/map/data.ts). Catch any deep-link or
  // stale bookmark that would otherwise serve the V1 fill-in-the-blank
  // surface we're hiding from the public; the dashboard reads
  // `?locked=path2` and shows a toast.
  if (isComingSoonPath(lesson.path_slug)) {
    redirect("/dashboard?locked=path2");
  }

  const unlocked = await isPathUnlocked(supabase, user.id, lesson.path_slug);
  if (!unlocked) redirect(`/path/${lesson.path_slug}`);

  const lessonsCopy = getLessonsCopy(lang);
  const available = await loadAvailableLessonsInPath(lesson.path_slug, lang);
  const { prev, next, positionLabel } = getLessonNeighbors(available, lesson);

  const pathDisplay = lessonsCopy.pathDisplay[lesson.path_slug];
  const pathHref = `/path/${lesson.path_slug}`;
  const positionText = lessonsCopy.lessonPage.lessonOf(
    positionLabel.current || lesson.order,
    Math.max(positionLabel.total, lesson.order),
  );

  // ─── V3 branch (card-step + Spark mascot) ───────────────────────────
  // Pre-resolves all i18n strings, the Lucia demo copy reused inside the
  // INTERACTIVE step, and the user's persisted state so the client view
  // boots straight into "resume where you left off".
  if (isLessonV3Content(lesson)) {
    // Personalise the lesson against the user's onboarding profile —
    // currently swaps Lesson 1's input-motivation step for a recap card
    // when project_description / project_clarity are already known, plus
    // Lesson 2 / Lesson 3 paragraph swaps based on experience_level /
    // preferred_tool / project_description.
    const personalisedLesson = personaliseLessonForUser(lesson, profile, {
      projectRecall: {
        intro: lessonsCopy.v3.mindset01.projectRecall.intro,
        recall: lessonsCopy.v3.mindset01.projectRecall.recall,
        exploring: lessonsCopy.v3.mindset01.projectRecall.exploring,
      },
      mindset02: lessonsCopy.v3.mindset02,
      mindset03: lessonsCopy.v3.mindset03,
      mindset04: lessonsCopy.v3.mindset04,
      mindset05: lessonsCopy.v3.mindset05,
      mindset06: lessonsCopy.v3.mindset06,
    });

    const persisted = await getLessonProgress(supabase, user.id, lesson.id);
    const alreadyCompleted = persisted?.completed ?? false;
    // If the lesson was previously completed, treat any re-entry as a fresh
    // walk-through: start from step 0 AND wipe the persisted step_state.
    // Without the wipe, interactive widgets read back their old result
    // (3 attempts already burned, locked editor, "Continua" CTA only) —
    // making the redo experience feel broken. The DB completion flag is
    // not touched, so XP isn't double-credited; only the per-step state
    // (results, choices, drafts) is cleared. Mid-lesson resumes (not yet
    // completed) preserve everything.
    const initialStep = alreadyCompleted
      ? 0
      : persisted?.current_step ?? 0;
    const rawStepState = persisted?.step_state;
    const initialStepState = alreadyCompleted
      ? ({} as Record<string, unknown>)
      : rawStepState &&
          typeof rawStepState === "object" &&
          !Array.isArray(rawStepState)
        ? (rawStepState as Record<string, unknown>)
        : {};
    const chatUsed = persisted?.spark_chat_count ?? 0;
    const chatRemaining = Math.max(0, SPARK_CHAT_LIMIT - chatUsed);

    const landingCopy = getLandingCopy(lang);

    const v3Strings: LessonV3ViewStrings = {
      header: lessonsCopy.v3.header,
      navigation: lessonsCopy.v3.navigation,
      inputStep: lessonsCopy.v3.inputStep,
      rewardStep: lessonsCopy.v3.rewardStep,
      interactiveStep: {
        hint: lessonsCopy.v3.interactiveStep.hint,
        attemptCounterTemplate:
          lessonsCopy.v3.interactiveStep.attemptCounterTemplate,
        placeholder: lessonsCopy.v3.interactiveStep.placeholder,
        submitCta: lessonsCopy.v3.interactiveStep.submitCta,
        submitting: lessonsCopy.v3.interactiveStep.submitting,
        retryCta: lessonsCopy.v3.interactiveStep.retryCta,
        finalCta: lessonsCopy.v3.interactiveStep.finalCta,
        networkError: lessonsCopy.v3.interactiveStep.networkError,
        rateLimitError: lessonsCopy.v3.interactiveStep.rateLimitError,
        apiError: lessonsCopy.v3.interactiveStep.apiError,
        awaitingPrompt: lessonsCopy.v3.interactiveStep.awaitingPrompt,
        sparkTabLabel: lessonsCopy.v3.interactiveStep.sparkTabLabel,
        siteTabLabel: lessonsCopy.v3.interactiveStep.siteTabLabel,
        reactions: lessonsCopy.v3.interactiveStep.reactions,
        dimensionLabels: lessonsCopy.v3.interactiveStep.dimensionLabels,
        homepageCopy: landingCopy.demo.homepage,
        consoleCopy: landingCopy.demo.console,
      },
      claudemdEditor: lessonsCopy.v3.claudemdEditor,
      contextEditor: lessonsCopy.v3.contextEditor,
      constraintsEditor: lessonsCopy.v3.constraintsEditor,
      brokenSessionDebugger: lessonsCopy.v3.brokenSessionDebugger,
      promptArchitecture: lessonsCopy.v3.promptArchitecture,
      chat: lessonsCopy.v3.chat,
      sparkHelper: lessonsCopy.v3.sparkHelper,
      glossary: lessonsCopy.v3.glossary,
    };

    // Lesson 6 — bits the prompt-architecture widget needs.
    // filenameSlug: kebab-case fragment for the .md filename. Prefer
    // the user's full_name; fall back to the email's local part. Both
    // get aggressively normalised — no spaces, no special chars.
    const filenameSlug = slugifyForFilename(
      profile.full_name?.trim() ||
        (profile.email ?? "").split("@")[0] ||
        "user",
    );
    // preferredToolDisplay: human-readable name pulled from the tool
    // catalog. Italian and English both fall back to "il tuo tool" /
    // "your tool" if the user hasn't picked one.
    const preferredToolDisplay = (() => {
      if (!profile.preferred_tool) {
        return lang === "it" ? "il tuo tool" : "your tool";
      }
      const tool = getToolBySlug(profile.preferred_tool);
      if (tool) return tool.display_name ?? tool.name;
      return lang === "it" ? "il tuo tool" : "your tool";
    })();

    // userProjectShort: ≤80-char compressed view of the learner's real
    // project, used by Lesson 3's briefing card to anchor the sample
    // scenario back to their world. Prefer the onboarding-compressed
    // version when present; fall back to a raw-truncated description.
    const userProjectShort = (() => {
      const compressed = profile.project_description_compressed?.trim();
      if (compressed && compressed.length > 0) return compressed;
      const raw = profile.project_description?.trim();
      if (raw && raw.length > 0) {
        return raw.length <= 80 ? raw : raw.slice(0, 80).trimEnd() + "…";
      }
      return null;
    })();

    return (
      <LessonV3View
        lesson={personalisedLesson}
        pathHref={pathHref}
        strings={v3Strings}
        initialStep={initialStep}
        initialStepState={initialStepState}
        alreadyCompleted={alreadyCompleted}
        initialChatRemaining={chatRemaining}
        chatLimit={SPARK_CHAT_LIMIT}
        userId={user.id}
        glossarySeen={profile.glossary_seen}
        lang={lang}
        filenameSlug={filenameSlug}
        preferredToolDisplay={preferredToolDisplay}
        userProjectShort={userProjectShort}
      />
    );
  }

  // ─── V2 branch (legacy open_question + archetype_quiz) ──────────────
  if (isLessonV2Content(lesson)) {
    const baseLessonXp = lesson.base_xp + lesson.difficulty_bonus_xp;
    const v2Strings: LessonV2ViewStrings = {
      body: {
        openQuestion: {
          submitCta: lessonsCopy.v2.openQuestion.submitCta,
          submitting: lessonsCopy.v2.openQuestion.submitting,
          submittedLabel: lessonsCopy.v2.openQuestion.submittedLabel,
          placeholderFallback: lessonsCopy.v2.openQuestion.placeholderFallback,
          charCounterTemplate: lessonsCopy.v2.openQuestion.charCounterTemplate,
          networkError: lessonsCopy.v2.openQuestion.networkError,
          apiError: lessonsCopy.v2.openQuestion.apiError,
          missingKeyError: lessonsCopy.v2.openQuestion.missingKeyError,
          retryCta: lessonsCopy.v2.openQuestion.retryCta,
          skipCta: lessonsCopy.v2.openQuestion.skipCta,
          skippedNotice: lessonsCopy.v2.openQuestion.skippedNotice,
        },
        archetypeQuiz: {
          questionOfTemplate: lessonsCopy.v2.archetypeQuiz.questionOfTemplate,
          pickOneHint: lessonsCopy.v2.archetypeQuiz.pickOneHint,
          revealCta: lessonsCopy.v2.archetypeQuiz.revealCta,
          revealedTitle: lessonsCopy.v2.archetypeQuiz.revealedTitle,
          bonusXpTemplate: lessonsCopy.v2.archetypeQuiz.bonusXpTemplate,
          retakeCta: lessonsCopy.v2.archetypeQuiz.retakeCta,
        },
      },
      finishCta: lessonsCopy.v2.completion.finishCta,
      alreadyCompleted: lessonsCopy.v2.completion.alreadyCompleted,
      outro: {
        title: lessonsCopy.outro.title,
        xpEarnedLabel: lessonsCopy.outro.xpEarned(baseLessonXp),
        nextLessonCta: lessonsCopy.outro.nextLessonCta,
        backToPathCta: lessonsCopy.outro.backToPathCta,
      },
      toast: {
        full: lessonsCopy.toast.xpLabel(baseLessonXp),
        dismissLabel: lessonsCopy.toast.dismissLabel,
      },
    };

    return (
      <LessonShell
        lesson={lesson}
        pathTitle={pathDisplay.title}
        pathHref={pathHref}
        copy={lessonsCopy}
        positionLabel={positionText}
      >
        <LessonV2View
          lesson={lesson}
          strings={v2Strings}
          nextLesson={next}
          pathHref={pathHref}
          baseLessonXp={baseLessonXp}
        />
        <LessonNavigator
          prev={prev}
          next={next}
          pathHref={pathHref}
          pathLabel={lessonsCopy.lessonPage.backToPathCta}
          positionLabel={positionText}
          navigationLabel={lessonsCopy.navigationLabel}
        />
      </LessonShell>
    );
  }

  // ─── V1 branch (legacy fill_blank) ──────────────────────────────────
  const xpFull = calculateLessonXp(
    lesson.base_xp,
    lesson.difficulty_bonus_xp,
    1,
  );
  const xpHalved = calculateLessonXp(
    lesson.base_xp,
    lesson.difficulty_bonus_xp,
    MAX_ATTEMPTS,
  );

  const exerciseStrings: ExerciseFillBlankStrings = {
    promptLabel: lessonsCopy.lessonPage.promptLabel,
    checkAnswer: lessonsCopy.lessonPage.checkAnswer,
    showHint: lessonsCopy.lessonPage.showHint,
    hintLabel: lessonsCopy.lessonPage.hintLabel,
    revealLabel: lessonsCopy.lessonPage.revealLabel,
    revealedNotice: lessonsCopy.lessonPage.revealedNotice,
    blankPlaceholder: lessonsCopy.lessonPage.blankPlaceholder,
    wrongInline: lessonsCopy.lessonPage.wrongInline,
    attemptLabels: Array.from({ length: MAX_ATTEMPTS }, (_, i) =>
      lessonsCopy.lessonPage.attemptOf(i + 1, MAX_ATTEMPTS),
    ),
    blankAriaLabels: lesson.exercise.blanks.map((_, i) =>
      lessonsCopy.lessonPage.blankAriaLabel(i + 1),
    ),
    xpLabelFull: lessonsCopy.outro.xpEarned(xpFull),
    xpLabelHalved: lessonsCopy.outro.xpEarned(xpHalved),
    toastLabelFull: lessonsCopy.toast.xpLabel(xpFull),
    toastLabelHalved: lessonsCopy.toast.xpLabel(xpHalved),
    toastDismissLabel: lessonsCopy.toast.dismissLabel,
  };

  const outroStrings = {
    title: lessonsCopy.outro.title,
    nextLessonCta: lessonsCopy.outro.nextLessonCta,
    backToPathCta: lessonsCopy.outro.backToPathCta,
  };

  return (
    <LessonShell
      lesson={lesson}
      pathTitle={pathDisplay.title}
      pathHref={pathHref}
      copy={lessonsCopy}
      positionLabel={positionText}
    >
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-text-muted">
          {lessonsCopy.lessonPage.theoryHeading}
        </h2>
        <TheoryRenderer blocks={lesson.theory} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-text-muted">
          {lessonsCopy.lessonPage.exerciseHeading}
        </h2>
        <ExerciseFillBlank
          lesson={lesson}
          exercise={lesson.exercise}
          strings={exerciseStrings}
          outroStrings={outroStrings}
          nextLesson={next}
          pathHref={pathHref}
        />
      </section>

      <LessonNavigator
        prev={prev}
        next={next}
        pathHref={pathHref}
        pathLabel={lessonsCopy.lessonPage.backToPathCta}
        positionLabel={positionText}
        navigationLabel={lessonsCopy.navigationLabel}
      />
    </LessonShell>
  );
}

// Conservative kebab-case slug — used in the .md filename for the
// Lesson 6 prompt download. Ascii-fold is best-effort; non-Latin
// users get a safe "user" fallback to avoid producing filenames the
// browser refuses to download.
function slugifyForFilename(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length === 0) return "user";
  const ascii = trimmed
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (ascii.length === 0) return "user";
  return ascii.slice(0, 40);
}
