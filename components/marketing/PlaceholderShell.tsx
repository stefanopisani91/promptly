import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CtaProps {
  label: string;
  href: string;
}

interface Props {
  eyebrow: string;
  title: string;
  body: string;
  /** Optional primary action — branded orange button. */
  primaryCta?: CtaProps;
  /** Optional secondary action — quiet ghost button. */
  secondaryCta?: CtaProps;
}

/**
 * Shared shell for placeholder/coming-soon pages.
 * Renders a centered hero-style layout that matches the landing's voice
 * without using any landing-specific copy or visuals.
 */
export function PlaceholderShell({
  eyebrow,
  title,
  body,
  primaryCta,
  secondaryCta,
}: Props) {
  return (
    <section className="relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 bg-gradient-to-b from-primary-light/40 via-transparent to-transparent"
      />
      <div className="relative mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-24">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-balance text-text-primary sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base text-text-secondary sm:text-lg">{body}</p>

        {(primaryCta || secondaryCta) && (
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="inline-flex items-center rounded-md px-4 py-3 text-base font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
