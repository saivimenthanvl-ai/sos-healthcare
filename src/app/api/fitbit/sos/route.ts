import { NextResponse } from "next/server";

/**
 * Legacy unauthenticated wearable SOS endpoint is intentionally disabled.
 *
 * A device must never be allowed to claim a user by posting a userId. Future
 * provider/webhook integrations must authenticate the device/provider
 * cryptographically, resolve the linked device_connection server-side, and
 * then enter the normal emergency workflow.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Legacy wearable SOS integration is disabled",
      code: "LEGACY_WEARABLE_ENDPOINT_DISABLED",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
