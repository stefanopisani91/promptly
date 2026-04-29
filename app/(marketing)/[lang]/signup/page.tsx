import { notFound, redirect } from "next/navigation";
import { isLang } from "@/types";

type Params = { lang: string };

export function generateStaticParams(): Params[] {
  return [{ lang: "it" }, { lang: "en" }];
}

export default function SignupPage({ params }: { params: Params }) {
  if (!isLang(params.lang)) notFound();
  redirect(`/auth?source=legacy_signup&lang=${params.lang}`);
}
