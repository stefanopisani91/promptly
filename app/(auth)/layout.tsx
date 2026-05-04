import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { LangSwitcher } from "@/components/i18n/LangSwitcher";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const lang = resolveLangFromRequest();
  const copy = getAuthCopy(lang);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link
          href={`/${lang}`}
          aria-label={copy.shell.backHomeLabel}
          className="flex items-center"
        >
          <Image
            src="/brand/logo-horizontal.svg"
            alt="Promptly"
            width={140}
            height={32}
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>
        <LangSwitcher fallback={lang} ariaLabel={copy.shell.langToggleLabel} />
      </header>
      {children}
    </div>
  );
}
