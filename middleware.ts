// Middleware: maintenance switch + session refresh.
//
// MAINTENANCE_MODE: short-circuits the entire app when true:
//   - GET /maintenance               → served normally
//   - any other page route           → 307 redirect to /maintenance
//   - any /api/* route               → 503 JSON {"error":"maintenance"}
//   - static assets / _next / auth   → already excluded by `matcher`
//     below, so they continue to load (favicon, fonts, layout JS).
// Bring the site back online by flipping the flag to false (or
// reverting the maintenance commit) and pushing.
//
// Normally this middleware does session refresh: it calls
// supabase.auth.getUser() so any expired access tokens are refreshed
// and the new tokens are written to both the response cookies (sent
// back to the browser) and the forwarded request (so Server
// Components downstream read the fresh session).
//
// Language routing is handled by app/page.tsx + app/[lang]/layout.tsx
// and does NOT need to live here. Authorization (redirecting
// unauthenticated users) is handled by the individual layouts /
// pages, not here.
//
// IMPORTANT: do NOT add logic between createServerClient and
// getUser() — a bug there can clear session cookies without
// refreshing, causing random logouts.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Hard switch for site-wide maintenance. Flip to false to bring the
// site back online (or revert the commit that set this true).
const MAINTENANCE_MODE = true;

const MAINTENANCE_PATH = "/maintenance";

export async function middleware(request: NextRequest) {
  if (MAINTENANCE_MODE) {
    const pathname = request.nextUrl.pathname;
    if (pathname === MAINTENANCE_PATH) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "maintenance" }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "3600",
            "Cache-Control": "no-store",
          },
        },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = MAINTENANCE_PATH;
    url.search = "";
    return NextResponse.redirect(url, 307);
  }

  // Auth routes (PKCE OAuth callback, magic-link expired, etc.) own
  // their own cookie writes — running session-refresh there can
  // double-set cookies and break the flow. The matcher used to
  // exclude them statically, but we needed maintenance redirects to
  // reach them too; the skip now lives inline.
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed tokens into the forwarded request so Server
          // Components see them via cookies() from next/headers.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Also write them into the response so the browser stores the
          // new tokens and sends them on the next request.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session. If the access token is expired this call will use
  // the refresh token to obtain a new one and persist it via setAll above.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - Next.js internals (_next/static, _next/image)
     * - favicon and static assets
     *
     * Auth routes (/auth/*) used to be excluded here too, but during
     * MAINTENANCE_MODE we want them redirected like everything else.
     * The session-refresh skip for /auth/* is now inline in
     * middleware() above so OAuth callbacks keep their original
     * cookie-handling behavior when the site is online.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
