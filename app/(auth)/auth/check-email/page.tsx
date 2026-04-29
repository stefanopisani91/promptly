import type { Metadata } from "next";
import Link from "next/link";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { AuthCard } from "@/components/auth/AuthCard";

type SearchParams = {
  email?: string | string[];
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
    title: copy.meta.titleCheckEmail,
    description: copy.meta.description,
    robots: { index: false, follow: false },
  };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function CheckEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const lang = resolveLangFromRequest(searchParams.lang);
  const copy = getAuthCopy(lang);
  const email = firstParam(searchParams.email) ?? "";

  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-5 text-center">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-3xl"
        >
          📨
        </div>

        <h1 className="font-heading text-2xl font-bold text-text-primary">
          {copy.checkEmail.title}
        </h1>

        <p className="text-base text-text-secondary text-balance">
          {email ? (
            <>
              {lang === "it" ? "Abbiamo mandato un link a " : "We sent a link to "}
              <strong className="text-text-primary">{email}</strong>
              {lang === "it" ? ". Cliccaci sopra per entrare." : ". Click it to log in."}
            </>
          ) : (
            copy.checkEmail.sub("")
          )}
        </p>

        <p className="text-sm text-text-muted">{copy.checkEmail.microcopy}</p>

        <Link
          href={`/auth?lang=${lang}`}
          className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          {copy.checkEmail.changeEmailCta}
        </Link>
      </div>
    </AuthCard>
  );
}
