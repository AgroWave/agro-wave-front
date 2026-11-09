import { describe, expect, it } from "vitest";
import {
  doesDemCoverArea,
  groupLinksByStar,
  hasValidAntennaHeight,
  hasValidLinkDistance,
  isNodeInsideArea,
  type AccessNode,
  type EndNode,
  type Link,
} from "./scenarios";

describe("scenarios domain rules (AC-04-03)", () => {
  const sampleBounds = {
    south: 4.58,
    west: -74.12,
    north: 4.66,
    east: -74.04,
  };

  it("test_ac04_03_validates_minimum_antenna_height_05m (RN-20, AC-10)", () => {
    expect(hasValidAntennaHeight(0.5)).toBe(true);
    expect(hasValidAntennaHeight(15.0)).toBe(true);
    expect(hasValidAntennaHeight(0.49)).toBe(false);
    expect(hasValidAntennaHeight(0)).toBe(false);
  });

  it("test_ac04_03_validates_minimum_link_distance_1km (RN-19, AC-09)", () => {
    // ~0.2 km apart -> false
    expect(hasValidLinkDistance(4.6, -74.1, 4.601, -74.1)).toBe(false);
    // ~2.5 km apart -> true
    expect(hasValidLinkDistance(4.6, -74.1, 4.62, -74.08)).toBe(true);
  });

  it("test_ac04_03_validates_node_inside_study_area (RN-21, AC-11)", () => {
    expect(isNodeInsideArea(4.62, -74.08, sampleBounds)).toBe(true);
    expect(isNodeInsideArea(4.7, -74.08, sampleBounds)).toBe(false);
  });

  it("test_ac04_03_validates_dem_coverage_over_study_area (RN-26, AC-05)", () => {
    const coveringDem = {
      south: 4.55,
      west: -74.15,
      north: 4.7,
      east: -74.0,
    };
    const partialDem = {
      south: 4.6,
      west: -74.1,
      north: 4.64,
      east: -74.06,
    };
    expect(doesDemCoverArea(coveringDem, sampleBounds)).toBe(true);
    expect(doesDemCoverArea(partialDem, sampleBounds)).toBe(false);
  });

  it("test_ac04_03_groups_links_by_access_node_star (AC-12)", () => {
    const accessNodes: AccessNode[] = [
      {
        id: "an-1",
        name: "Gateway Norte",
        lat: 4.6,
        lng: -74.1,
        height_agl_m: 15,
        antenna_ref: "Dragino",
        antenna_gain_dbi: 5.5,
        polarization: "VERTICAL",
        sensitivity_dbm: -137,
        sensitivity_origin: "REFERENCE_TO_VERIFY",
      },
    ];
    const endNodes: EndNode[] = [
      {
        id: "en-1",
        name: "Sensor Humedad 1",
        lat: 4.62,
        lng: -74.08,
        height_agl_m: 2,
        antenna_ref: "Taoglas",
        antenna_gain_dbi: 1.1,
        polarization: "VERTICAL",
        tx_power_nominal_dbm: 20,
        tx_power_tolerance_db: 1.5,
        source_template_id: null,
      },
      {
        id: "en-2",
        name: "Sensor Humedad 2",
        lat: 4.63,
        lng: -74.07,
        height_agl_m: 2,
        antenna_ref: "Taoglas",
        antenna_gain_dbi: 1.1,
        polarization: "VERTICAL",
        tx_power_nominal_dbm: 20,
        tx_power_tolerance_db: 1.5,
        source_template_id: null,
      },
    ];
    const links: Link[] = [
      { id: "lk-1", end_node_id: "en-1", access_node_id: "an-1" },
      { id: "lk-2", end_node_id: "en-2", access_node_id: "an-1" },
    ];

    const stars = groupLinksByStar(accessNodes, endNodes, links);
    expect(stars).toHaveLength(1);
    expect(stars[0].title).toBe("Estrella de Gateway Norte");
    expect(stars[0].items).toHaveLength(2);
    expect(stars[0].items[0].distanceKm).toBeGreaterThanOrEqual(1.0);
  });
});

