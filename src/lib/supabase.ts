import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// ---------------------------------------------------------------------------
// Browser-side singleton client
// Safe to import in "use client" components.
// ---------------------------------------------------------------------------
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
  },
});

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
  return createSsrServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => cookieStore.setAll(cookiesToSet),
    },
  });
}
