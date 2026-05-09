// /admin/users — minimal user-tier admin panel.
//
// The (app) layout already gates auth + onboarding, so this page only
// has to add the dev-tier check. Non-dev users get redirected to the
// dashboard so the URL doesn't leak the existence of the panel.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAccountType, type AccountType } from "@/types";
import { AdminUsersTable, type AdminUserRow } from "./AdminUsersTable";
import {
  PendingInvites,
  type PendingInviteRow,
} from "./PendingInvites";
import {
  UsageLogsPanel,
  type UsageLogRow,
} from "./UsageLogsPanel";

export const metadata = {
  title: "Admin — Utenti | Promptly",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const me = userData?.user;
  if (!me) {
    // Belt-and-braces: the (app) layout would already redirect, but
    // we double-check so the dev-tier query below has a guaranteed id.
    redirect("/auth");
  }

  const { data: meRow } = await supabase
    .from("users")
    .select("account_type")
    .eq("id", me.id)
    .maybeSingle();
  if (!meRow || meRow.account_type !== "dev") {
    redirect("/dashboard");
  }

  const { data: rawRows, error } = await supabase
    .from("users")
    .select("id, email, full_name, account_type, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-4 text-2xl font-semibold text-text-primary">
          Admin — Utenti
        </h1>
        <p className="rounded-md border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          Errore nel caricare gli utenti: {error.message}
        </p>
      </div>
    );
  }

  const rows: AdminUserRow[] = (rawRows ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    full_name: r.full_name,
    account_type: isAccountType(r.account_type)
      ? (r.account_type as AccountType)
      : "standard",
    created_at: r.created_at,
  }));

  // Pending invites — pre-assigned tiers waiting for signup. RLS
  // confines this read to dev callers (we already redirected non-dev
  // above, so we know `me` is dev here).
  const { data: rawPending } = await supabase
    .from("pending_account_tiers")
    .select("email, account_type, note, created_at")
    .order("created_at", { ascending: false });

  const pendingRows: PendingInviteRow[] = (rawPending ?? []).map((r) => ({
    email: r.email,
    account_type: isAccountType(r.account_type)
      ? (r.account_type as AccountType)
      : "standard",
    note: r.note,
    created_at: r.created_at,
  }));

  // Recent rate-limit hits. Strategic intent: surface enough to
  // calibrate caps without paginating. We pull the last 30 raw events
  // PLUS a separate count of "last 7 days" so the panel can show a
  // headline metric that doesn't depend on the truncated row set.
  const { data: rawLogs } = await supabase
    .from("usage_logs")
    .select(
      "id, user_id, account_type, event_type, endpoint, lesson_id, attempt_number, limit_value, occurred_at",
    )
    .order("occurred_at", { ascending: false })
    .limit(30);

  // Resolve emails for the (small) list of user_ids on the page.
  const userIds = Array.from(
    new Set((rawLogs ?? []).map((r) => r.user_id)),
  );
  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: emailRows } = await supabase
      .from("users")
      .select("id, email")
      .in("id", userIds);
    for (const e of emailRows ?? []) {
      emailById.set(e.id, e.email);
    }
  }

  const usageRows: UsageLogRow[] = (rawLogs ?? []).map((r) => ({
    id: r.id,
    user_email: emailById.get(r.user_id) ?? null,
    account_type: isAccountType(r.account_type)
      ? (r.account_type as AccountType)
      : "standard",
    event_type: r.event_type,
    endpoint: r.endpoint,
    lesson_id: r.lesson_id,
    attempt_number: r.attempt_number,
    limit_value: r.limit_value,
    occurred_at: r.occurred_at,
  }));

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString();
  const { count: totalLast7Days } = await supabase
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .gte("occurred_at", sevenDaysAgo);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          admin
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">
          Utenti & rate-limit tier
        </h1>
        <p className="text-sm text-text-secondary">
          Cambia il tier per dare a un utente più (o meno) budget AI al
          giorno. Le modifiche hanno effetto immediato sulla prossima
          chiamata API.
        </p>
      </header>

      <PendingInvites rows={pendingRows} />

      <AdminUsersTable rows={rows} selfId={me.id} />

      <UsageLogsPanel
        rows={usageRows}
        totalLast7Days={totalLast7Days ?? 0}
      />

      <details className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        <summary className="cursor-pointer font-semibold text-text-primary">
          Limiti per tier (riferimento)
        </summary>
        <div className="mt-3 overflow-hidden rounded-md border border-border">
          <table className="min-w-full text-xs">
            <thead className="bg-surface-muted/40 font-mono uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Tier</th>
                <th className="px-3 py-2 text-left">Eval/giorno × route</th>
                <th className="px-3 py-2 text-left">Chat/giorno</th>
                <th className="px-3 py-2 text-left">Chat/lezione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              <tr>
                <td className="px-3 py-2 font-mono">standard</td>
                <td className="px-3 py-2">10</td>
                <td className="px-3 py-2">30</td>
                <td className="px-3 py-2">5</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">beta</td>
                <td className="px-3 py-2">100</td>
                <td className="px-3 py-2">300</td>
                <td className="px-3 py-2">50</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">press</td>
                <td className="px-3 py-2">50</td>
                <td className="px-3 py-2">150</td>
                <td className="px-3 py-2">25</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">qa</td>
                <td className="px-3 py-2">∞</td>
                <td className="px-3 py-2">∞</td>
                <td className="px-3 py-2">∞</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">dev</td>
                <td className="px-3 py-2">∞</td>
                <td className="px-3 py-2">∞</td>
                <td className="px-3 py-2">∞</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
