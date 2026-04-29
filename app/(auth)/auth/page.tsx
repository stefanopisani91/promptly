import type { Metadata } from "next";
import Link from "next/link";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

type SearchParams = {
  source?: string | string[];
  completed_demo?: string | string[];
  lang?: string | string[];
};

export function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Metadata {
  const lang = resolveLangFromRequest(searchParams.lang);
  const copy = getAuthCopy(lang);
  return {
    title: copy.meta.titleAuth,
    description: copy.meta.description,
    robots: { index: false, follow: true },
  };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function AuthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const lang = resolveLangFromRequest(searchParams.lang);
  const copy = getAuthCopy(lang);

  const source = firstParam(searchParams.source) ?? null;
  const completedDemo = firstParam(searchParams.completed_demo) === "true";

  return (
    <AuthCard>
      <h1 className="mb-7 text-center font-heading text-2xl font-bold leading-snug text-text-primary text-balance">
        {copy.auth.headline}
      </h1>

      <AuthForm
        lang={lang}
        copy={copy.auth}
        source={source}
        completedDemo={completedDemo}
      />

      <hr className="my-6 border-border" />

      <p className="text-center text-xs text-text-muted">
        {copy.auth.fineprint.lead}
        <Link href={`/${lang}/terms`} className="underline-offset-2 hover:underline">
          {copy.auth.fineprint.terms}
        </Link>
        {copy.auth.fineprint.and}
        <Link href={`/${lang}/privacy`} className="underline-offset-2 hover:underline">
          {copy.auth.fineprint.privacy}
        </Link>
        .
      </p>
    </AuthCard>
  );
}
