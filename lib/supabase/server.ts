import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In a Server Component cookies() is read-only and set() throws.
          // Route Handlers and Server Actions can write. We swallow the error
          // here so the same client works in both contexts — token refreshes
          // are handled by middleware.ts which CAN write to response cookies.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* noop — expected in Server Components; middleware handles refresh */
          }
        },
      },
    },
  );
}
