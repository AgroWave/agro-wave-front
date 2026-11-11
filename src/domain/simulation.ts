/**
 * Pure domain types and rules for the simulation bounded context (RN-30 to RN-43).
 */

import type { SensitivityOrigin, Technology } from "./scenarios";

/**
 * Lifecycle status of a simulation execution (RN-30).
 */
export type SimulationStatus = "CREATED" | "RUNNING" | "COMPLETED" | "FAILED";

/**
 * First Fresnel zone clearance verdict (RN-35).
 */
export type FresnelVerdict = "CLEAR" | "MARGINAL" | "OBSTRUCTED";

/**
 * DSR quantitative evaluation metrics for area coverage (RN-44..47).
 */
export interface CoverageMetrics {
  effective_coverage_area_km2: number;
  coverage_percentage: number;
  max_coverage_radius_km: number;
  variability_index: number;
  total_area_km2: number;
  covered_samples_count: number;
  total_samples_count: number;
}

/**
 * Single spatial point in a coverage simulation.
 */
export interface CoverageSample {
  latitude: number;
  longitude: number;
  distance_m: number;
  azimuth_deg: number;
  received_power_dbm: number;
  viable: boolean;
  cell_area_km2: number;
}

/**
 * Complete result of a spatial coverage simulation (RN-48, RN-49).
 */
export interface CoverageResult {
  id: string;
  access_node_id: string;
  metrics: CoverageMetrics;
  samples: CoverageSample[];
}

/**
 * Aggregated summary metrics for a completed simulation.
 */
export interface SimulationSummary {
  viable_links_pct: number;
  min_margin_db: number;
  mean_margin_db: number;
  fresnel_clear_count: number;
  fresnel_marginal_count: number;
  fresnel_obstructed_count: number;
  coverage_metrics?: CoverageMetrics | null;
}

/**
 * First Fresnel zone clearance metrics for a single link (RN-35).
 */
export interface FresnelAnalysis {
  min_clearance_ratio: number;
  min_clearance_at_m: number;
  max_radius_m: number;
  verdict: FresnelVerdict;
}

/**
 * Path loss quantile entry for a link prediction (RN-36).
 */
export interface PathLossQuantile {
  reliability_pct: number;
  confidence_pct: number;
  loss_db: number;
}

/**
 * Path loss prediction including free-space reference and quantiles (RN-36).
 */
export interface PathLossPrediction {
  free_space_loss_db: number;
  loss_by_quantile: PathLossQuantile[];
}

/**
 * Sampled elevation and Fresnel profile series for a link.
 */
export interface ElevationProfileSeries {
  distances_m: number[];
  terrain_with_curvature_m: number[];
  los_m: number[];
  f1_radius_m: number[];
  series_version: number;
}

/**
 * Evaluated result for a single uplink LPWAN link (RN-34, RN-35, RN-36, RN-42).
 */
export interface LinkResult {
  id: string;
  link_id: string;
  end_node_name: string;
  access_node_name: string;
  distance_m: number;
  fresnel: FresnelAnalysis;
  path_loss: PathLossPrediction;
  received_power_dbm: number;
  sensitivity_used_dbm: number;
  sensitivity_origin: SensitivityOrigin;
  margin_db: number;
  viable: boolean;
  profile_series: ElevationProfileSeries;
}

/**
 * Engine or terrain warning emitted during simulation execution (RN-43).
 */
export interface SimulationWarning {
  id: string;
  link_id: string | null;
  source: string;
  code: string;
  message: string;
}

/**
 * Summary representation of a simulation returned by list and status endpoints.
 */
export interface Simulation {
  id: string;
  owner_id: string;
  scenario_id: string;
  comparison_group_id: string;
  name: string;
  description: string | null;
  status: SimulationStatus;
  technology: Technology;
  propagation_model_id: string;
  snapshot: Record<string, unknown>;
  summary: SimulationSummary | null;
  failure_reason: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

/**
 * Full simulation detail including per-link results and warnings.
 */
export interface SimulationResults extends Simulation {
  link_results: LinkResult[];
  warnings: SimulationWarning[];
  coverage_result?: CoverageResult | null;
}

/**
 * Minimal simulation descriptor used for comparability validation (RN-37).
 */
export interface SimulationSummaryItem {
  id: string;
  comparison_group_id: string;
  status: SimulationStatus;
  propagation_model_id: string;
}

/**
 * Summary entry for a simulation variant in a comparison report.
 */
export interface ComparedSimulationSummary {
  simulation_id: string;
  name: string;
  technology: Technology;
  frequency_mhz: number;
  summary: SimulationSummary;
}

/**
 * Link metrics for a single simulation variant in a comparison row.
 */
export interface ComparedLinkMetric {
  simulation_id: string;
  simulation_name: string;
  technology: Technology;
  path_loss_p50_db: number;
  received_power_dbm: number;
  sensitivity_used_dbm: number;
  margin_db: number;
  viable: boolean;
  fresnel_verdict: FresnelVerdict;
}

/**
 * Side-by-side comparison row for a physical link across variants.
 */
export interface ComparedLinkRow {
  link_key: string;
  end_node_name: string;
  access_node_name: string;
  distance_m: number;
  metrics_by_simulation: ComparedLinkMetric[];
}

/**
 * Full comparison report across completed variant simulations (RN-37).
 */
export interface ComparisonReport {
  comparison_group_id: string;
  propagation_model_id: string;
  simulations: ComparedSimulationSummary[];
  links: ComparedLinkRow[];
}

/**
 * Point in the prepared Fresnel chart series with envelopes in meters (m).
 */
export interface FresnelChartPoint {
  distanceM: number;
  terrainM: number;
  losM: number;
  f1RadiusM: number;
  f1UpperM: number;
  f1LowerM: number;
  f1SixtyUpperM: number;
  f1SixtyLowerM: number;
}

/**
 * Evaluates an uplink radio link budget (RN-34).
 * @param txPowerDbm - End node transmit power, in dBm.
 * @param txGainDbi - End node antenna gain, in dBi.
 * @param rxGainDbi - Access node antenna gain, in dBi.
 * @param pathLossDb - Predicted path loss (p50), in dB.
 * @param sensitivityDbm - Access node receiver sensitivity, in dBm.
 * @returns Received power in dBm, link margin in dB, and viability boolean.
 */
export function evaluateLinkBudget(
  txPowerDbm: number,
  txGainDbi: number,
  rxGainDbi: number,
  pathLossDb: number,
  sensitivityDbm: number,
): { receivedPowerDbm: number; marginDb: number; viable: boolean } {
  const receivedPowerDbm = Number(
    (txPowerDbm + txGainDbi + rxGainDbi - pathLossDb).toFixed(2),
  );
  const marginDb = Number((receivedPowerDbm - sensitivityDbm).toFixed(2));
  return {
    receivedPowerDbm,
    marginDb,
    viable: marginDb >= 0,
  };
}

/**
 * Checks whether a selection of simulations can be compared side by side (RN-37).
 * @param simulations - Selected simulations.
 * @returns Object indicating whether comparison is valid and an optional error code.
 */
export function canCompareSimulations(simulations: SimulationSummaryItem[]): {
  comparable: boolean;
  reasonCode?: string;
} {
  if (simulations.length < 2) {
    return { comparable: false, reasonCode: "MinTwoSimulations" };
  }
  const first = simulations[0];
  for (const sim of simulations) {
    if (sim.status !== "COMPLETED") {
      return { comparable: false, reasonCode: "SimulationNotCompleted" };
    }
    if (sim.comparison_group_id !== first.comparison_group_id) {
      return { comparable: false, reasonCode: "DifferentComparisonGroup" };
    }
    if (sim.propagation_model_id !== first.propagation_model_id) {
      return { comparable: false, reasonCode: "DifferentPropagationModel" };
    }
  }
  return { comparable: true };
}

/**
 * Transforms an ElevationProfileSeries into point series including F1 and 60% F1 envelopes (RN-35).
 * @param series - Sampled elevation profile series from the backend, in meters (m).
 * @returns Array of chart points with terrain, LoS, F1 envelope, and 60% F1 threshold in meters (m).
 */
export function buildFresnelChartSeries(
  series: ElevationProfileSeries,
): FresnelChartPoint[] {
  const n = Math.min(
    series.distances_m.length,
    series.terrain_with_curvature_m.length,
    series.los_m.length,
    series.f1_radius_m.length,
  );
  const points: FresnelChartPoint[] = [];
  for (let i = 0; i < n; i++) {
    const distanceM = series.distances_m[i];
    const terrainM = series.terrain_with_curvature_m[i];
    const losM = series.los_m[i];
    const f1RadiusM = series.f1_radius_m[i];
    points.push({
      distanceM,
      terrainM,
      losM,
      f1RadiusM,
      f1UpperM: Number((losM + f1RadiusM).toFixed(3)),
      f1LowerM: Number((losM - f1RadiusM).toFixed(3)),
      f1SixtyUpperM: Number((losM + 0.6 * f1RadiusM).toFixed(3)),
      f1SixtyLowerM: Number((losM - 0.6 * f1RadiusM).toFixed(3)),
    });
  }
  return points;
}

/**
 * Extracts p10, p50, and p90 path loss values in dB from a PathLossPrediction.
 * @param prediction - PathLossPrediction object from a link result.
 * @returns Object with p10, p50, and p90 path loss values in dB.
 */
export function extractQuantileLosses(prediction: PathLossPrediction): {
  p10Db: number;
  p50Db: number;
  p90Db: number;
} {
  const byRel = new Map<number, number>();
  for (const q of prediction.loss_by_quantile) {
    byRel.set(Math.round(q.reliability_pct), q.loss_db);
  }
  const fallback =
    prediction.loss_by_quantile[0]?.loss_db ?? prediction.free_space_loss_db;
  const p50Db = byRel.get(50) ?? fallback;
  const p10Db = byRel.get(10) ?? p50Db;
  const p90Db = byRel.get(90) ?? p50Db;
  return { p10Db, p50Db, p90Db };
}
