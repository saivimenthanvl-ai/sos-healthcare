/// <reference types="google.maps" />

/**
 * Google Maps JS API utilities
 * - Loads the Google Maps script
 * - Converts addresses to coordinates (geocoding)
 * - Reverse geocodes to get address from coordinates
 * - Calculates distance between points
 */

let mapsLoaderPromise: Promise<typeof google> | null = null;

/**
 * The Google Maps script installs a global callback before the promise
 * settles, so it has to be declared on window.
 */
interface GoogleMapsWindow extends Window {
  google?: typeof google;
  initGoogleMapsCallback?: () => void;
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject("Google Maps is a client-side only API");
  }

  const w = window as GoogleMapsWindow;

  if (w.google?.maps) {
    return Promise.resolve(w.google);
  }

  if (!mapsLoaderPromise) {
    mapsLoaderPromise = new Promise<typeof google>((resolve, reject) => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;

      (window as GoogleMapsWindow).initGoogleMapsCallback = () => {
        const g = (window as GoogleMapsWindow).google;
        if (g) resolve(g);
      };

      script.onerror = () => {
        reject(new Error("Failed to load Google Maps script"));
      };

      document.head.appendChild(script);
    }).catch((error: unknown): never => {
      // A rejected promise stays rejected forever, so a single transient
      // failure (offline blip, blocked request) would otherwise make every
      // later call in the session fail immediately with no way to recover.
      // Clear the cache so the next caller retries with a fresh <script>.
      mapsLoaderPromise = null;
      throw error;
    });
  }

  return mapsLoaderPromise;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressInfo {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

/**
 * Reverse geocode coordinates to a human-readable address.
 */
export async function reverseGeocode(coords: Coordinates): Promise<AddressInfo | null> {
  try {
    const google = await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    const result = await geocoder.geocode({
      location: new google.maps.LatLng(coords.lat, coords.lng),
    });

    if (result.results && result.results.length > 0) {
      const addressComponents = result.results[0].address_components || [];
      const getComponent = (type: string) =>
        addressComponents.find((c: google.maps.GeocoderAddressComponent) =>
          c.types?.includes(type)
        )?.long_name || "";

      return {
        address: result.results[0].formatted_address || "",
        city: getComponent("locality") || getComponent("administrative_area_level_2"),
        state: getComponent("administrative_area_level_1"),
        country: getComponent("country"),
        postalCode: getComponent("postal_code"),
      };
    }

    return null;
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return null;
  }
}

/**
 * Geocode an address string to coordinates.
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const google = await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    const result = await geocoder.geocode({ address });

    if (result.results && result.results.length > 0) {
      const location = result.results[0].geometry.location;
      return {
        lat: location.lat(),
        lng: location.lng(),
      };
    }

    return null;
  } catch (error) {
    console.error("Geocode error:", error);
    return null;
  }
}

/**
 * Calculate the distance in kilometers between two coordinates using Haversine formula.
 */
export function calculateDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371; // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return R * c;
}

/**
 * Calculate ETA (estimated minutes) based on distance and average speed (km/h).
 */
export function calculateETA(distanceKm: number, speedKmH: number = 40): number {
  const minutes = (distanceKm / speedKmH) * 60;
  return Math.max(Math.round(minutes), 1);
}
