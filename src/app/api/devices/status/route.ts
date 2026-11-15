import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

interface DeviceConnectionRow {
  provider: string;
  status?: string | null;
  connection_status?: string | null;
}

/**
 * GET /api/devices/status
 * Returns verified connection statuses for smart devices and configured server credentials.
 * Queries only non-sensitive metadata columns; never selects encrypted OAuth credentials.
 */
export async function GET(_request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasGoogleHealthCredentials = Boolean(
    process.env.GOOGLE_HEALTH_CLIENT_ID &&
    process.env.GOOGLE_HEALTH_CLIENT_ID.trim() !== "" &&
    process.env.GOOGLE_HEALTH_CLIENT_ID !== "undefined"
  );

  let googleHealthConnected = false;
  let appleHealthConnected = false;
  let wearOsConnected = false;

  try {
    const { data: connections, error: connErr } = await supabase
      .from("device_connections")
      .select("id, provider, status, connection_status, scopes, connected_at, last_sync_at, last_synced_at, updated_at")
      .eq("user_id", user.id);

    if (connErr) {
      return NextResponse.json(
        { error: "Unable to load device connection status" },
        { status: 503 }
      );
    }

    if (connections) {
      connections.forEach((item: unknown) => {
        const conn = item as DeviceConnectionRow;
        const normalizedStatus = String(conn.connection_status || conn.status || "").toUpperCase();
        const isConnected = normalizedStatus === "CONNECTED" || normalizedStatus === "ACTIVE";
        if (conn.provider === "google_health" && isConnected) {
          googleHealthConnected = true;
        }
        if (conn.provider === "apple_health" && isConnected) {
          appleHealthConnected = true;
        }
        if (conn.provider === "wear_os" && isConnected) {
          wearOsConnected = true;
        }
      });
    }
  } catch (_err: unknown) {
    return NextResponse.json(
      { error: "Device status service unavailable" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    hasGoogleHealthCredentials,
    devices: {
      google_health: {
        connected: googleHealthConnected,
        configured: hasGoogleHealthCredentials,
      },
      apple_health: {
        connected: appleHealthConnected,
        configured: false, // Requires native iOS companion app
      },
      wear_os: {
        connected: wearOsConnected,
        configured: hasGoogleHealthCredentials,
      },
    },
  });
}
