import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * GET /auth/confirm
 * Handles email verification tokens (magic links, signup confirmation, password recovery).
 * Separated from OAuth /auth/callback.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") || "/";
  const origin = requestUrl.origin;

  const safeRedirect = next.startsWith("/") ? next : "/";

  if (token_hash && type) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }

    console.error("[EmailVerify] OTP verification failed:", error.message);
  }

  // If verification failed or token is missing/expired
  const loginUrl = new URL("/auth/login", origin);
  loginUrl.searchParams.set(
    "error",
    "Email confirmation link is invalid or has expired. Please try signing in or request a new link."
  );
  return NextResponse.redirect(loginUrl.toString());
}
