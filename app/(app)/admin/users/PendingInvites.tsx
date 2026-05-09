"use client";

// Pending invites — pre-assign a tier to an email before signup.
// Top form to add a new entry, table below listing existing pending
// rows with a "rimuovi" button. Errors surface inline near the form
// so the dev can fix and resubmit without losing context.

import { useState, useTransition } from "react";
import {
  ACCOUNT_TYPES,
  type AccountType,
} from "@/types";
import { addPendingTier, removePendingTier } from "./actions";

export interface PendingInviteRow {
  email: string;
  account_type: AccountType;
  note: string | null;
  created_at: string;
}

const ERROR_LABELS: Record<string, string> = {
  invalid_input: "Email o tier non validi.",
  duplicate_email:
    "Questa email è già nella lista oppure ha già un account. Cancella la riga in attesa, oppure modifica l'utente direttamente dalla tabella sopra.",
  forbidden: "Solo i dev possono modificare gli inviti.",
  unauthorized: "Sessione scaduta — ricarica la pagina.",
  db_error: "Errore del database. Riprova tra poco.",
};

interface Props {
  rows: PendingInviteRow[];
}

export function PendingInvites({ rows }: Props) {
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<AccountType>("beta");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [removeErrorByEmail, setRemoveErrorByEmail] = useState<
    Record<string, string>
  >({});
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0) {
      setFormError("invalid_input");
      return;
    }
    startTransition(async () => {
      const res = await addPendingTier(
        trimmedEmail,
        tier,
        note.trim().length > 0 ? note.trim() : null,
      );
      if (res.ok) {
        setEmail("");
        setNote("");
        // Tier stays so a dev adding "10 beta in a row" doesn't have
        // to keep re-picking the dropdown.
      } else {
        setFormError(res.error ?? "db_error");
      }
    });
  }

  function handleRemove(targetEmail: string) {
    setRemoveErrorByEmail((prev) => {
      const cp = { ...prev };
      delete cp[targetEmail];
      return cp;
    });
    setRemovingEmail(targetEmail);
    startTransition(async () => {
      const res = await removePendingTier(targetEmail);
      setRemovingEmail(null);
      if (!res.ok) {
        setRemoveErrorByEmail((prev) => ({
          ...prev,
          [targetEmail]: res.error ?? "db_error",
        }));
      }
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          inviti in attesa
        </p>
        <h2 className="text-lg font-semibold text-text-primary">
          Pre-assegna un tier a un'email
        </h2>
        <p className="text-sm text-text-secondary">
          Aggiungi un'email QUI prima che la persona si iscriva. Quando
          farà signup, otterrà subito il tier che hai scelto. La riga si
          cancella da sola al momento dell'iscrizione.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted/20 p-3 sm:p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_2fr]">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="andrea@giornale.it"
              required
              disabled={isPending}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Tier
            </span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as AccountType)}
              disabled={isPending}
              className="rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs uppercase tracking-wider focus:border-primary focus:outline-none disabled:opacity-60"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Nota (opzionale)
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder='Es. "press @ Wired"'
              disabled={isPending}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs italic text-text-muted">
            L'email viene normalizzata (minuscolo, senza spazi).
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
          >
            {isPending && removingEmail === null ? "Aggiungo…" : "Aggiungi"}
          </button>
        </div>
        {formError && (
          <p
            role="status"
            className="rounded-md border border-error/30 bg-error/5 px-3 py-2 text-xs text-error"
          >
            {ERROR_LABELS[formError] ?? formError}
          </p>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border bg-surface text-sm">
          <thead className="bg-surface-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Email
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Tier
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Nota
              </th>
              <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Aggiunto
              </th>
              <th className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Azione
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-sm italic text-text-muted"
                >
                  Nessun invito in attesa.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const removeError = removeErrorByEmail[row.email];
              const isRemovingThis =
                isPending && removingEmail === row.email;
              return (
                <tr key={row.email} className="hover:bg-surface-muted/30">
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">
                    {row.email}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-primary-deep">
                      {row.account_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {row.note ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-text-muted">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(row.email)}
                      disabled={isRemovingThis}
                      className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-error/5 hover:text-error disabled:opacity-50"
                    >
                      {isRemovingThis ? "Rimuovo…" : "Rimuovi"}
                    </button>
                    {removeError && (
                      <p className="mt-1 text-[11px] text-error">
                        {ERROR_LABELS[removeError] ?? removeError}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}
