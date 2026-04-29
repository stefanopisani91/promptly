// Middleware intentionally disabled.
// Language routing is handled by app/page.tsx (root redirect) + app/[lang]/layout.tsx.
// This file exists because the build pipeline expects it; the matcher below
// never matches a real path, so this middleware is never invoked at runtime.

import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/__noop_never_match_xyz__/:path*"],
};
