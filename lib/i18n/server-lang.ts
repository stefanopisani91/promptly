import { cookies, headers } from "next/headers";
import { isLang, type Lang } from "@/types";

const LOCALE_COOKIE = "NEXT_LOCALE";

function pickFromAcceptLanguage(header: string | null): Lang {
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

/**
 * Resolve the language for a non-route-bound page (e.g. /auth/*).
 * Priority: explicit `?lang=` query → cookie → Accept-Language → 'it'.
 */
export function resolveLangFromRequest(searchParam?: string | string[]): Lang {
  const fromQuery = Array.isArray(searchParam) ? searchParam[0] : searchParam;
  if (isLang(fromQuery)) return fromQuery;

  const cookieValue = cookies().get(LOCALE_COOKIE)?.value;
  if (isLang(cookieValue)) return cookieValue;

  return pickFromAcceptLanguage(headers().get("accept-language"));
}
