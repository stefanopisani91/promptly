import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export function createClient() {
  const store = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // In a Server Component cookies() is read-only and `set` throws.
          // Route Handlers and Server Actions can write — swallow the throw
          // so the same client works in both contexts.
          try {
            store.set({ name, value, ...options });
          } catch {
            /* noop */
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            store.set({ name, value: "", ...options });
          } catch {
            /* noop */
          }
        },
      },
    },
  );
}
