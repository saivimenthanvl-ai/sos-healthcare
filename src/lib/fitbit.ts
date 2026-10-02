/**
 * Fitbit API integration
 * Retrieves real-time health data (heart rate, steps, sleep) and
 * last known location for SOS emergencies.
 */

const FITBIT_BASE_URL = "https://api.fitbit.com/1/user";
const FITBIT_AUTH_URL = "https://api.fitbit.com/oauth2/authorize";

export interface FitbitTokenResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  scope: string;
  expires_in: number;
}

export interface FitbitHeartRate {
  time: string;
  rate: number;
}

export interface FitbitActivity {
  steps: number;
  distance: number;
}

export interface FitbitLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
}

/**
 * Get the Fitbit OAuth authorization URL.
 * Call this from your frontend to redirect the user to Fitbit.
 */
export function getFitbitAuthUrl(redirectUri: string): string {
  const clientId = process.env.FITBIT_CLIENT_ID!;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "activity heartrate location profile sleep",
    expires_in: "604800",
  });

  return `${FITBIT_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for an access token.
 * Use the server-side SUPABASE_SERVICE_ROLE_KEY for secure requests.
 */
export async function exchangeFitbitCode(
  code: string,
  redirectUri: string
): Promise<FitbitTokenResponse> {
  const clientId = process.env.FITBIT_CLIENT_ID!;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!;

  const response = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Fitbit token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user_id: data.user_id,
    scope: data.scope,
    expires_in: data.expires_in,
  };
}

/**
 * Refresh a Fitbit access token.
 */
export async function refreshFitbitToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.FITBIT_CLIENT_ID!;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!;

  const response = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Fitbit refresh failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_in: data.expires_in,
  };
}

/**
 * Fetch the user's most recent heart rate reading.
 * Returns the heart rate in BPM.
 */
export async function getLatestHeartRate(accessToken: string): Promise<number | null> {
  const today = new Date().toISOString().split("T")[0];

  try {
    const response = await fetch(
      `${FITBIT_BASE_URL}/${today}/1d/heart/date/${today}/1d/time/00:00/23:59.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const heartData = data?.["activities-heart"]?.[0]?.value?.restingHeartRateReading;
    const latest = heartData?.[heartData.length - 1]?.valueOf;

    return latest ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch the user's latest activity summary (steps, distance).
 */
export async function getLatestActivity(accessToken: string): Promise<FitbitActivity | null> {
  try {
    const response = await fetch(`${FITBIT_BASE_URL}/activities/steps/date/today/1d.json`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const stepsEntry = data?.["activities-steps"]?.[0];
    const distanceEntry = data?.["activities-distance"]?.[0];

    return {
      steps: stepsEntry ? parseInt(stepsEntry.steps, 10) : 0,
      distance: distanceEntry ? parseFloat(distanceEntry.distance) : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch the user's last known location (requires the location scope
 * and the Fitbit app to have location permission enabled).
 */
export async function getFitbitLocation(accessToken: string): Promise<FitbitLocation | null> {
  try {
    const response = await fetch(`${FITBIT_BASE_URL}/location/daily.json`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const lastEntry = data?.location?.[0];

    if (lastEntry?.latitude && lastEntry?.longitude) {
      return {
        latitude: lastEntry.latitude,
        longitude: lastEntry.longitude,
        timestamp: lastEntry.time,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch a combined health summary for emergency context.
 */
export async function getEmergencyHealthData(
  accessToken: string
): Promise<{
  heartRate: number | null;
  steps: number | null;
  location: FitbitLocation | null;
}> {
  const [heartRate, activity, location] = await Promise.allSettled([
    getLatestHeartRate(accessToken),
    getLatestActivity(accessToken),
    getFitbitLocation(accessToken),
  ]);

  return {
    heartRate: heartRate.status === "fulfilled" ? heartRate.value : null,
    steps: activity.status === "fulfilled" && activity.value ? activity.value.steps : null,
    location: location.status === "fulfilled" ? location.value : null,
  };
}
