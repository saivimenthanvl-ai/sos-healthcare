import { useState, useEffect } from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

/** Whether the browser exposes the geolocation API. */
function geolocationSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const requestLocation = () => {
    if (!geolocationSupported()) {
      setLocation({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: "Geolocation is not supported by this browser",
        loading: false,
      });
      return;
    }

    setLocation((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setLocation({
          latitude: null,
          longitude: null,
          accuracy: null,
          error: error.message,
          loading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Auto-request on mount. Kicking off the platform geolocation API is a
  // genuine external-system interaction, which is what effects are for.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestLocation();
  }, []);

  return { ...location, requestLocation };
}

/**
 * Hook that continuously watches position for real-time tracking.
 */
export function useLocationWatch() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [watchError, setWatchError] = useState<string | null>(null);

  const supported = geolocationSupported();

  useEffect(() => {
    if (!supported) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        setWatchError(null);
      },
      (err) => setWatchError(err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [supported]);

  // Derived rather than stored, so no effect is needed to set it.
  const error = supported ? watchError : "Geolocation not supported";

  return { position, error };
}