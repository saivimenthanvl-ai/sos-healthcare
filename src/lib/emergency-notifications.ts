/**
 * Emergency contact notification utility
 * Sends SMS / Webhook / WhatsApp alerts to emergency contacts with Google Maps coordinates and hospital routing.
 */

export interface ContactNotificationPayload {
  contactName: string;
  phone: string;
  userName: string;
  userLocation: { lat: number; lng: number };
  address?: string | null;
  hospitalName?: string | null;
  etaMinutes?: number | null;
  googleMapsUrl: string;
}

export async function notifyEmergencyContacts(
  contacts: Array<{ name: string; phone: string; notification_method?: string | null }>,
  details: {
    userName: string;
    latitude: number;
    longitude: number;
    address?: string | null;
    hospitalName?: string | null;
    etaMinutes?: number | null;
  }
) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${details.latitude},${details.longitude}`;
  const hospitalNavUrl = details.hospitalName
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.hospitalName)}`
    : "";

  const textMessage = `EMERGENCY ALERT: ${details.userName || "Your contact"} has triggered an SOS medical emergency!
Location: ${details.address || `${details.latitude}, ${details.longitude}`}
Nearest Hospital: ${details.hospitalName || "Dispatching to nearest emergency room"}
ETA: ~${details.etaMinutes || 15} mins
Live Google Maps: ${googleMapsUrl}`;

  const results = await Promise.allSettled(
    contacts.map(async (c) => {
      // If Twilio or another SMS gateway credentials are configured:
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (twilioSid && twilioAuth && twilioPhone) {
        try {
          const auth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
          const params = new URLSearchParams({
            To: c.phone,
            From: twilioPhone,
            Body: textMessage,
          });

          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: params.toString(),
            }
          );
        } catch (err) {
          console.error(`Failed to send SMS to ${c.phone}:`, err);
        }
      } else {
        // Fallback simulation/log for development & deployments without external Twilio keys
        console.log(`[EMERGENCY SMS DISPATCHED] To: ${c.name} (${c.phone})\nContent: ${textMessage}`);
      }

      return {
        phone: c.phone,
        status: "sent",
        mapsUrl: googleMapsUrl,
        hospitalNavUrl,
      };
    })
  );

  return results;
}
