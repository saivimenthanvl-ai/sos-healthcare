"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isValidCoordinate, LocationFix } from "@/lib/maps/coordinates";

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoRequest?: boolean;
}

export interface UseLocationReturn {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  source: "browser" | "manual" | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState | "unsupported" | null;
  requestLocation: (customOptions?: PositionOptions) => Promise<LocationFix | null>;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  retryLocation: () => Promise<LocationFix | null>;
  clearLocationError: () => void;
  setManualLocation: (lat: number, lng: number, accuracyMeters?: number) => void;
}

/** Check if environment is client-side and geolocation is supported */
function isGeolocationSupported(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function useLocation(options?: UseLocationOptions): UseLocationReturn {
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    timestamp: number | null;
    source: "browser" | "manual" | null;
    error: string | null;
    loading: boolean;
  }>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    source: null,
    error: null,
    loading: options?.autoRequest !== false,
  });

  const [permissionState, setPermissionState] = useState<PermissionState | "unsupported" | null>(() => {
    if (typeof window === "undefined" || !navigator?.permissions?.query) {
      return "unsupported";
    }
    return null;
  });
  const watchIdRef = useRef<number | null>(null);

  // Check Permissions API where available
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions?.query) {
      return;
    }

    let isMounted = true;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (!isMounted) return;
        setPermissionState(status.state);
        status.onchange = () => {
          if (isMounted) setPermissionState(status.state);
        };
      })
      .catch(() => {
        if (isMounted) setPermissionState("unsupported");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const clearLocationError = useCallback(() => {
    setLocation((prev) => ({ ...prev, error: null }));
  }, []);

  const setManualLocation = useCallback((lat: number, lng: number, accuracyMeters: number = 10) => {
    if (!isValidCoordinate(lat, lng)) {
      setLocation((prev) => ({
        ...prev,
        error: "Invalid coordinates provided. Latitude must be between -90 and 90, longitude between -180 and 180.",
      }));
      return;
    }

    setLocation({
      latitude: lat,
      longitude: lng,
      accuracy: accuracyMeters,
      timestamp: Date.now(),
      source: "manual",
      error: null,
      loading: false,
    });
  }, []);

  const requestLocation = useCallback(
    (customOptions?: PositionOptions): Promise<LocationFix | null> => {
      if (!isGeolocationSupported()) {
        setLocation((prev) => ({
          ...prev,
          error: "Geolocation is not supported by your browser or secure context.",
          loading: false,
        }));
        return Promise.resolve(null);
      }

      setLocation((prev) => ({ ...prev, loading: true, error: null }));

      const posOptions: PositionOptions = customOptions || {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 15000,
        maximumAge: options?.maximumAge ?? 0, // Fresh location by default
      };

      return new Promise<LocationFix | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const fix: LocationFix = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracyMeters: pos.coords.accuracy,
              timestamp: pos.timestamp || Date.now(),
              source: "browser",
            };

            setLocation({
              latitude: fix.latitude,
              longitude: fix.longitude,
              accuracy: fix.accuracyMeters,
              timestamp: fix.timestamp,
              source: "browser",
              error: null,
              loading: false,
            });

            resolve(fix);
          },
          (err) => {
            let errorMsg = "Unable to determine your location.";
            if (err.code === err.PERMISSION_DENIED) {
              errorMsg = "Location access was denied. Please allow location permissions in your browser or enter a manual location.";
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              errorMsg = "Location information is currently unavailable. Check your device GPS or network settings.";
            } else if (err.code === err.TIMEOUT) {
              errorMsg = "Location request timed out. Please retry or pick location manually.";
            }

            setLocation((prev) => ({
              ...prev,
              error: errorMsg,
              loading: false,
            }));

            resolve(null);
          },
          posOptions
        );
      });
    },
    [options?.enableHighAccuracy, options?.timeout, options?.maximumAge]
  );

  const startLocationTracking = useCallback(() => {
    if (!isGeolocationSupported() || watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp || Date.now(),
          source: "browser",
          error: null,
          loading: false,
        });
      },
      (err) => {
        console.warn("[useLocation tracking warning]:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null && isGeolocationSupported()) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const retryLocation = useCallback(() => {
    return requestLocation();
  }, [requestLocation]);

  // Clean up watch on unmount
  useEffect(() => {
    if (options?.autoRequest !== false) {
      const timer = setTimeout(() => {
        void requestLocation();
      }, 0);
      return () => {
        clearTimeout(timer);
        if (watchIdRef.current !== null && isGeolocationSupported()) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    }

    return () => {
      if (watchIdRef.current !== null && isGeolocationSupported()) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [requestLocation, options?.autoRequest]);

  return {
    ...location,
    permissionState,
    requestLocation,
    startLocationTracking,
    stopLocationTracking,
    retryLocation,
    clearLocationError,
    setManualLocation,
  };
}

/** Legacy export for backward compatibility */
export function useLocationWatch() {
  const loc = useLocation({ autoRequest: true, enableHighAccuracy: true });
  return {
    position: loc.latitude && loc.longitude ? { coords: { latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy } } : null,
    watchError: loc.error,
  };
}
