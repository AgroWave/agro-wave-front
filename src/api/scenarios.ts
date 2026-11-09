import type {
  AccessNode,
  EndNode,
  Link,
  PropagationSetup,
  Scenario,
  ScenarioValidationResult,
} from "../domain/scenarios";
import type { Bounds } from "../domain/terrain";

/**
 * Standardized API error shape.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Payload for creating or updating a scenario.
 */
export interface SaveScenarioPayload {
  name: string;
  description?: string | null;
  bounds: Bounds;
  dem_id?: string | null;
  profile_id?: string | null;
  band_code?: string | null;
  frequency_mhz?: number | null;
  access_nodes: AccessNode[];
  end_nodes: EndNode[];
  links: Link[];
  propagation_setup?: PropagationSetup | null;
}

/**
 * Payload for creating a technology variant of a scenario (UC-SC-04, RN-29).
 */
export interface CreateScenarioVariantPayload {
  target_profile_id: string;
  band_code?: string | null;
  frequency_mhz?: number | null;
  name?: string | null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: ApiError = {
      code: data.code || `HTTP_${response.status}`,
      message: data.message || data.detail || "Error en la petición",
      details: data.details,
    };
    throw error;
  }
  return data as T;
}

/**
 * Lists all scenarios owned by the authenticated user.
 * @param token - Bearer JWT access token.
 * @returns Array of user-owned Scenario aggregates.
 */
export async function listScenarios(token: string): Promise<Scenario[]> {
  const response = await fetch("/api/v1/scenarios", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<Scenario[]>(response);
}

/**
 * Retrieves a single scenario by identifier.
 * @param token - Bearer JWT access token.
 * @param scenarioId - Scenario identifier UUID.
 * @returns Scenario aggregate.
 */
export async function getScenario(
  token: string,
  scenarioId: string
): Promise<Scenario> {
  const response = await fetch(`/api/v1/scenarios/${scenarioId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<Scenario>(response);
}

/**
 * Creates and persists a new scenario.
 * @param token - Bearer JWT access token.
 * @param payload - Scenario creation payload.
 * @returns Persisted Scenario aggregate.
 */
export async function createScenario(
  token: string,
  payload: SaveScenarioPayload
): Promise<Scenario> {
  const response = await fetch("/api/v1/scenarios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Scenario>(response);
}

/**
 * Updates an existing scenario.
 * @param token - Bearer JWT access token.
 * @param scenarioId - Scenario identifier UUID.
 * @param payload - Updated scenario payload.
 * @returns Updated Scenario aggregate.
 */
export async function updateScenario(
  token: string,
  scenarioId: string,
  payload: SaveScenarioPayload
): Promise<Scenario> {
  const response = await fetch(`/api/v1/scenarios/${scenarioId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Scenario>(response);
}

/**
 * Duplicates an existing scenario with a new comparison_group_id (UC-SC-03).
 * @param token - Bearer JWT access token.
 * @param scenarioId - Source scenario identifier UUID.
 * @param name - Optional name for the duplicated scenario.
 * @returns Duplicated Scenario aggregate.
 */
export async function duplicateScenario(
  token: string,
  scenarioId: string,
  name?: string
): Promise<Scenario> {
  const response = await fetch(`/api/v1/scenarios/${scenarioId}/duplicate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(name ? { name } : {}),
  });
  return handleResponse<Scenario>(response);
}

/**
 * Creates a technology variant sharing the source comparison_group_id (UC-SC-04, RN-29).
 * @param token - Bearer JWT access token.
 * @param scenarioId - Source scenario identifier UUID.
 * @param payload - Target profile, band, frequency, and optional name.
 * @returns Created Scenario variant.
 */
export async function createScenarioVariant(
  token: string,
  scenarioId: string,
  payload: CreateScenarioVariantPayload
): Promise<Scenario> {
  const response = await fetch(`/api/v1/scenarios/${scenarioId}/variants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Scenario>(response);
}

/**
 * Validates whether a scenario satisfies all preconditions to run a simulation (RN-31, AC-16).
 * @param token - Bearer JWT access token.
 * @param scenarioId - Scenario identifier UUID.
 * @returns Validation result with simulable flag and blocking causes.
 */
export async function validateScenario(
  token: string,
  scenarioId: string
): Promise<ScenarioValidationResult> {
  const response = await fetch(`/api/v1/scenarios/${scenarioId}/validate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<ScenarioValidationResult>(response);
}

/**
 * Deletes a scenario owned by the authenticated user (UC-SC-06, RN-30).
 * @param token - Bearer JWT access token.
 * @param scenarioId - Scenario identifier UUID.
 */
export async function deleteScenario(
  token: string,
  scenarioId: string
): Promise<void> {
  const response = await fetch(`/api/v1/scenarios/${scenarioId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  await handleResponse<void>(response);
}

