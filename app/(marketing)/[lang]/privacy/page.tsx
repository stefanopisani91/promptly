import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLang, type Lang } from "@/types";
import { PrivacyPolicyProvisional } from "@/components/marketing/PrivacyPolicyProvisional";

type Params = { lang: string };

export function generateStaticParams(): Params[] {
  return [{ lang: "it" }, { lang: "en" }];
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  if (!isLang(params.lang)) return {};
  const isIt = params.lang === "it";
  return {
    // The marketing [lang] layout sets a string `title`, which short-circuits
    // the root layout's `template: "%s · Promptly"` for descendant pages.
    // Use `absolute` here so the suffix lands deterministically.
    title: { absolute: "Privacy Policy · Promptly" },
    description: isIt
      ? "Informativa privacy provvisoria per la demo della landing di Promptly."
      : "Provisional privacy notice for the Promptly landing-page demo.",
    // The page is provisional and won't be the canonical source for SEO yet.
    robots: { index: false, follow: true },
  };
}

export default function PrivacyPage({ params }: { params: Params }) {
  if (!isLang(params.lang)) notFound();
  const lang: Lang = params.lang;
  return <PrivacyPolicyProvisional lang={lang} />;
}
