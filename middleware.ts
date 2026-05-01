// Middleware: session refresh only.
//
// This middleware does ONE thing: it calls supabase.auth.getUser() so that
// any expired access tokens are refreshed and the new tokens are written to
// both the response cookies (sent back to the browser) and the forwarded
// request (so Server Components downstream read the fresh session).
//
// Language routing is handled by app/page.tsx + app/[lang]/layout.tsx and
// does NOT need to live here. Authorization (redirecting unauthenticated
// users) is handled by the individual layouts / pages, not here.
//
// IMPORTANT: do NOT add logic between createServerClient and getUser() —
// a bug there can clear session cookies without refreshing, causing random
// logouts.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
     * - Auth routes (/auth/*) — the PKCE OAuth callback must run without
     *   middleware interference; session-refresh is not needed there anyway.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
