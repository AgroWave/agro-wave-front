import { z } from "zod";

/**
 * Bounding box in WGS84 decimal degrees.
 */
export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * Status lifecycle of a DEM dataset (RN-26).
 */
export const DemStatus = {
  DOWNLOADING: "DOWNLOADING",
  AVAILABLE: "AVAILABLE",
  FAILED: "FAILED",
} as const;

export type DemStatus = (typeof DemStatus)[keyof typeof DemStatus];

/**
 * DEM dataset domain entity.
 */
export interface Dem {
  id: string;
  name: string;
  description: string | null;
  bounds: Bounds;
  status: DemStatus;
  resolution_m: number;
  object_key: string | null;
  size_bytes: number | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Dimensions in kilometers of a bounding box.
 */
export interface BoundsDimensions {
  widthKm: number;
  heightKm: number;
}

/**
 * Computes great-circle distance between two coordinates in kilometers using Haversine formula.
 * @param lat1 - Starting latitude in degrees.
 * @param lon1 - Starting longitude in degrees.
 * @param lat2 - Ending latitude in degrees.
 * @param lon2 - Ending longitude in degrees.
 * @returns Geodesic distance in kilometers.
 */
export function geodesicDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371.0;
  const toRadians = (deg: number) => (deg * Math.PI) / 180.0;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

/**
 * Calculates the horizontal width and vertical height of a bounding box in kilometers.
 * @param bounds - Geographic bounding box.
 * @returns Object with widthKm and heightKm in kilometers.
 */
export function boundsDimensionsKm(bounds: Bounds): BoundsDimensions {
  const midLat = (bounds.south + bounds.north) / 2.0;
  const midLon = (bounds.west + bounds.east) / 2.0;

  const widthKm = geodesicDistanceKm(midLat, bounds.west, midLat, bounds.east);
  const heightKm = geodesicDistanceKm(bounds.south, midLon, bounds.north, midLon);

  return { widthKm, heightKm };
}

/**
 * Verifies that both sides of a bounding box measure at least minKm (RN-13).
 * @param bounds - Geographic bounding box.
 * @param minKm - Minimum length in kilometers per side (default 1.5 km).
 * @returns True if both width and height are >= minKm.
 */
export function hasMinimumDimensions(bounds: Bounds, minKm: number = 1.5): boolean {
  if (bounds.south >= bounds.north || bounds.west >= bounds.east) {
    return false;
  }
  const { widthKm, heightKm } = boundsDimensionsKm(bounds);
  return widthKm >= minKm && heightKm >= minKm;
}

/**
 * Verifies if bounding box falls within continental Colombia boundaries (RN-12).
 * Excludes oceanic territories like San Andrés and Providencia.
 * @param bounds - Geographic bounding box.
 * @returns True if within continental Colombia envelope.
 */
export function isWithinContinentalColombia(bounds: Bounds): boolean {
  const minLat = -4.3;
  const maxLat = 12.55;
  const minLon = -79.15;
  const maxLon = -66.8;

  return (
    bounds.south >= minLat &&
    bounds.north <= maxLat &&
    bounds.west >= minLon &&
    bounds.east <= maxLon &&
    bounds.south < bounds.north &&
    bounds.west < bounds.east
  );
}

/**
 * Schema for requesting a new DEM download.
 */
export const createDemSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio").max(100),
    description: z.string().max(500).optional().nullable(),
    south: z.number({ required_error: "Latitud sur requerida" }),
    west: z.number({ required_error: "Longitud oeste requerida" }),
    north: z.number({ required_error: "Latitud norte requerida" }),
    east: z.number({ required_error: "Longitud este requerida" }),
  })
  .refine((data) => data.south < data.north, {
    message: "La latitud sur debe ser menor que la norte",
    path: ["south"],
  })
  .refine((data) => data.west < data.east, {
    message: "La longitud oeste debe ser menor que la este",
    path: ["west"],
  })
  .refine(
    (data) =>
      isWithinContinentalColombia({
        south: data.south,
        west: data.west,
        north: data.north,
        east: data.east,
      }),
    {
      message: "El área debe estar dentro de Colombia continental",
      path: ["south"],
    }
  )
  .refine(
    (data) =>
      hasMinimumDimensions({
        south: data.south,
        west: data.west,
        north: data.north,
        east: data.east,
      }),
    {
      message: "El área debe medir al menos 1.5 km por lado (RN-13)",
      path: ["south"],
    }
  );

export type CreateDemFormData = z.infer<typeof createDemSchema>;
