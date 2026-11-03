import { describe, expect, it } from "vitest";
import {
  isBandRangeValid,
  isSpreadingFactorAllowed,
  profileSchema,
  Technology,
} from "./profiles";

describe("AC-02-12 profile rules", () => {
  it("test_ac02_12_spreading_factor_allowed_only_for_lorawan_7_to_12", () => {
    // LoRaWAN requires spreading factor in 7..12
    expect(isSpreadingFactorAllowed(Technology.LORAWAN, 7)).toBe(true);
    expect(isSpreadingFactorAllowed(Technology.LORAWAN, 10)).toBe(true);
    expect(isSpreadingFactorAllowed(Technology.LORAWAN, 12)).toBe(true);

    expect(isSpreadingFactorAllowed(Technology.LORAWAN, 6)).toBe(false);
    expect(isSpreadingFactorAllowed(Technology.LORAWAN, 13)).toBe(false);
    expect(isSpreadingFactorAllowed(Technology.LORAWAN, null)).toBe(false);
    expect(isSpreadingFactorAllowed(Technology.LORAWAN, undefined)).toBe(false);

    // NB-IoT and LTE-M must not have spreading factor
    expect(isSpreadingFactorAllowed(Technology.NB_IOT, null)).toBe(true);
    expect(isSpreadingFactorAllowed(Technology.NB_IOT, undefined)).toBe(true);
    expect(isSpreadingFactorAllowed(Technology.NB_IOT, 7)).toBe(false);

    expect(isSpreadingFactorAllowed(Technology.LTE_M, null)).toBe(true);
    expect(isSpreadingFactorAllowed(Technology.LTE_M, undefined)).toBe(true);
    expect(isSpreadingFactorAllowed(Technology.LTE_M, 10)).toBe(false);
  });

  it("test_ac02_12_band_range_must_be_strictly_increasing", () => {
    expect(isBandRangeValid(902, 928)).toBe(true);
    expect(isBandRangeValid(null, null)).toBe(true);
    expect(isBandRangeValid(undefined, undefined)).toBe(true);

    // Invalid when min >= max
    expect(isBandRangeValid(928, 902)).toBe(false);
    expect(isBandRangeValid(900, 900)).toBe(false);
  });

  it("test_ac02_12_zod_schema_validates_profile_form", () => {
    // Valid LoRaWAN profile
    const validLora = profileSchema.safeParse({
      name: "Mi LoRaWAN",
      technology: Technology.LORAWAN,
      reference_sensitivity_dbm: -130,
      spreading_factor: 10,
      bands: [{ code: "902-928", min_mhz: 902, max_mhz: 928 }],
    });
    expect(validLora.success).toBe(true);

    // Invalid LoRaWAN: missing SF
    const missingSf = profileSchema.safeParse({
      name: "LoRa sin SF",
      technology: Technology.LORAWAN,
      reference_sensitivity_dbm: -130,
      bands: [],
    });
    expect(missingSf.success).toBe(false);

    // Invalid LoRaWAN: SF out of range
    const invalidSf = profileSchema.safeParse({
      name: "LoRa SF13",
      technology: Technology.LORAWAN,
      reference_sensitivity_dbm: -130,
      spreading_factor: 13,
      bands: [],
    });
    expect(invalidSf.success).toBe(false);

    // Valid NB-IoT profile without SF
    const validNbiot = profileSchema.safeParse({
      name: "Mi NB-IoT",
      technology: Technology.NB_IOT,
      reference_sensitivity_dbm: -130,
      bands: [{ code: "B1", min_mhz: null, max_mhz: null }],
    });
    expect(validNbiot.success).toBe(true);

    // Invalid NB-IoT with SF
    const nbiotWithSf = profileSchema.safeParse({
      name: "NB-IoT con SF",
      technology: Technology.NB_IOT,
      reference_sensitivity_dbm: -130,
      spreading_factor: 7,
      bands: [],
    });
    expect(nbiotWithSf.success).toBe(false);

    // Invalid band range
    const invalidBand = profileSchema.safeParse({
      name: "Banda invalida",
      technology: Technology.LORAWAN,
      reference_sensitivity_dbm: -130,
      spreading_factor: 7,
      bands: [{ code: "Inv", min_mhz: 950, max_mhz: 900 }],
    });
    expect(invalidBand.success).toBe(false);
  });
});

