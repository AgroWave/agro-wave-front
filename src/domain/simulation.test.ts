/**
 * Unit tests for pure simulation domain rules and chart series helpers (AC-05-04, RN-34, RN-35, RN-37).
 */

import { describe, expect, it } from "vitest";
import {
  buildFresnelChartSeries,
  canCompareSimulations,
  evaluateLinkBudget,
  type SimulationSummaryItem,
} from "./simulation";

describe("simulation domain rules (AC-05-04)", () => {
  it("test_ac20_ui_evaluates_link_budget_and_viability", () => {
    const viable = evaluateLinkBudget(21, 2, 3, 154, -130);
    expect(viable.receivedPowerDbm).toBeCloseTo(-128, 2);
    expect(viable.marginDb).toBeCloseTo(2, 2);
    expect(viable.viable).toBe(true);

    const nonViable = evaluateLinkBudget(20, 2, 3, 160, -130);
    expect(nonViable.receivedPowerDbm).toBeCloseTo(-135, 2);
    expect(nonViable.marginDb).toBeCloseTo(-5, 2);
    expect(nonViable.viable).toBe(false);
  });

  it("test_ac23_ac24_ui_validates_simulation_comparability", () => {
    const sim1: SimulationSummaryItem = {
      id: "sim-1",
      comparison_group_id: "group-a",
      status: "COMPLETED",
      propagation_model_id: "LONGLEY_RICE",
    };
    const sim2: SimulationSummaryItem = {
      id: "sim-2",
      comparison_group_id: "group-a",
      status: "COMPLETED",
      propagation_model_id: "LONGLEY_RICE",
    };
    const simOtherGroup: SimulationSummaryItem = {
      id: "sim-3",
      comparison_group_id: "group-b",
      status: "COMPLETED",
      propagation_model_id: "LONGLEY_RICE",
    };
    const simRunning: SimulationSummaryItem = {
      id: "sim-4",
      comparison_group_id: "group-a",
      status: "RUNNING",
      propagation_model_id: "LONGLEY_RICE",
    };

    expect(canCompareSimulations([sim1]).comparable).toBe(false);
    expect(canCompareSimulations([sim1, sim2]).comparable).toBe(true);
    expect(canCompareSimulations([sim1, simOtherGroup]).comparable).toBe(false);
    expect(canCompareSimulations([sim1, simRunning]).comparable).toBe(false);
  });

  it("test_ac21_ui_builds_fresnel_chart_series_with_60pct_envelope", () => {
    const points = buildFresnelChartSeries({
      distances_m: [0, 800, 1600],
      terrain_with_curvature_m: [2600, 2610, 2620],
      los_m: [2602, 2615, 2628],
      f1_radius_m: [0, 10, 0],
      series_version: 1,
    });

    expect(points).toHaveLength(3);
    expect(points[1].f1UpperM).toBeCloseTo(2625, 2);
    expect(points[1].f1LowerM).toBeCloseTo(2605, 2);
    expect(points[1].f1SixtyLowerM).toBeCloseTo(2609, 2);
  });
});

