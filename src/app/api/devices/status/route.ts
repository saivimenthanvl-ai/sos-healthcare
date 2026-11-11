import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

interface DeviceConnectionRow {
  provider: string;
  connection_status: string;
}

/**
 * GET /api/devices/status
 * Returns verified connection statuses for smart devices and configured server credentials
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
    const { data: connections } = await supabase
      .from("device_connections")
      .select("*")
      .eq("user_id", user.id);

    if (connections) {
      connections.forEach((item: unknown) => {
        const conn = item as DeviceConnectionRow;
        if (conn.provider === "google_health" && conn.connection_status === "CONNECTED") {
          googleHealthConnected = true;
        }
        if (conn.provider === "apple_health" && conn.connection_status === "CONNECTED") {
          appleHealthConnected = true;
        }
        if (conn.provider === "wear_os" && conn.connection_status === "CONNECTED") {
          wearOsConnected = true;
        }
      });
    }
  } catch (_err: unknown) {
    // If device_connections not yet populated
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
