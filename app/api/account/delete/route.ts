// POST /api/account/delete — hard delete dell'account utente (GDPR
// art. 17). Esegue:
//   1. verifica auth: chi chiama deve essere loggato e cancella SOLO
//      il proprio account (userId dalla session, NON da body)
//   2. typed-email confirmation: il body deve contenere `confirmEmail`
//      che matcha (case-insensitive, trimmed) l'email della session
//   3. rate-limit IP: max 5 chiamate/ora sullo stesso IP (anti-abuso)
//   4. log in `account_deletions_log` PRIMA della cancellazione vera
//   5. `auth.admin.deleteUser(userId)` via service role → CASCADE su
//      tutte le tabelle public.* che hanno FK su public.users(id)
//
// Tutto il resto (user_progress, spark_usage_daily, spark_safety_log,
// user_referrals, usage_logs) sparisce per ON DELETE CASCADE — vedi
// migrations 20260429160000 e successive.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAccountDeletion } from "@/lib/supabase/queries";
import {
  checkIpRateLimit,
  getClientIp,
} from "@/lib/rate-limits/ip-rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_ENDPOINT = "account-delete";

export async function POST(req: NextRequest) {
  // 1. Auth: chi è loggato?
  const supabase = createClient();
  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData?.user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }
  const user = userData.user;
  const userEmail = user.email ?? "";

  // 2. Rate-limit per IP (dopo l'auth: chi non è loggato non spende
  // budget di rate-limit, ma può comunque essere bloccato a livello
  // application server da middleware future).
  const ip = getClientIp(req);
  const limit = checkIpRateLimit({
    ip,
    endpointKey: RATE_LIMIT_ENDPOINT,
    max: RATE_LIMIT_MAX,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  // 3. Typed-email confirmation (difesa-in-profondità contro click
  // accidentali — la stessa logica esiste lato client nel modal).
  let body: { confirmEmail?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request" },
      { status: 400 },
    );
  }
  const confirm = typeof body?.confirmEmail === "string"
    ? body.confirmEmail.trim().toLowerCase()
    : "";
  if (!confirm || confirm !== userEmail.trim().toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "email_mismatch" },
      { status: 400 },
    );
  }

  // 4. Log di compliance PRIMA della cancellazione. Se fallisce,
  // aborto: meglio nessuna cancellazione che una senza traccia.
  const serviceClient = createServiceClient();
  try {
    await logAccountDeletion(serviceClient, { email: userEmail, ip });
  } catch (err) {
    console.error("[account/delete] failed to log deletion:", err);
    return NextResponse.json(
      { ok: false, error: "log_failed" },
      { status: 500 },
    );
  }

  // 5. Hard delete via Supabase Auth admin → CASCADE su public.users
  // e a cascata su tutte le altre tabelle user-bound.
  const { error: delErr } = await serviceClient.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error("[account/delete] auth.admin.deleteUser failed:", delErr);
    return NextResponse.json(
      { ok: false, error: "delete_failed" },
      { status: 500 },
    );
  }

  // 6. Logout lato server: pulisce i cookie della session.
  // Non blocchiamo la risposta se fallisce — l'utente è già cancellato,
  // i cookie diventano comunque inutili al prossimo refresh.
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("[account/delete] signOut post-delete failed:", err);
  }

  return NextResponse.json({ ok: true });
}
