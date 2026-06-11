"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for use in Client Components. The anon key is a public,
 * browser-safe key — all access is constrained by Row-Level Security, so the
 * session (a signed JWT in cookies) is what actually scopes data to the user.
 *
 * Memoized so the whole app shares one client (one auth listener, one cookie
 * store) rather than spinning up a new instance per call.
 */
let browserClient: SupabaseClient | undefined;

/** Whether the public Supabase env vars are present. When they're not (e.g. a
    local checkout with no `.env.local`), the app degrades to demo mode instead
    of crashing on client creation. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return browserClient;
}
