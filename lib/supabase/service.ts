// Server-only Supabase client that authenticates with the service role key,
// bypassing RLS. Use ONLY from trusted server actions / route handlers
// where the operation needs to act on rows the requesting user doesn't own
// (e.g. crediting the referrer's XP from the referee's session).
//
// NEVER export anything that returns this client to a "use client" boundary.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createServiceClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase service client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  cached = createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}
