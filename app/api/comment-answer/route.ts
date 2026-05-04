import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getUserProfile } from "@/lib/supabase/queries";
import { loadLessonById } from "@/lib/lessons/load";
import { isLessonV2Content, isLessonV3Content } from "@/types";
import { requestCommentary } from "@/lib/ai/openai";

// Commentary endpoint shared by V2 (open_question) and V3 (input step).
// Takes a user's answer + the id of the block/step inside the lesson,
// runs it through GPT-4o mini using the system_prompt versioned inside
// the lesson JSON, and returns the comment.
//
// The endpoint is server-only (the user's API key never touches the
// browser). It re-validates lessonId + blockId server-side and loads
// the system_prompt from disk — the client never sends or chooses the
// prompt, which closes a prompt-injection vector.
//
// PROMPTLY.md rule 16: per-lesson system prompts. No global default.
// PROMPTLY.md rule 14: the user always advances regardless of the AI
//   response — failures fall back to the per-step `fallback_response`.
//
// Wire-compat: V2 callers send `openQuestionId` + `userAnswer`; V3 callers
// send `blockId` + `answer`. Both shapes are accepted so the V2 view
// (still mounted for legacy lessons) keeps working unchanged.

const MAX_ANSWER_CHARS = 2000;
const LESSON_ID_RE = /^[a-z]+-\d{2}$/;
const BLOCK_ID_RE = /^[a-z][a-z0-9-]{0,99}$/;

interface RequestBody {
  lessonId?: unknown;
  // V2-style fields.
  openQuestionId?: unknown;
  userAnswer?: unknown;
  // V3-style fields.
  blockId?: unknown;
  answer?: unknown;
}

export async function POST(request: Request) {
  // 1. Auth gate. Only logged-in users with completed onboarding hit OpenAI.
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const profile = await getUserProfile(supabase, user.id);
  if (!profile) {
    return NextResponse.json({ error: "no_profile" }, { status: 401 });
  }

  // 2. Parse + validate the request body.
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : null;
  const blockIdRaw =
    typeof body.blockId === "string"
      ? body.blockId
      : typeof body.openQuestionId === "string"
      ? body.openQuestionId
      : null;
  const userAnswerRaw =
    typeof body.userAnswer === "string"
      ? body.userAnswer
      : typeof body.answer === "string"
      ? body.answer
      : null;
  if (!lessonId || !LESSON_ID_RE.test(lessonId)) {
    return NextResponse.json({ error: "invalid_lesson_id" }, { status: 400 });
  }
  if (!blockIdRaw || !BLOCK_ID_RE.test(blockIdRaw)) {
    return NextResponse.json({ error: "invalid_block_id" }, { status: 400 });
  }
  if (!userAnswerRaw) {
    return NextResponse.json({ error: "missing_answer" }, { status: 400 });
  }
  const userAnswer = userAnswerRaw.trim();
  if (userAnswer.length === 0) {
    return NextResponse.json({ error: "empty_answer" }, { status: 400 });
  }
  if (userAnswer.length > MAX_ANSWER_CHARS) {
    return NextResponse.json({ error: "answer_too_long" }, { status: 413 });
  }

  // 3. Load the lesson server-side, find the matching block (V3 input step
  //    OR V2 open_question), pull its system_prompt. The client never sees
  //    or sends the prompt, so a crafted body can't override it.
  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();
  const lesson = await loadLessonById(lessonId, lang);
  if (!lesson) {
    return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });
  }

  let systemPrompt: string | null = null;
  if (isLessonV3Content(lesson)) {
    const step = lesson.steps.find(
      (s) => s.type === "input" && s.id === blockIdRaw,
    );
    if (step && step.type === "input") systemPrompt = step.system_prompt;
  } else if (isLessonV2Content(lesson)) {
    const block = lesson.body.find(
      (b) => b.type === "open_question" && b.id === blockIdRaw,
    );
    if (block && block.type === "open_question")
      systemPrompt = block.system_prompt;
  }
  if (!systemPrompt) {
    return NextResponse.json(
      { error: "block_not_found" },
      { status: 404 },
    );
  }

  // 4. Call OpenAI with the per-question system_prompt.
  const result = await requestCommentary({
    systemPrompt,
    userAnswer,
  });
  if (!result.ok) {
    if (result.error.kind === "missing_api_key") {
      return NextResponse.json({ error: "missing_api_key" }, { status: 503 });
    }
    if (result.error.kind === "network_error") {
      return NextResponse.json({ error: "network_error" }, { status: 502 });
    }
    if (result.error.kind === "openai_error") {
      // Forward OpenAI's status code when sensible; otherwise normalize to 502.
      const code =
        result.error.status >= 400 && result.error.status < 500
          ? result.error.status
          : 502;
      return NextResponse.json({ error: "openai_error" }, { status: code });
    }
    return NextResponse.json({ error: "invalid_ai_response" }, { status: 502 });
  }

  return NextResponse.json({ comment: result.comment });
}

// Avoid Next.js trying to statically optimize this route handler.
export const dynamic = "force-dynamic";

// TODO (SECURITY-BACKLOG.md): add per-user-per-day rate limit (target 30/day)
// once we have a Supabase migration for an `ai_usage_log` table. The OpenAI
// Project budget cap is the current financial backstop.
