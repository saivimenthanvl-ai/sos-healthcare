import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * GET /auth/callback and /api/auth/callback
 * Handles the Supabase OAuth code exchange with PKCE verifier cookie.
 * Ensures the session is established, initializes profile safely,
 * and redirects to the homepage (/).
 */
export async function handleAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const errorCode = requestUrl.searchParams.get("error");
  const origin = requestUrl.origin;
  // Default post-login destination is the homepage '/'
  const redirectTo = requestUrl.searchParams.get("redirect") || "/";

  // Prevent open redirect vulnerabilities
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

  console.log("[OAuth] callback received at", request.nextUrl.pathname);

  if (errorCode || errorDescription) {
    console.error("[OAuth] error from provider:", errorCode, errorDescription);
    const loginUrl = new URL("/auth/login", origin);
    loginUrl.searchParams.set("error", "google_login_failed");
    return NextResponse.redirect(loginUrl.toString());
  }

  if (code) {
    try {
      console.log("[OAuth] exchange start");
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[OAuth] exchange failed:", error.message);
        const loginUrl = new URL("/auth/login", origin);
        loginUrl.searchParams.set("error", "google_login_failed");
        return NextResponse.redirect(loginUrl.toString());
      }
      console.log("[OAuth] exchange success");

      // Check if session and user were retrieved
      if (data?.session?.user) {
        const user = data.session.user;
        console.log("[OAuth] getUser success, user ID:", user.id);
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "";

        // Idempotent profile ensure in case database trigger hasn't fired
        try {
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              full_name: fullName,
              email: user.email,
              role: "patient",
            },
            { onConflict: "id", ignoreDuplicates: true }
          );
          console.log("[OAuth] profile success");
        } catch (profileErr) {
          // Non-blocking if profile already exists or trigger handled it
          console.warn("[OAuth] profile ensure handled/skipped:", profileErr);
        }
      }
    } catch (err: any) {
      console.error("[OAuth] unexpected failure:", err?.message || err);
      const loginUrl = new URL("/auth/login", origin);
      loginUrl.searchParams.set("error", "google_login_failed");
      return NextResponse.redirect(loginUrl.toString());
    }
  }

  console.log("[OAuth] redirect success to", safeRedirect);
  return NextResponse.redirect(`${origin}${safeRedirect}`);
}
