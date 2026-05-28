// Maintenance page — served while MAINTENANCE_MODE is on in middleware.ts.
// Everything else on the site (pages, API routes) is short-circuited:
//   - pages → 307 redirect here
//   - API   → 503 JSON
// Bring the site back: flip MAINTENANCE_MODE to false in middleware.ts
// (or simply revert the maintenance commit) and redeploy.
//
// Self-contained on purpose: no Supabase, no user lookup, no i18n
// dictionary. Just IT + EN copy hardcoded. The root layout still
// inherits (iubenda + PostHog providers): both fail gracefully when
// they can't load, so an offline iubenda doesn't break this page.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promptly · Manutenzione",
  description: "Promptly è temporaneamente offline. Torniamo presto.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--marketing-bg,#FBF6F0)] px-6 py-12">
      {/* The root layout still ships the iubenda script tag. When the
          policy/cookie account is paused (the very situation that
          triggers maintenance), iubenda's auto-injected badge can
          render an "expired"/error overlay that would land on top of
          this page. Hide every known iubenda chrome selector here so
          the maintenance message stays clean regardless of iubenda's
          state. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #iubenda-cs-banner,
            .iubenda-cs-container,
            .iubenda-cs-preferences-link,
            .iubenda-tp-btn,
            .iub-cs-preferences-link,
            .iub-fp-frame,
            #iubFooterBtn,
            tb-banner-wrapper,
            [class*="iubenda"] { display: none !important; }
          `,
        }}
      />

      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <p className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          Promptly
          <span className="ml-1 inline-block h-2 w-2 translate-y-[-0.45em] rounded-full bg-primary align-middle" />
        </p>

        <h1 className="mt-10 font-heading text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          Stiamo facendo manutenzione.
        </h1>

        <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
          Promptly è momentaneamente offline. Torniamo presto, prima che
          puoi.
        </p>

        <div
          aria-hidden
          className="my-10 h-px w-16 bg-border"
        />

        <h2 className="text-base font-semibold text-text-primary">
          We&apos;re on a quick break.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Promptly is temporarily offline. We&apos;ll be back soon.
        </p>

        <p className="mt-12 text-xs leading-relaxed text-text-muted">
          Hai una domanda urgente? Scrivimi a{" "}
          <a
            href="mailto:stepcloud3@icloud.com"
            className="text-primary underline-offset-2 hover:underline"
          >
            stepcloud3@icloud.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
