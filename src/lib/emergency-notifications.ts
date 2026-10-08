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
Nearest Hospital: ${details.hospitalName || "Not yet assigned"}
Ambulance ETA: ${details.etaMinutes == null ? "Not confirmed" : `Estimated ${details.etaMinutes} minutes`}
Map: ${googleMapsUrl}`;

  return Promise.all(
    contacts.map(async (contact) => {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (contact.notification_method && contact.notification_method !== "sms") {
        return { phone: contact.phone, status: "unsupported" as const, mapsUrl: googleMapsUrl, hospitalNavUrl };
      }
      if (!twilioSid || !twilioAuth || !twilioPhone) {
        return { phone: contact.phone, status: "not_configured" as const, mapsUrl: googleMapsUrl, hospitalNavUrl };
      }

      try {
        const params = new URLSearchParams({ To: contact.phone, From: twilioPhone, Body: textMessage });
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilioSid)}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          }
        );
        if (!response.ok) {
          return { phone: contact.phone, status: "failed" as const, mapsUrl: googleMapsUrl, hospitalNavUrl };
        }
        const result = await response.json();
        if (!result?.sid) {
          return { phone: contact.phone, status: "failed" as const, mapsUrl: googleMapsUrl, hospitalNavUrl };
        }
        // "accepted" means provider accepted the message, not handset delivery.
        return { phone: contact.phone, status: "accepted" as const, providerMessageId: result.sid, mapsUrl: googleMapsUrl, hospitalNavUrl };
      } catch {
        return { phone: contact.phone, status: "failed" as const, mapsUrl: googleMapsUrl, hospitalNavUrl };
      }
    })
  );
}
