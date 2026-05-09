"use client";

// Recent rate-limit hits — read-only view of usage_logs. Strategic
// view only: top counters at the top, raw event table below. The
// panel doesn't paginate yet; if it ever fills the page, swap the
// table for a virtualised list and add a date filter.

import { useMemo, useState } from "react";
import type { AccountType } from "@/types";

export interface UsageLogRow {
  id: number;
  user_email: string | null;
  account_type: AccountType;
  event_type: string;
  endpoint: string;
  lesson_id: string | null;
  attempt_number: number | null;
  limit_value: number | null;
  occurred_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  daily_quota: "Cap giornaliero (eval)",
  daily_chat_quota: "Cap giornaliero (chat)",
  per_lesson_quota: "Cap chat per lezione",
  lesson_attempts: "3 tentativi finiti",
};

interface Props {
  rows: UsageLogRow[];
  totalLast7Days: number;
}

export function UsageLogsPanel({ rows, totalLast7Days }: Props) {
  const [tierFilter, setTierFilter] = useState<"all" | AccountType>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  // Aggregations across the (already truncated to last 30) row set.
  // For longer windows the page would need server-side aggregation.
  const eventTypes = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.event_type);
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tierFilter !== "all" && r.account_type !== tierFilter) return false;
      if (eventFilter !== "all" && r.event_type !== eventFilter) return false;
      return true;
    });
  }, [rows, tierFilter, eventFilter]);

  const byTier = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) m[r.account_type] = (m[r.account_type] ?? 0) + 1;
    return m;
  }, [rows]);

  const byEndpoint = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) m[r.endpoint] = (m[r.endpoint] ?? 0) + 1;
    const arr = Object.entries(m).sort((a, b) => b[1] - a[1]);
    return arr.slice(0, 3);
  }, [rows]);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          telemetria limiti
        </p>
        <h2 className="text-lg font-semibold text-text-primary">
          Recenti blocchi limite
        </h2>
        <p className="text-sm text-text-secondary">
          Ogni volta che un utente raggiunge un cap (quota giornaliera,
          tentativi lezione, chat) viene registrato qui. Usalo per
          calibrare i numeri: se gli standard sbattono spesso contro 10
          eval/giorno, è un segnale.
        </p>
      </header>

      {/* Top stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Eventi ultimi 7 gg"
          value={totalLast7Days.toLocaleString()}
          hint="Tutti i tier inclusi"
        />
        <StatCard
          label="Mostrati"
          value={String(rows.length)}
          hint="Ultimi 30 (più recenti in alto)"
        />
        <StatCard
          label="Top route"
          value={byEndpoint[0]?.[0] ?? "—"}
          hint={
            byEndpoint[0]
              ? `${byEndpoint[0][1]} eventi`
              : "Niente eventi"
          }
        />
      </div>

      {byEndpoint.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
          <span className="font-mono uppercase tracking-wider text-text-muted">
            top 3 route:
          </span>
          {byEndpoint.map(([endpoint, count]) => (
            <span
              key={endpoint}
              className="rounded bg-surface-muted/60 px-2 py-0.5 font-mono"
            >
              {endpoint}{" "}
              <span className="text-text-muted">({count})</span>
            </span>
          ))}
        </div>
      )}

      {Object.keys(byTier).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
          <span className="font-mono uppercase tracking-wider text-text-muted">
            per tier:
          </span>
          {Object.entries(byTier).map(([tier, count]) => (
            <span
              key={tier}
              className="rounded bg-surface-muted/60 px-2 py-0.5 font-mono"
            >
              {tier} <span className="text-text-muted">({count})</span>
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-muted/20 px-3 py-2">
        <label className="flex items-center gap-2 text-xs">
          <span className="font-mono uppercase tracking-wider text-text-muted">
            tier
          </span>
          <select
            value={tierFilter}
            onChange={(e) =>
              setTierFilter(e.target.value as "all" | AccountType)
            }
            className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs uppercase tracking-wider focus:border-primary focus:outline-none"
          >
            <option value="all">tutti</option>
            <option value="standard">standard</option>
            <option value="beta">beta</option>
            <option value="press">press</option>
            <option value="qa">qa</option>
            <option value="dev">dev</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <span className="font-mono uppercase tracking-wider text-text-muted">
            evento
          </span>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs focus:border-primary focus:outline-none"
          >
            <option value="all">tutti</option>
            {eventTypes.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <p className="ml-auto font-mono text-xs text-text-muted">
          {filtered.length} / {rows.length}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border bg-surface text-sm">
          <thead className="bg-surface-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Quando
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Email
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Tier
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Evento
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Route
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Lezione
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Cap
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-sm italic text-text-muted"
                >
                  Nessun evento corrisponde al filtro.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-surface-muted/30">
                <td className="px-3 py-2 font-mono text-[11px] text-text-muted">
                  {formatDateTime(r.occurred_at)}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-text-primary">
                  {r.user_email ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary-deep">
                    {r.account_type}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-text-secondary">
                  <span title={r.event_type}>
                    {EVENT_LABELS[r.event_type] ?? r.event_type}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                  {r.endpoint}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                  {r.lesson_id ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-text-muted">
                  {r.attempt_number ?? "—"} / {r.limit_value ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-surface-muted/20 px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="text-xl font-semibold text-text-primary">{value}</p>
      {hint && <p className="text-[11px] italic text-text-muted">{hint}</p>}
    </div>
  );
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      d.toISOString().slice(0, 10) + " " + d.toISOString().slice(11, 16)
    );
  } catch {
    return iso;
  }
}
