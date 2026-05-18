import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import type { Lang } from "@/types";
import type { LandingCopy } from "@/lib/i18n/landing";
import { LangSwitcher } from "@/components/i18n/LangSwitcher";
import { PromptlyWordmark } from "@/components/promptly/PromptlyWordmark";
import { IubendaLegalLinks } from "@/components/legal/IubendaLegalLinks";

interface Props {
  lang: Lang;
  copy: LandingCopy["footer"];
}

// Lucide-react 1.12 (the version pinned in this project) removed the
// branded social icons. We render minimal inline SVG glyphs instead —
// stroke-only, currentColor, ~16px target.
type SvgProps = SVGProps<SVGSVGElement>;

const InstagramGlyph: ComponentType<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);

const TikTokGlyph: ComponentType<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 4c0 2.8 2.2 5 5 5" />
  </svg>
);

const YouTubeGlyph: ComponentType<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2.5" y="6" width="19" height="12" rx="3" />
    <path d="M10.5 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookGlyph: ComponentType<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 22v-8h2.5l.5-3H14V9a1.5 1.5 0 0 1 1.5-1.5H17V5h-2a4 4 0 0 0-4 4v2H8.5v3H11v8" />
  </svg>
);

const SOCIAL_ICON = {
  instagram: InstagramGlyph,
  tiktok: TikTokGlyph,
  youtube: YouTubeGlyph,
  facebook: FacebookGlyph,
} as const;

/**
 * Marketing footer (rev. May 2026):
 * - Wordmark tipografico al posto del logo SVG
 * - Background ereditato dal canvas globale (cream warm) — niente più
 *   bg-surface-muted grigino che spezzava il flusso
 * - Separazione dal contenuto: solo hairline border-top (rispiro pulito)
 */
export function MarketingFooter({ lang, copy }: Props) {
  // La legal column è renderizzata da `IubendaLegalLinks` con link
  // overlay iubenda (Privacy / Cookie / T&C) + i due link gestiti dal
  // banner cookie (preferenze + Notice at Collection). La voce
  // `copy.columns.legal` resta nelle stringhe i18n ma non viene più
  // usata qui — può essere rimossa dal type quando si farà pulizia.
  const cols = [copy.columns.product, copy.columns.resources];

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <Link href={`/${lang}`} aria-label="Promptly">
              <PromptlyWordmark size="xl" />
            </Link>
            <p className="text-sm text-text-muted">{copy.builtWith}</p>
          </div>
          <LangSwitcher fallback={lang} />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((col) => (
            <div key={col.heading}>
              <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
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
          <IubendaLegalLinks lang={lang} />
        </div>

        {/* Social row — handles archiviati in public/brand/social-handles.md */}
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-text-muted">{copy.rights}</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              {copy.socialHeading}
            </span>
            <ul className="flex items-center gap-2">
              {copy.socialLinks.map((social) => {
                const Icon = SOCIAL_ICON[social.platform];
                return (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
