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
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  const devicesUrl = new URL("/devices", request.url);

  if (error) {
    // Specifically handle 403 access_denied with helpful guidance for test accounts
    if (error === "access_denied") {
      devicesUrl.searchParams.set(
        "error",
        "access_denied: The application is in Google OAuth Testing mode. Please ensure your Google account is added as a 'Test user' in the Google Cloud Console Audience tab."
      );
    } else {
      devicesUrl.searchParams.set("error", `google_health_${error}`);
    }
    return NextResponse.redirect(devicesUrl);
  }

  if (!code) {
    devicesUrl.searchParams.set("error", "missing_authorization_code");
    return NextResponse.redirect(devicesUrl);
  }

  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET;

  const host = requestUrl.host;
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const redirectUri = isLocal
    ? `${requestUrl.protocol}//${host}/api/google-health/callback`
    : (process.env.GOOGLE_HEALTH_REDIRECT_URI || "https://sos-healthcare.vercel.app/api/google-health/callback");

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

  // Validate state token matches requesting user
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (decodedState.userId && decodedState.userId !== user.id) {
        devicesUrl.searchParams.set("error", "oauth_state_mismatch");
        return NextResponse.redirect(devicesUrl);
      }
    } catch {
      // Invalid state format
    }
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
      devicesUrl.searchParams.set("error", tokenData.error_description || "token_exchange_failed");
      return NextResponse.redirect(devicesUrl);
    }

    // Persist to device_connections table (compatible with existing production status/scopes/last_sync_at and connection_status/last_synced_at)
    const nowIso = new Date().toISOString();
    const { error: dbErr } = await supabase.from("device_connections").upsert({
      user_id: user.id,
      provider: "google_health",
      status: "connected",
      connection_status: "CONNECTED",
      connected_at: nowIso,
      last_sync_at: nowIso,
      last_synced_at: nowIso,
      scopes: [
        "https://www.googleapis.com/auth/fitness.heart_rate.read",
        "https://www.googleapis.com/auth/fitness.activity.read",
        "https://www.googleapis.com/auth/fitness.location.read",
      ],
      metrics: ["heart_rate", "activity", "location"],
      permissions: ["read"],
      updated_at: nowIso,
    }, { onConflict: "user_id,provider" });

    if (dbErr) {
      console.error("[google-health/callback] device_connections upsert failure:", dbErr.code, dbErr.message);
      devicesUrl.searchParams.set("error", "device_persistence_failed");
      return NextResponse.redirect(devicesUrl);
    }

    // Update profiles smartwatch connection status
    try {
      await supabase.from("profiles").update({
        smartwatch_connected: true,
        updated_at: nowIso,
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
