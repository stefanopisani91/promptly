import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";

type Lang = "en" | "it";

const LOCALE_COOKIE = "NEXT_LOCALE";

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "it";
}

function pickLangFromAcceptLanguage(header: string | null): Lang {
  if (!header) return "it";
  const parts = header
    .split(",")
    .map((p) => {
      const [tag, qPart] = p.trim().split(";");
      const q = qPart?.startsWith("q=") ? Number(qPart.slice(2)) : 1;
      return { tag: (tag ?? "").toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    if (tag.startsWith("it")) return "it";
    if (tag.startsWith("en")) return "en";
  }
  return "it";
}

export default function RootPage() {
  const cookieLang = cookies().get(LOCALE_COOKIE)?.value;
  const target: Lang = isLang(cookieLang)
    ? cookieLang
    : pickLangFromAcceptLanguage(headers().get("accept-language"));

  redirect(`/${target}`);
}
