import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLang, type Lang } from "@/types";
import { getPlaceholderCopy } from "@/lib/i18n/placeholders";
import { PlaceholderShell } from "@/components/marketing/PlaceholderShell";

type Params = { lang: string };

export function generateStaticParams(): Params[] {
  return [{ lang: "it" }, { lang: "en" }];
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  if (!isLang(params.lang)) return {};
  const copy = getPlaceholderCopy(params.lang).signup;
  return {
    title: copy.title.replace(/[.!?]+$/, ""),
    description: copy.body,
    robots: { index: false, follow: true },
  };
}

export default function SignupPage({ params }: { params: Params }) {
  if (!isLang(params.lang)) notFound();
  const lang: Lang = params.lang;
  const placeholders = getPlaceholderCopy(lang);
  const copy = placeholders.signup;
  return (
    <PlaceholderShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      primaryCta={{
        label: copy.primaryCtaLabel,
        href: `/${lang}${copy.primaryCtaAnchor}`,
      }}
      secondaryCta={{
        label: placeholders.backToLandingLabel,
        href: `/${lang}`,
      }}
    />
  );
}
