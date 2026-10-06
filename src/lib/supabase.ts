import {
  createServerClient as createSsrServerClient,
  createBrowserClient,
} from "@supabase/ssr";

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserSupabaseClient | null = null;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase configuration is unavailable. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) for this deployment environment."
    );
  }

  return { url, key };
}

function getBrowserClient(): BrowserSupabaseClient {
  if (!browserClient) {
    const { url, key } = getSupabaseConfig();
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
}

/**
 * Lazy browser client.
 *
 * Do not validate environment variables during module evaluation: Next.js and
 * Vercel import route modules while collecting build metadata. Configuration
 * is checked only when Supabase is actually used at runtime.
 */
export const supabase = new Proxy({} as BrowserSupabaseClient, {
  get(_target, property) {
    const client = getBrowserClient();
    const value = Reflect.get(client as object, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Server-side Supabase client. Configuration is resolved lazily when an actual
 * request creates the client, preventing missing Preview env vars from crashing
 * Next.js page-data collection at build time.
 */
export function createServerClient(
  cookieStore: {
    getAll(): Array<{ name: string; value: string }>;
    setAll(
      cookies: Array<{
        name: string;
        value: string;
        options?: Record<string, unknown>;
      }>
    ): void;
  }
) {
  const { url, key } = getSupabaseConfig();

  return createSsrServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => cookieStore.setAll(cookiesToSet),
    },
  });
}
