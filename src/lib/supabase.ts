import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Supabase now issues `sb_publishable_...` keys and documents them as
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, while the `anon` key from older
// projects uses NEXT_PUBLIC_SUPABASE_ANON_KEY. Accept either so the same
// build works with both key styles.
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail here, at module scope, rather than letting createSupabaseClient throw
// an opaque "supabaseUrl is required" from inside the SDK. This runs during
// `next build` page-data collection too, so the message needs to explain that
// the variables must be present at build time, not only when serving.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
      "  Required: NEXT_PUBLIC_SUPABASE_URL, plus one of\n" +
      "            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_...)\n" +
      "            NEXT_PUBLIC_SUPABASE_ANON_KEY (eyJ... anon key)\n" +
      "  Where:   Supabase dashboard > Project Settings > API Keys\n" +
      "  Note:    the URL and the key must come from the SAME project.\n" +
      "           These must be set when `next build` runs, not just at runtime —\n" +
      "           Next.js evaluates every route module while collecting page data."
  );
}

// Bind the narrowed values so the closures below see `string`, not
// `string | undefined`.
const SUPABASE_URL: string = supabaseUrl;
const SUPABASE_ANON_KEY: string = supabaseAnonKey;

// ---------------------------------------------------------------------------
// Browser-side singleton client
// Safe to import in "use client" components.
// ---------------------------------------------------------------------------
export const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  return createSsrServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => cookieStore.setAll(cookiesToSet),
    },
  });
}
