// Free-form chat with Spark, scoped to a lesson. Authenticated route — uses
// the per-lesson `spark_chat_count` counter to enforce a 5-message quota
// per (user, lesson) regardless of session. Once a user runs out we 403
// with a structured error so the client can show the right message.
//
// Backed by Anthropic Claude Haiku 4.5 via lib/ai/anthropic.ts (NOT OpenAI —
// see Promptly_Spark_Master_Configuration.md §6, "Sessione 1"). The persona
// block is sent with prompt-cache headers; the per-call session context is
// not cached.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLessonProgress,
  incrementSparkChatCount,
} from "@/lib/supabase/queries";
import { requestSparkReply } from "@/lib/ai/anthropic";
import {
  SPARK_PERSONA_EN,
  SPARK_PERSONA_IT,
  sparkSessionContextEN,
  sparkSessionContextIT,
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

  const persona = lang === "en" ? SPARK_PERSONA_EN : SPARK_PERSONA_IT;
  const sessionContext = (
    lang === "en" ? sparkSessionContextEN : sparkSessionContextIT
  )({
    lessonTitle: body.lessonTitle,
    stepIndex: Math.max(0, Math.floor(body.stepIndex)),
    totalSteps: Math.max(1, Math.floor(body.totalSteps)),
    contextSummary:
      typeof body.contextSummary === "string"
        ? body.contextSummary
        : undefined,
  });

  const result = await requestSparkReply({
    persona,
    sessionContext,
    userMessage: message,
    // Hard budget on response length — Spark's persona prescribes max 4
    // sentences (~80–110 tokens). 220 leaves room without inviting the
    // model to drift into multi-paragraph essays. See coherence-test
    // length compliance metric in scripts/spark-coherence-test.mjs.
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
    reply: result.reply,
    remaining: newRemaining,
    limit: PER_LESSON_QUOTA,
  });
}

export const dynamic = "force-dynamic";
