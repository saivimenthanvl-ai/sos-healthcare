/// <reference types="google.maps" />

/**
 * Google Maps JS API utilities
 * - Asynchronously loads the Google Maps script using the officially recommended loading=async pattern
 * - Automatically registers and resolves via global callback
 * - Replaces deprecated google.maps.Marker with google.maps.marker.AdvancedMarkerElement where supported
 * - Graceful fallback to legacy Marker if AdvancedMarkerElement is unavailable
 * - Converts addresses to coordinates (geocoding)
 * - Reverse geocodes to get address from coordinates
 * - Calculates distance between points
 */

let mapsLoaderPromise: Promise<typeof google> | null = null;

interface GoogleMapsWindow extends Window {
  google?: typeof google;
  __initGoogleMapsCallback?: () => void;
}

/**
 * Get the configured Google Maps Map ID from environment variables.
 * AdvancedMarkerElement requires a Map ID on the Map options (can be "DEMO_MAP_ID" for local development if not set,
 * but production should provide NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID).
 */
export function getGoogleMapsMapId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;
}

/**
 * Loads the Google Maps JavaScript API script once asynchronously.
 * Uses the official `loading=async` query parameter and `libraries=marker,places` to support AdvancedMarkerElement.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is a client-side only API"));
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

      // Check if script already exists in document
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );

      if (existingScript) {
        if (w.google?.maps) {
          resolve(w.google);
          return;
        }
        // If script is already in document but not yet resolved, attach event listeners
        existingScript.addEventListener("load", () => {
          if (w.google?.maps) resolve(w.google);
          else reject(new Error("Google Maps loaded but google.maps namespace missing"));
        });
        existingScript.addEventListener("error", () => {
          reject(new Error("Failed to load Google Maps script"));
        });
        return;
      }

      const callbackName = "__initGoogleMapsCallback";
      w[callbackName] = () => {
        delete w[callbackName];
        if (w.google?.maps) {
          resolve(w.google);
        } else {
          reject(new Error("Google Maps callback fired but namespace missing"));
        }
      };

      const script = document.createElement("script");
      // Official Google Maps async loading pattern:
      // loading=async prevents the "Google Maps JavaScript API loaded without loading=async" console warning.
      // libraries=marker,places ensures google.maps.marker.AdvancedMarkerElement and PinElement are available.
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        apiKey
      )}&libraries=marker,places&loading=async&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        delete w[callbackName];
        reject(new Error("Failed to load Google Maps script"));
      };

      document.head.appendChild(script);
    }).catch((error: unknown): never => {
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

    const response = await geocoder.geocode({
      location: new google.maps.LatLng(coords.lat, coords.lng),
    });

    if (!response.results || response.results.length === 0) return null;

    const result = response.results[0];
    const addressComponents = result.address_components;

    const getComponent = (type: string) =>
      addressComponents.find((c: google.maps.GeocoderAddressComponent) =>
        c.types.includes(type)
      )?.long_name || "";

    return {
      address: result.formatted_address,
      city:
        getComponent("locality") ||
        getComponent("sublocality") ||
        getComponent("administrative_area_level_2"),
      state: getComponent("administrative_area_level_1"),
      country: getComponent("country"),
      postalCode: getComponent("postal_code"),
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
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

    const response = await geocoder.geocode({ address });

    if (!response.results || response.results.length === 0) return null;

    const location = response.results[0].geometry.location;
    return {
      lat: location.lat(),
      lng: location.lng(),
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Calculate straight-line distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimate travel time in minutes based on distance and average urban speed (40 km/h).
 */
export function calculateETA(distanceKm: number): number {
  const avgSpeedKmH = 40; // average city emergency vehicle speed
  return Math.ceil((distanceKm / avgSpeedKmH) * 60);
}
