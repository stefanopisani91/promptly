import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { LangSwitcher } from "@/components/i18n/LangSwitcher";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { PromptlyWordmark } from "@/components/promptly/PromptlyWordmark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const lang = resolveLangFromRequest();
  const copy = getAuthCopy(lang);

  return (
    // PostHogProvider montato anche sul flusso auth — gated sul consenso
    // iubenda (vedi components/analytics/PostHogProvider.tsx).
    <Suspense fallback={null}>
      <PostHogProvider>
        <div className="flex min-h-svh flex-col bg-background">
          <header className="flex h-16 items-center justify-between px-4 sm:px-6">
            <Link
              href={`/${lang}`}
              aria-label={copy.shell.backHomeLabel}
              className="inline-flex items-center"
            >
              <PromptlyWordmark size="xl" />
            </Link>
            <LangSwitcher fallback={lang} ariaLabel={copy.shell.langToggleLabel} />
          </header>
          {children}
        </div>
      </PostHogProvider>
    </Suspense>
  );
}
