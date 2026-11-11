import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// Google Health & Health Connect scopes
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.location.read",
].join(" ");

/**
 * GET /api/google-health/authorize
 * Initiates verified Google Health OAuth 2.0 flow
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_HEALTH_REDIRECT_URI || "https://sos-healthcare.vercel.app/api/google-health/callback";

  if (!clientId || clientId.trim() === "" || clientId === "undefined") {
    return NextResponse.json(
      {
        error: "Google Health OAuth credentials are not configured in the server environment.",
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/auth/login?redirect=/devices", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Create state token with user id and random cryptographic nonce
  const stateObj = {
    userId: user.id,
    nonce: Math.random().toString(36).substring(2) + Date.now().toString(36),
  };
  const state = Buffer.from(JSON.stringify(stateObj)).toString("base64url");

  // Save state to oauth_states if table exists
  try {
    await supabase.from("oauth_states").insert({
      state,
      user_id: user.id,
      provider: "google_health",
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking if table is optional
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
