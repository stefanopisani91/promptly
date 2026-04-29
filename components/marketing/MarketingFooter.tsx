import Image from "next/image";
import Link from "next/link";
import type { Lang } from "@/types";
import type { LandingCopy } from "@/lib/i18n/landing";
import { LangSwitcher } from "./LangSwitcher";

interface Props {
  lang: Lang;
  copy: LandingCopy["footer"];
}

export function MarketingFooter({ lang, copy }: Props) {
  const cols = [copy.columns.product, copy.columns.resources, copy.columns.legal];

  return (
    <footer className="mt-16 border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <Link href={`/${lang}`} aria-label="Promptly">
              <Image
                src="/brand/logo-horizontal.svg"
                alt="Promptly"
                width={140}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-text-muted">{copy.builtWith}</p>
          </div>
          <LangSwitcher current={lang} />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {col.heading}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-text-muted">{copy.rights}</p>
        </div>
      </div>
    </footer>
  );
}
