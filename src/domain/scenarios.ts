import type { Polarization, Technology } from "./profiles";
import { geodesicDistanceKm, type Bounds } from "./terrain";

/**
 * Origin of the access node receiver sensitivity threshold (RN-42).
 */
export type SensitivityOrigin = "REFERENCE_TO_VERIFY" | "USER_DEFINED";

/**
 * Deployed access node (gateway in LoRaWAN or base station in NB-IoT/LTE-M).
 */
export interface AccessNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  height_agl_m: number;
  antenna_ref: string | null;
  antenna_gain_dbi: number;
  polarization: Polarization | null;
  sensitivity_dbm: number;
  sensitivity_origin: SensitivityOrigin;
}

/**
 * Deployed transmitting field device (end node).
 */
export interface EndNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  height_agl_m: number;
  antenna_ref: string | null;
  antenna_gain_dbi: number;
  polarization: Polarization | null;
  tx_power_nominal_dbm: number;
  tx_power_tolerance_db: number;
  source_template_id: string | null;
}

/**
 * Uplink radio link from an end node to an access node.
 */
export interface Link {
  id: string;
  end_node_id: string;
  access_node_id: string;
}

/**
 * Radio configuration of a scenario tied to a single LPWAN profile (RN-15, RN-22).
 */
export interface RadioConfig {
  profile_id: string;
  technology: Technology;
  band_code: string;
  frequency_mhz: number;
}

/**
 * Terrain reference and clipping window of a scenario (RN-26, RN-27).
 */
export interface TerrainRef {
  dem_id: string;
  window: Bounds;
}

/**
 * User-configurable parameters for the Longley-Rice (ITM) propagation model.
 */
export interface LongleyRiceParams {
  ens0: number;
  ipol: number;
  eps: number;
  sgm: number;
  klim: number;
  mdvar: number;
  qc: number;
  qr: number[];
}

/**
 * Propagation model selection and parameters.
 */
export interface PropagationSetup {
  model_id: string;
  schema_version: number;
  parameters: LongleyRiceParams;
}

/**
 * Scenario aggregate persisted in the backend.
 */
export interface Scenario {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  comparison_group_id: string;
  bounds: Bounds;
  terrain_ref: TerrainRef | null;
  radio_config: RadioConfig | null;
  access_nodes: AccessNode[];
  end_nodes: EndNode[];
  links: Link[];
  propagation_setup: PropagationSetup | null;
  created_at: string;
  updated_at: string;
}

/**
 * Blocking cause returned when a scenario is not yet ready for simulation (RN-31).
 */
export interface ValidationCause {
  code: string;
  message: string;
}

/**
 * Result of validating a scenario for simulation (RN-31, AC-16).
 */
export interface ScenarioValidationResult {
  simulable: boolean;
  causes: ValidationCause[];
}

/**
 * Enriched link item within an access node star group.
 */
export interface StarLinkItem {
  link: Link;
  endNode: EndNode;
  distanceKm: number;
}

/**
 * Star topology group centered on a single AccessNode.
 */
export interface StarGroup {
  accessNode: AccessNode;
  title: string;
  items: StarLinkItem[];
}

/**
 * Default Longley-Rice propagation parameters for continental Colombia.
 */
export const DEFAULT_LONGLEY_RICE_PARAMS: LongleyRiceParams = {
  ens0: 314.0,
  ipol: 1,
  eps: 15.0,
  sgm: 0.005,
  klim: 5,
  mdvar: 11,
  qc: 50.0,
  qr: [10.0, 50.0, 90.0],
};

/**
 * Verifies that an antenna height above ground level is at least 0.5 meters (RN-20).
 * @param meters - Antenna height AGL in meters (m).
 * @returns True if meters >= 0.5.
 */
export function hasValidAntennaHeight(meters: number): boolean {
  return Number.isFinite(meters) && meters >= 0.5;
}

/**
 * Verifies that the horizontal distance between two nodes is at least 1.0 km (RN-19).
 * @param lat1 - First node latitude in degrees.
 * @param lng1 - First node longitude in degrees.
 * @param lat2 - Second node latitude in degrees.
 * @param lng2 - Second node longitude in degrees.
 * @returns True if geodesic distance is >= 1.0 km.
 */
export function hasValidLinkDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): boolean {
  return geodesicDistanceKm(lat1, lng1, lat2, lng2) >= 1.0;
}

/**
 * Checks whether a geographic point lies inside or on the boundary of the study area (RN-21).
 * @param lat - Node latitude in decimal degrees.
 * @param lng - Node longitude in decimal degrees.
 * @param bounds - Study area bounding box in decimal degrees.
 * @returns True if the coordinate is within bounds.
 */
export function isNodeInsideArea(lat: number, lng: number, bounds: Bounds): boolean {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

/**
 * Checks whether a DEM bounding box completely covers the scenario study area (RN-26).
 * @param demBounds - Bounding box of the DEM in decimal degrees.
 * @param studyBounds - Bounding box of the scenario study area in decimal degrees.
 * @returns True if demBounds completely contains studyBounds.
 */
export function doesDemCoverArea(demBounds: Bounds, studyBounds: Bounds): boolean {
  return (
    demBounds.south <= studyBounds.south &&
    demBounds.north >= studyBounds.north &&
    demBounds.west <= studyBounds.west &&
    demBounds.east >= studyBounds.east
  );
}

/**
 * Groups uplink links by their receiving AccessNode ("Estrella de <AccessNode>") (AC-12).
 * @param accessNodes - Deployed access nodes.
 * @param endNodes - Deployed end nodes.
 * @param links - Uplink links.
 * @returns Array of StarGroup objects with calculated link distances in km.
 */
export function groupLinksByStar(
  accessNodes: AccessNode[],
  endNodes: EndNode[],
  links: Link[]
): StarGroup[] {
  const endNodeMap = new Map<string, EndNode>(endNodes.map((en) => [en.id, en]));

  return accessNodes.map((an) => {
    const anLinks = links.filter((lk) => lk.access_node_id === an.id);
    const items: StarLinkItem[] = [];
    for (const lk of anLinks) {
      const en = endNodeMap.get(lk.end_node_id);
      if (en) {
        const distanceKm = geodesicDistanceKm(en.lat, en.lng, an.lat, an.lng);
        items.push({ link: lk, endNode: en, distanceKm });
      }
    }
    return {
      accessNode: an,
      title: `Estrella de ${an.name}`,
      items,
    };
  });
}

