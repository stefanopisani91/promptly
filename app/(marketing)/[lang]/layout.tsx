import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { isLang, type Lang } from "@/types";
import { getLandingCopy } from "@/lib/i18n/landing";
import { SITE_URL } from "@/lib/site";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";

type Params = { lang: string };

export function generateStaticParams(): Params[] {
  return [{ lang: "it" }, { lang: "en" }];
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  if (!isLang(params.lang)) return {};
  const lang: Lang = params.lang;
  const copy = getLandingCopy(lang);
  const otherLang: Lang = lang === "it" ? "en" : "it";

  return {
    title: copy.meta.title,
    description: copy.meta.description,
    keywords:
      lang === "it"
        ? [
            "vibe coding",
            "corso vibe coding",
            "imparare a programmare con AI",
            "prompt engineering corso",
            "costruire app senza codice",
            "AI coding corso",
            "no-code AI",
          ]
        : [
            "vibe coding",
            "vibe coding course",
            "learn AI coding",
            "prompt engineering course",
            "build apps without code",
            "AI coding tutorial",
            "no-code AI",
          ],
    authors: [{ name: "Promptly", url: SITE_URL }],
    creator: "Promptly",
    publisher: "Promptly",
    category: "education",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: "/en",
        it: "/it",
        "x-default": "/it",
      },
    },
    openGraph: {
      title: copy.meta.title,
      description: copy.meta.description,
      url: `/${lang}`,
      siteName: "Promptly",
      locale: lang === "it" ? "it_IT" : "en_US",
      alternateLocale: otherLang === "it" ? "it_IT" : "en_US",
      type: "website",
      images: [
        {
          url: "/brand/og-image.png",
          width: 1200,
          height: 630,
          alt: "Promptly — Learn to build with words, not code",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.meta.title,
      description: copy.meta.description,
    },
  };
}

export default function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  if (!isLang(params.lang)) notFound();
  const lang: Lang = params.lang;
  const copy = getLandingCopy(lang);

  return (
    <Suspense fallback={null}>
      <PostHogProvider>
        <div className="flex min-h-screen flex-col bg-[var(--marketing-bg)]">
          <MarketingHeader lang={lang} copy={copy.header} />
          <main className="flex-1">{children}</main>
          <MarketingFooter lang={lang} copy={copy.footer} />
        </div>
      </PostHogProvider>
    </Suspense>
  );
}
