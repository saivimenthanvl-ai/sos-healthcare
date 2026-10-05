import { createServerClient as createSsrServerClient, createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Supabase now issues `sb_publishable_...` keys and documents them as
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, while the `anon` key from older
// projects uses NEXT_PUBLIC_SUPABASE_ANON_KEY. Accept either so the same
// build works with both key styles.
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Bind values with safe fallbacks during CI build/static phase so page collection succeeds
const SUPABASE_URL: string = supabaseUrl || "https://kaqlhhswvbcuzcroysei.supabase.co";
const SUPABASE_ANON_KEY: string =
  supabaseAnonKey || "sb_publishable_QKI8pB_PHqlIqCfYJl1I2g_eGDZGXKF";

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    console.warn(
      "Warning: Supabase environment variables were not explicitly provided in runtime environment."
    );
  }
}

// ---------------------------------------------------------------------------
// Browser-side singleton client using @supabase/ssr
// Reads and writes cookies compatible with createServerClient.
// Safe to import in "use client" components.
// ---------------------------------------------------------------------------
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Create a server-side Supabase client that reads/writes auth cookies.
 * Pass a cookie store implementing getAll / setAll (e.g. from next/headers).
 *
 * Usage in API route handlers:
 *   import { cookies } from "next/headers";
 *   const supabase = createServerClient(cookies());
 */
export function createServerClient(
  cookieStore: {
    getAll(): Array<{ name: string; value: string }>;
    setAll(cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>): void;
  }
) {
  return createSsrServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => cookieStore.setAll(cookiesToSet),
    },
  });
}
