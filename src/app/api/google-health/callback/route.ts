import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * GET /api/google-health/callback
 * Handles Google OAuth redirect, token exchange, and persistence
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  const devicesUrl = new URL("/devices", request.url);

  if (error) {
    devicesUrl.searchParams.set("error", `google_health_${error}`);
    return NextResponse.redirect(devicesUrl);
  }

  if (!code) {
    devicesUrl.searchParams.set("error", "missing_authorization_code");
    return NextResponse.redirect(devicesUrl);
  }

  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_HEALTH_REDIRECT_URI || "https://sos-healthcare.vercel.app/api/google-health/callback";

  if (!clientId || !clientSecret) {
    devicesUrl.searchParams.set("error", "server_missing_credentials");
    return NextResponse.redirect(devicesUrl);
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/auth/login?redirect=/devices", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Exchange authorization code for access and refresh tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[google-health/callback] Token exchange failed:", tokenData);
      devicesUrl.searchParams.set("error", "token_exchange_failed");
      return NextResponse.redirect(devicesUrl);
    }

    // Persist to device_connections table
    try {
      await supabase.from("device_connections").upsert({
        user_id: user.id,
        provider: "google_health",
        connection_status: "CONNECTED",
        last_synced_at: new Date().toISOString(),
        metrics: ["heart_rate", "activity", "location"],
        permissions: ["read"],
      }, { onConflict: "user_id,provider" });
    } catch (dbErr) {
      console.warn("[google-health/callback] device_connections upsert notice:", dbErr);
    }

    // Update profiles smartwatch connection status
    try {
      await supabase.from("profiles").update({
        smartwatch_connected: true,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
    } catch (profileErr) {
      console.warn("[google-health/callback] profile update notice:", profileErr);
    }

    devicesUrl.searchParams.set("success", "google_health_connected");
    return NextResponse.redirect(devicesUrl);
  } catch (err: unknown) {
    console.error("[google-health/callback] Exception during token exchange:", err);
    devicesUrl.searchParams.set("error", "internal_oauth_error");
    return NextResponse.redirect(devicesUrl);
  }
}
