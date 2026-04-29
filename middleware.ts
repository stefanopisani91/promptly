import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLang, type Lang } from "./types";

const LOCALE_COOKIE = "NEXT_LOCALE";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Expose pathname to RSC root layout (used to set <html lang>)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Skip language redirect for non-marketing assets/routes
  const isAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.[a-zA-Z0-9]+$/.test(pathname);

  if (isAsset) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // If pathname already starts with a known lang, just continue
  const firstSeg = pathname.split("/")[1];
  if (isLang(firstSeg)) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.cookies.set(LOCALE_COOKIE, firstSeg, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }

  // Otherwise redirect: prefer cookie, fall back to Accept-Language
  const cookieLang = request.cookies.get(LOCALE_COOKIE)?.value;
  const target: Lang = isLang(cookieLang)
    ? cookieLang
    : pickLangFromAcceptLanguage(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
