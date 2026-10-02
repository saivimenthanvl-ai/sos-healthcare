import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";

/**
 * Create a Supabase server client from the Next.js route handler cookie store.
 * Call this inside every API route handler to access authenticated session.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set({ name, value, ...(options || {}) });
      });
    },
  });
}
