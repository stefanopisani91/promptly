"use client";

// GDPR — Sezione "Privacy & Dati" nella pagina profilo. Due azioni:
//   A) "Gestisci preferenze cookie" → link con classe
//      `iubenda-cs-preferences-link` (lo script iubenda nel root layout
//      la intercetta e apre il pannello consensi).
//   B) "Elimina account" → bottone distruttivo che apre un <dialog>
//      con typed-email confirmation. Sulla conferma chiama
//      POST /api/account/delete, mostra messaggio finale e redirige
//      alla landing della lingua corrente.

import { useEffect, useRef, useState, useTransition } from "react";
import type { Lang } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  lang: Lang;
  userEmail: string;
  copy: {
    heading: string;
    lead: string;
    cookiePreferences: string;
    deleteAccount: string;
    deleteDisclaimer: string;
    modal: {
      title: string;
      bullets: readonly [string, string, string];
      irreversibleNote: string;
      emailConfirmLabel: string;
      cancel: string;
      confirm: string;
      pendingLabel: string;
      successMessage: string;
      errorMessage: string;
      rateLimitMessage: string;
    };
  };
}

export function PrivacyDataPanel({ lang, userEmail, copy }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-border bg-surface px-6 py-6 shadow-sm">
      <header className="mb-4 flex flex-col gap-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
          {copy.heading}
        </h2>
        <p className="text-sm text-text-secondary">{copy.lead}</p>
      </header>

      <div className="flex flex-col gap-5">
        {/* A) Cookie preferences — link riconosciuto da iubenda */}
        <div>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            className="iubenda-cs-preferences-link text-sm font-medium text-text-secondary underline underline-offset-4 transition-colors hover:text-text-primary"
          >
            {copy.cookiePreferences}
          </a>
        </div>

        {/* B) Delete account — destructive button + disclaimer */}
        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex w-fit items-center justify-center rounded-full border border-error/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-error transition-colors hover:border-error hover:bg-error/5"
          >
            {copy.deleteAccount}
          </button>
          <p className="text-xs text-text-muted">{copy.deleteDisclaimer}</p>
        </div>
      </div>

      <DeleteAccountModal
        open={open}
        onClose={() => setOpen(false)}
        lang={lang}
        userEmail={userEmail}
        copy={copy.modal}
      />
    </section>
  );
}

// ─── Modal di conferma con typed-email pattern (GitHub-style). ────────

function DeleteAccountModal({
  open,
  onClose,
  lang,
  userEmail,
  copy,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  userEmail: string;
  copy: Props["copy"]["modal"];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);
  const [pending, startTransition] = useTransition();

  // Sincronizza apertura/chiusura del <dialog> nativo con lo stato React.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      // Reset campo a ogni apertura — se l'utente chiude per sbaglio
      // e riapre, non gli ritroviamo l'email pre-compilata.
      setTyped("");
      setFeedback(null);
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Esc / dismiss nativo del <dialog> → propaga il close a React.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handler = () => onClose();
    dlg.addEventListener("close", handler);
    return () => dlg.removeEventListener("close", handler);
  }, [onClose]);

  const emailMatches =
    typed.trim().toLowerCase() === userEmail.trim().toLowerCase() &&
    typed.length > 0;

  function confirmDelete() {
    if (!emailMatches || pending) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/account/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmEmail: typed.trim() }),
        });
        if (res.status === 429) {
          setFeedback({ kind: "error", message: copy.rateLimitMessage });
          return;
        }
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean }
          | null;
        if (!res.ok || !body?.ok) {
          setFeedback({ kind: "error", message: copy.errorMessage });
          return;
        }
        // Successo — mostra il messaggio finale, poi redirige.
        setFeedback({ kind: "success", message: copy.successMessage });
        // Hard navigation per garantire che ogni cache lato client
        // (incluso il bundle posthog inizializzato) venga scartata.
        setTimeout(() => {
          window.location.href = `/${lang}`;
        }, 2000);
      } catch {
        setFeedback({ kind: "error", message: copy.errorMessage });
      }
    });
  }

  return (
    <dialog
      ref={dialogRef}
      // backdrop styling lo gestisce globals.css (::backdrop) se vuoi
      // un override; per ora il default browser va bene.
      className="rounded-2xl border border-border bg-surface p-0 shadow-lg backdrop:bg-black/40"
    >
      <div className="flex w-[min(90vw,520px)] flex-col gap-5 p-6">
        <h2 className="font-heading text-lg font-bold text-text-primary">
          {copy.title}
        </h2>

        <ul className="flex flex-col gap-2">
          {copy.bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-sm text-text-secondary"
            >
              <span aria-hidden className="mt-1 text-error">
                •
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm font-medium text-text-primary">
          {copy.irreversibleNote}
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">
            {copy.emailConfirmLabel}{" "}
            <span className="text-xs font-normal text-text-muted">
              ({userEmail})
            </span>
          </span>
          <input
            type="email"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={pending || feedback?.kind === "success"}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </label>

        {feedback ? (
          <p
            role="status"
            className={cn(
              "text-sm",
              feedback.kind === "success" && "text-success",
              feedback.kind === "error" && "text-error",
            )}
          >
            {feedback.message}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending || feedback?.kind === "success"}
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={!emailMatches || pending || feedback?.kind === "success"}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors",
              emailMatches && !pending
                ? "bg-error hover:bg-error/90"
                : "cursor-not-allowed bg-error/40",
            )}
          >
            {pending ? copy.pendingLabel : copy.confirm}
          </button>
        </div>
      </div>
    </dialog>
  );
}
