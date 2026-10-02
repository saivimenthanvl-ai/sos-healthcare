import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { exchangeFitbitCode } from "@/lib/fitbit";

/**
 * GET /api/fitbit/callback
 * Handles the Fitbit OAuth2 redirect.
 * Stores the Fitbit access token + refresh token in the user's profile.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/profile?error=fitbit_no_code`
    );
  }

  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/login`);
  }

  const redirectUri = `${requestUrl.origin}/api/fitbit/callback`;

  try {
    // Exchange the authorization code for an access token
    const tokens = await exchangeFitbitCode(code, redirectUri);

    // Store Fitbit credentials in the user's profile
    await supabase
      .from("profiles")
      .update({
        fitbit_user_id: tokens.user_id,
        fitbit_access_token: tokens.access_token,
        fitbit_refresh_token: tokens.refresh_token,
        fitbit_token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
        smartwatch_connected: true,
      })
      .eq("id", session.user.id);

    return NextResponse.redirect(`${requestUrl.origin}/profile?success=fitbit_connected`);
  } catch (error) {
    console.error("Fitbit callback error:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/profile?error=fitbit_exchange_failed`
    );
  }
}
