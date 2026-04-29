import type { Metadata } from "next";
import { cookies } from "next/headers";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

type SearchParams = {
  email?: string | string[];
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
    title: copy.meta.titleExpired,
    description: copy.meta.description,
    robots: { index: false, follow: false },
  };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ExpiredPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const lang = resolveLangFromRequest(searchParams.lang);
  const copy = getAuthCopy(lang);

  const cookieEmail = cookies().get("auth_email")?.value;
  const initialEmail =
    firstParam(searchParams.email) ??
    (cookieEmail ? decodeURIComponent(cookieEmail) : "");

  const source = firstParam(searchParams.source) ?? null;
  const completedDemo = firstParam(searchParams.completed_demo) === "true";

  return (
    <AuthCard>
      <h1 className="mb-3 text-center font-heading text-2xl font-bold text-text-primary text-balance">
        {copy.expired.title}
      </h1>
      <p className="mb-7 text-center text-base text-text-secondary text-balance">
        {copy.expired.sub}
      </p>

      <AuthForm
        lang={lang}
        copy={copy.expired}
        variant="expired"
        initialEmail={initialEmail}
        source={source}
        completedDemo={completedDemo}
        showGoogle={false}
      />
    </AuthCard>
  );
}
