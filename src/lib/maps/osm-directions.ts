import { Coordinates, isValidCoordinate } from "./location-contract";

/**
 * Builds a validated, standards-compliant OpenStreetMap directions URL.
 * URL format:
 *   https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=<originLat>%2C<originLng>%3B<destLat>%2C<destLng>#map=15/<destLat>/<destLng>
 *
 * If origin is omitted or invalid, generates a map view directly centered on the destination.
 */
export function buildOsmDirectionsUrl(
  origin: Coordinates | null | undefined,
  destination: Coordinates
): string {
  if (!isValidCoordinate(destination?.lat, destination?.lng)) {
    throw new Error("Invalid destination coordinates for OpenStreetMap directions.");
  }

  const destLat = destination.lat.toFixed(6);
  const destLng = destination.lng.toFixed(6);

  // If valid origin is provided, build full origin-to-destination route
  if (origin && isValidCoordinate(origin.lat, origin.lng)) {
    const originLat = origin.lat.toFixed(6);
    const originLng = origin.lng.toFixed(6);

    const url = new URL("https://www.openstreetmap.org/directions");
    url.searchParams.set("engine", "fossgis_osrm_car");
    url.searchParams.set("route", `${originLat},${originLng};${destLat},${destLng}`);
    url.hash = `map=15/${destLat}/${destLng}`;

    return url.toString();
  }

  // If no origin available, open destination directly on OpenStreetMap without broken text searches
  const url = new URL("https://www.openstreetmap.org");
  url.searchParams.set("mlat", destLat);
  url.searchParams.set("mlon", destLng);
  url.hash = `map=16/${destLat}/${destLng}`;

  return url.toString();
}
