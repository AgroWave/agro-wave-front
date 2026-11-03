import { z } from "zod";

/**
 * Supported LPWAN radio technologies.
 */
export const Technology = {
  LORAWAN: "LORAWAN",
  NB_IOT: "NB_IOT",
  LTE_M: "LTE_M",
} as const;

export type Technology = (typeof Technology)[keyof typeof Technology];

/**
 * Role of a reference node template.
 */
export const NodeRole = {
  END_NODE: "END_NODE",
  ACCESS_NODE: "ACCESS_NODE",
} as const;

export type NodeRole = (typeof NodeRole)[keyof typeof NodeRole];

/**
 * Frequency band definition.
 */
export interface Band {
  code: string;
  min_mhz: number | null;
  max_mhz: number | null;
}

/**
 * Reference antenna specification.
 */
export interface Antenna {
  reference: string | null;
  gain_dbi: number | null;
  polarization: string | null;
}

/**
 * Transmitter power specification in dBm.
 */
export interface TxPower {
  nominal_dbm: number;
  tolerance_db: number;
}

/**
 * Reference equipment template.
 */
export interface NodeTemplate {
  id: string;
  technology: Technology;
  role: NodeRole;
  name: string;
  module_ref: string | null;
  antenna: Antenna;
  tx_power: TxPower | null;
}

/**
 * LPWAN radio profile domain model.
 */
export interface LpwanProfile {
  id: string;
  name: string;
  technology: Technology;
  reference_sensitivity_dbm: number;
  bands: Band[];
  spreading_factor: number | null;
  owner_id: string | null;
  is_predefined: boolean;
  created_at: string;
}

/**
 * Checks if a spreading factor is valid for a given technology (RN-07).
 *
 * For LoRaWAN, spreading factor must be an integer between 7 and 12.
 * For NB-IoT and LTE-M, spreading factor must be absent (null or undefined).
 * @param technology - Target LPWAN technology.
 * @param spreadingFactor - LoRaWAN spreading factor (7..12) or null/undefined.
 * @returns `true` if allowed according to RN-07.
 */
export function isSpreadingFactorAllowed(
  technology: Technology,
  spreadingFactor: number | null | undefined
): boolean {
  if (technology === Technology.LORAWAN) {
    if (spreadingFactor === null || spreadingFactor === undefined) {
      return false;
    }
    return Number.isInteger(spreadingFactor) && spreadingFactor >= 7 && spreadingFactor <= 12;
  }
  return spreadingFactor === null || spreadingFactor === undefined;
}

/**
 * Verifies that the band frequency range is strictly increasing.
 * @param minMhz - Lower frequency limit in MHz.
 * @param maxMhz - Upper frequency limit in MHz.
 * @returns `true` if limits are empty or minMhz is strictly less than maxMhz.
 */
export function isBandRangeValid(
  minMhz: number | null | undefined,
  maxMhz: number | null | undefined
): boolean {
  if (minMhz !== null && minMhz !== undefined && maxMhz !== null && maxMhz !== undefined) {
    return minMhz < maxMhz;
  }
  return true;
}

/**
 * Frequency band schema validating increasing frequency range.
 */
export const bandSchema = z
  .object({
    code: z.string().min(1, "El código de banda es requerido"),
    min_mhz: z.number().nullable().optional(),
    max_mhz: z.number().nullable().optional(),
  })
  .refine((data) => isBandRangeValid(data.min_mhz, data.max_mhz), {
    message: "La frecuencia mínima debe ser menor que la máxima",
    path: ["min_mhz"],
  });

/**
 * Form validation schema for creating and editing LPWAN profiles (RN-07, AC-02-12).
 */
export const profileSchema = z
  .object({
    name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
    technology: z.enum([Technology.LORAWAN, Technology.NB_IOT, Technology.LTE_M]),
    reference_sensitivity_dbm: z.number({
      invalid_type_error: "La sensibilidad debe ser un número",
    }),
    spreading_factor: z.number().nullable().optional(),
    bands: z.array(bandSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.technology === Technology.LORAWAN) {
      if (
        data.spreading_factor === null ||
        data.spreading_factor === undefined ||
        !Number.isInteger(data.spreading_factor) ||
        data.spreading_factor < 7 ||
        data.spreading_factor > 12
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "LoRaWAN requiere Spreading Factor entre 7 y 12 (RN-07)",
          path: ["spreading_factor"],
        });
      }
    } else {
      if (data.spreading_factor !== null && data.spreading_factor !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Spreading Factor solo está permitido para LoRaWAN (RN-07)",
          path: ["spreading_factor"],
        });
      }
    }
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
