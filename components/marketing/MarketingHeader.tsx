"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Lang } from "@/types";
import type { LandingCopy } from "@/lib/i18n/landing";
import { cn } from "@/lib/utils";
import { LangSwitcher } from "./LangSwitcher";

interface Props {
  lang: Lang;
  copy: LandingCopy["header"];
}

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
        "sticky top-0 z-40 w-full border-b transition-all duration-200",
        scrolled
          ? "border-border bg-surface/80 backdrop-blur-md"
          : "border-transparent bg-surface",
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-3 md:flex">
          <LangSwitcher current={lang} />
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            {copy.login}
          </Link>
          <Link
            href="/signup?source=header"
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
        <div className="border-t border-border bg-surface md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-base font-medium text-text-primary"
            >
              {copy.login}
            </Link>
            <Link
              href="/signup?source=header"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-4 py-3 text-center text-base font-semibold text-white"
            >
              {copy.cta}
            </Link>
            <div className="pt-2">
              <LangSwitcher current={lang} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
