import { describe, expect, it } from "vitest";
import {
  boundsDimensionsKm,
  createDemSchema,
  geodesicDistanceKm,
  hasMinimumDimensions,
  isWithinContinentalColombia,
} from "./terrain";

describe("Terrain domain functions", () => {
  it("computes geodesic distance correctly (AC-03-03)", () => {
    // 0.01 degrees of latitude is ~1.11 km
    const dist = geodesicDistanceKm(4.60, -74.08, 4.61, -74.08);
    expect(dist).toBeGreaterThan(1.0);
    expect(dist).toBeLessThan(1.2);
  });

  it("calculates bounding box dimensions in kilometers", () => {
    const bounds = {
      south: 4.85,
      west: -74.05,
      north: 4.95,
      east: -73.95,
    };
    const { widthKm, heightKm } = boundsDimensionsKm(bounds);
    expect(widthKm).toBeGreaterThan(10.0);
    expect(heightKm).toBeGreaterThan(10.0);
  });

  it("rejects bounding box smaller than 1.5 km per side (RN-13, AC-03-03)", () => {
    const tinyBounds = {
      south: 4.600,
      west: -74.100,
      north: 4.601,
      east: -74.099,
    };
    expect(hasMinimumDimensions(tinyBounds)).toBe(false);

    const validBounds = {
      south: 4.60,
      west: -74.10,
      north: 4.62,
      east: -74.08,
    };
    expect(hasMinimumDimensions(validBounds)).toBe(true);
  });

  it("validates continental Colombia boundaries (RN-12, AC-03-02)", () => {
    // Valid continental Colombia
    expect(
      isWithinContinentalColombia({
        south: 5.5,
        west: -73.4,
        north: 5.6,
        east: -73.3,
      })
    ).toBe(true);

    // San Andrés (oceanic territory)
    expect(
      isWithinContinentalColombia({
        south: 12.50,
        west: -81.75,
        north: 12.60,
        east: -81.65,
      })
    ).toBe(false);

    // Europe / Paris
    expect(
      isWithinContinentalColombia({
        south: 48.8,
        west: 2.3,
        north: 48.9,
        east: 2.4,
      })
    ).toBe(false);
  });

  it("validates createDemSchema with Zod", () => {
    const valid = {
      name: "Sabana Centro",
      description: "Cultivo",
      south: 4.85,
      west: -74.05,
      north: 4.95,
      east: -73.95,
    };
    expect(createDemSchema.safeParse(valid).success).toBe(true);

    const invalidTooSmall = {
      ...valid,
      south: 4.8500,
      north: 4.8501,
      west: -74.0500,
      east: -74.0499,
    };
    expect(createDemSchema.safeParse(invalidTooSmall).success).toBe(false);
  });
});

