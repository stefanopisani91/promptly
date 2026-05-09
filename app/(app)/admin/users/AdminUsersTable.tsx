"use client";

// Minimal admin table — list of users with editable account_type. The
// search filter runs client-side (no API hit per keystroke) since the
// admin only deals with a tiny set of users in the foreseeable future.
// When the row count crosses ~500 we'll swap this for server-side
// search + pagination.

import { useMemo, useState, useTransition } from "react";
import {
  ACCOUNT_TYPES,
  type AccountType,
} from "@/types";
import { updateAccountType } from "./actions";

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  account_type: AccountType;
  created_at: string;
}

interface Props {
  rows: AdminUserRow[];
  // Caller's id — used to disable the dropdown on the caller's own
  // row so they can't accidentally lock themselves out of /admin.
  selfId: string;
}

export function AdminUsersTable({ rows, selfId }: Props) {
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.full_name ?? "").toLowerCase().includes(q),
    );
  }, [query, rows]);

  function handleChange(row: AdminUserRow, next: AccountType) {
    if (row.account_type === next) return;
    setPendingId(row.id);
    setErrorById((prev) => {
      const cp = { ...prev };
      delete cp[row.id];
      return cp;
    });
    startTransition(async () => {
      const res = await updateAccountType(row.id, next);
      setPendingId(null);
      if (!res.ok) {
        setErrorById((prev) => ({
          ...prev,
          [row.id]: res.error ?? "unknown_error",
        }));
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtra per email o nome…"
          className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="font-mono text-xs text-text-muted">
          {filtered.length} / {rows.length}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full divide-y divide-border bg-surface text-sm">
          <thead className="bg-surface-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Email
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Nome
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Tier
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Registrato
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((row) => {
              const isSelf = row.id === selfId;
              const isUpdating = isPending && pendingId === row.id;
              const error = errorById[row.id];
              return (
                <tr key={row.id} className="hover:bg-surface-muted/30">
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">
                    {row.email}
                    {isSelf && (
                      <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary-deep">
                        tu
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {row.full_name ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.account_type}
                      onChange={(e) =>
                        handleChange(row, e.target.value as AccountType)
                      }
                      disabled={isSelf || isUpdating}
                      className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs uppercase tracking-wider text-text-primary focus:border-primary focus:outline-none disabled:opacity-60"
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {isUpdating && (
                      <span className="ml-2 text-[11px] italic text-text-muted">
                        salvo…
                      </span>
                    )}
                    {error && (
                      <span className="ml-2 text-[11px] text-error">
                        {error}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-text-muted">
                    {formatDate(row.created_at)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-sm italic text-text-muted"
                >
                  Nessun utente corrisponde al filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}
