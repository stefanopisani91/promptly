import { notFound, redirect } from "next/navigation";
import { isLang } from "@/types";

type Params = { lang: string };

export function generateStaticParams(): Params[] {
  return [{ lang: "it" }, { lang: "en" }];
}

export default function LoginPage({ params }: { params: Params }) {
  if (!isLang(params.lang)) notFound();
  redirect(`/auth?source=legacy_login&lang=${params.lang}`);
}
