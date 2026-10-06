import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy Fitbit OAuth is disabled.
 *
 * The legacy Fitbit Web API is being retired and this application no longer
 * stores provider OAuth tokens in public.profiles. Future wearable providers
 * must use the backend-only device_connections flow with encrypted credentials
 * and one-time OAuth state validation.
 */
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(
    `${origin}/devices?error=legacy_fitbit_disabled`,
    { status: 307 }
  );
}
