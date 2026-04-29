"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import type { Lang } from "@/types";
import type { AuthCopy } from "@/lib/i18n/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// RFC-5321 caps the local part at 64 chars + the whole address at 254.
// We use a permissive pattern + a hard length cap; final validity is
// decided by Supabase / the SMTP server.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

const AUTH_EMAIL_COOKIE = "auth_email";

type Variant = "default" | "expired";

interface Props {
  lang: Lang;
  copy: AuthCopy["auth"] | AuthCopy["expired"];
  variant?: Variant;
  initialEmail?: string;
  /** UTM source from `/auth?source=...` */
  source?: string | null;
  /** Whether the user just finished the landing demo. */
  completedDemo?: boolean;
  /** Whether to render the Google button + divider. */
  showGoogle?: boolean;
  /** Headline / fineprint sit outside the form, controlled by parent. */
}

function isAuthCopy(c: AuthCopy["auth"] | AuthCopy["expired"]): c is AuthCopy["auth"] {
  return "googleCta" in c;
}

export function AuthForm({
  lang,
  copy,
  variant = "default",
  initialEmail = "",
  source,
  completedDemo,
  showGoogle = true,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(initialEmail.length > 0);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const looksValid = email.length > 0 && email.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(email);
  const showInvalidHint = touched && email.length > 0 && !looksValid;

  function buildRedirectUrl(): string {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL ?? "");

    const url = new URL("/auth/callback", origin);
    if (source) url.searchParams.set("source", source);
    if (completedDemo) url.searchParams.set("completed_demo", "true");
    url.searchParams.set("lang", lang);
    return url.toString();
  }

  function rememberEmailCookie(value: string) {
    // 30 minutes — long enough to follow a magic link in the same browser.
    document.cookie = `${AUTH_EMAIL_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=1800; samesite=lax${
      typeof window !== "undefined" && window.location.protocol === "https:" ? "; secure" : ""
    }`;
  }

  async function onEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!looksValid || submitting) return;

    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildRedirectUrl(),
      },
    });

    if (err) {
      const status = (err as { status?: number }).status;
      const message =
        status === 429
          ? copy.errors.rateLimit
          : /invalid/i.test(err.message)
            ? copy.errors.invalid
            : copy.errors.generic;
      setError(message);
      setSubmitting(false);
      return;
    }

    rememberEmailCookie(email);

    const params = new URLSearchParams({ email, lang });
    router.push(`/auth/check-email?${params.toString()}`);
  }

  async function onGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildRedirectUrl(),
      },
    });

    if (err) {
      setError(copy.errors.generic);
      setGoogleLoading(false);
    }
    // On success the browser navigates to Google, no further client work.
  }

  const submitDisabled = !looksValid || submitting;

  return (
    <div className="flex flex-col gap-5">
      {showGoogle && isAuthCopy(copy) && (
        <>
          <button
            type="button"
            onClick={onGoogle}
            disabled={googleLoading || submitting}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted",
              (googleLoading || submitting) && "opacity-60",
            )}
          >
            <GoogleGlyph />
            {googleLoading ? copy.googleLoading : copy.googleCta}
          </button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-text-muted">
            <span className="h-px flex-1 bg-border" />
            <span>{copy.divider}</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={onEmailSubmit} noValidate className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          {copy.emailLabel}
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            maxLength={MAX_EMAIL_LENGTH}
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value.trim());
              if (error) setError(null);
            }}
            onBlur={() => setTouched(true)}
            aria-invalid={showInvalidHint || Boolean(error)}
            className={cn(
              "rounded-lg border bg-surface px-3.5 py-2.5 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary",
              showInvalidHint || error ? "border-error" : "border-border",
            )}
          />
        </label>

        <button
          type="submit"
          disabled={submitDisabled}
          className={cn(
            "rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover",
            submitDisabled && "cursor-not-allowed opacity-60",
          )}
        >
          {submitting ? copy.submitLoading : copy.submitCta}
        </button>

        {(error || showInvalidHint) && (
          <p role="alert" className="text-sm text-error">
            {error ?? copy.errors.invalid}
          </p>
        )}
      </form>

      {variant === "default" && isAuthCopy(copy) && (
        <p className="text-sm text-text-secondary">{copy.reassurance}</p>
      )}

      {variant === "expired" && !isAuthCopy(copy) && (
        <button
          type="button"
          onClick={onGoogle}
          disabled={googleLoading || submitting}
          className="self-start text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          {copy.googleAlternative}
        </button>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.614z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.581C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
