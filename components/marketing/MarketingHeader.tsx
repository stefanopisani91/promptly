"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Lang } from "@/types";
import type { LandingCopy } from "@/lib/i18n/landing";
import { cn } from "@/lib/utils";
import { LangSwitcher } from "@/components/i18n/LangSwitcher";
import { PromptlyWordmark } from "@/components/promptly/PromptlyWordmark";

interface Props {
  lang: Lang;
  copy: LandingCopy["header"];
}

/**
 * Marketing header (rev. May 2026):
 * - Wordmark tipografico (PromptlyWordmark) al posto del logo SVG
 * - Background bianco puro (bg-surface) costante, niente più liquid glass.
 *   La superficie bianca "galleggia" sul canvas cream come una shelf chiara
 *   ed è coerente con le card bianche delle Tool / lessons.
 * - Su scroll: appare solo una shadow-sm sotto per dare elevation feedback.
 *   Lo height shrinka di 8px (64 → 56) come unico altro segnale di scroll.
 * - Border-bottom permanente: la separazione dal canvas è sempre marcata,
 *   anche quando l'utente è a inizio pagina.
 */
export function MarketingHeader({ lang, copy }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-surface transition-shadow duration-200",
        scrolled ? "shadow-sm" : "",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-200 sm:px-6",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <Link
          href={`/${lang}`}
          aria-label="Promptly"
          className="inline-flex items-center"
        >
          <PromptlyWordmark size="xl" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-3 md:flex">
          <LangSwitcher fallback={lang} />
          <Link
            href={`/auth?source=header_login&lang=${lang}`}
            className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            {copy.login}
          </Link>
          <Link
            href={`/auth?source=header&lang=${lang}`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            {copy.cta}
          </Link>
        </nav>

        {/* Mobile trigger */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-primary md:hidden"
          aria-label={open ? copy.closeMenu : copy.openMenu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="animate-header-panel border-t border-border bg-surface md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
            <Link
              href={`/auth?source=header_login&lang=${lang}`}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-base font-medium text-text-primary"
            >
              {copy.login}
            </Link>
            <Link
              href={`/auth?source=header&lang=${lang}`}
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-4 py-3 text-center text-base font-semibold text-white"
            >
              {copy.cta}
            </Link>
            <div className="pt-2">
              <LangSwitcher fallback={lang} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
