import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * GET /auth/callback and /api/auth/callback
 * Handles the Supabase OAuth code exchange with PKCE verifier cookie.
 * Ensures the session is established and safe profile creation/fallback occurs.
 */
export async function handleAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const errorCode = requestUrl.searchParams.get("error");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect") || "/dashboard";

  // Prevent open redirect vulnerabilities
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/dashboard";

  if (errorCode || errorDescription) {
    console.error("OAuth callback error from provider:", errorCode, errorDescription);
    const loginUrl = new URL("/auth/login", origin);
    loginUrl.searchParams.set(
      "error",
      errorDescription || "Google sign-in was cancelled or encountered an error."
    );
    return NextResponse.redirect(loginUrl.toString());
  }

  if (code) {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Supabase code exchange error:", error.message);
        const loginUrl = new URL("/auth/login", origin);
        loginUrl.searchParams.set(
          "error",
          "Google sign-in is temporarily unavailable. Please try again or use email sign-in."
        );
        return NextResponse.redirect(loginUrl.toString());
      }

      // Check if session and user were retrieved
      if (data?.session?.user) {
        const user = data.session.user;
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
        } catch (profileErr) {
          // Non-blocking if profile already exists or trigger handled it
          console.warn("Notice: profile ensure handled:", profileErr);
        }
      }
    } catch (err) {
      console.error("Unexpected error in auth callback:", err);
      const loginUrl = new URL("/auth/login", origin);
      loginUrl.searchParams.set(
        "error",
        "An unexpected error occurred during Google sign-in. Please try again."
      );
      return NextResponse.redirect(loginUrl.toString());
    }
  }

  // Redirect to the intended page (or dashboard)
  return NextResponse.redirect(`${origin}${safeRedirect}`);
}
