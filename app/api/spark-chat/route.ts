// Free-form chat with Spark, scoped to a lesson. Authenticated route — uses
// the per-lesson `spark_chat_count` counter to enforce a 5-message quota
// per (user, lesson) regardless of session. Once a user runs out we 403
// with a structured error so the client can show the right message.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLessonProgress,
  incrementSparkChatCount,
} from "@/lib/supabase/queries";
import { requestCommentary } from "@/lib/ai/openai";
import {
  sparkSystemPromptEN,
  sparkSystemPromptIT,
} from "@/lib/ai/spark-system-prompt";
import { isLang, isPathSlug, type Lang } from "@/types";

const PER_LESSON_QUOTA = 5;
const MAX_MESSAGE_CHARS = 600;
const MIN_MESSAGE_CHARS = 2;

interface RequestBody {
  lessonId?: unknown;
  pathSlug?: unknown;
  lessonTitle?: unknown;
  contextSummary?: unknown;
  stepIndex?: unknown;
  totalSteps?: unknown;
  message?: unknown;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof body.lessonId !== "string" ||
    typeof body.lessonTitle !== "string" ||
    typeof body.pathSlug !== "string" ||
    !isPathSlug(body.pathSlug) ||
    typeof body.message !== "string" ||
    typeof body.stepIndex !== "number" ||
    typeof body.totalSteps !== "number"
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const message = body.message.trim();
  if (message.length < MIN_MESSAGE_CHARS) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: "message_too_long" }, { status: 413 });
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Quota check — read first, then increment. A double-click race could let
  // a user squeeze in one extra message; acceptable for the volumes we see.
  const progress = await getLessonProgress(supabase, user.id, body.lessonId);
  const usedSoFar = progress?.spark_chat_count ?? 0;
  if (usedSoFar >= PER_LESSON_QUOTA) {
    return NextResponse.json(
      { error: "quota_exceeded", limit: PER_LESSON_QUOTA, used: usedSoFar },
      { status: 403 },
    );
  }

  // Pick the system prompt language from the profile when available, with a
  // fallback to italian (the default profile language).
  const { data: profileRow } = await supabase
    .from("users")
    .select("language")
    .eq("id", user.id)
    .maybeSingle();
  const lang: Lang = isLang(profileRow?.language)
    ? (profileRow!.language as Lang)
    : "it";

  const systemPrompt = (lang === "en" ? sparkSystemPromptEN : sparkSystemPromptIT)({
    lessonTitle: body.lessonTitle,
    stepIndex: Math.max(0, Math.floor(body.stepIndex)),
    totalSteps: Math.max(1, Math.floor(body.totalSteps)),
    contextSummary:
      typeof body.contextSummary === "string"
        ? body.contextSummary
        : undefined,
  });

  const result = await requestCommentary({
    systemPrompt,
    userAnswer: message,
    maxOutputTokens: 220,
    temperature: 0.7,
  });

  if (!result.ok) {
    if (result.error.kind === "missing_api_key") {
      return NextResponse.json(
        { error: "missing_api_key" },
        { status: 503 },
      );
    }
    if (result.error.kind === "network_error") {
      return NextResponse.json(
        { error: "network_error" },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "api_error" }, { status: 502 });
  }

  // Only increment the counter on a successful response — failed calls
  // shouldn't burn the user's budget.
  await incrementSparkChatCount(supabase, {
    userId: user.id,
    lessonId: body.lessonId,
    pathSlug: body.pathSlug,
  });

  const newRemaining = Math.max(0, PER_LESSON_QUOTA - (usedSoFar + 1));

  return NextResponse.json({
    reply: result.comment,
    remaining: newRemaining,
    limit: PER_LESSON_QUOTA,
  });
}

export const dynamic = "force-dynamic";
