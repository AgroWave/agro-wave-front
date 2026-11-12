import type { Technology } from "../domain/scenarios";
import type {
  ComparisonReport,
  Simulation,
  SimulationResults,
  SimulationStatus,
} from "../domain/simulation";
import type { ApiError } from "./scenarios";

/**
 * Query filters for listing simulations.
 */
export interface ListSimulationsFilters {
  q?: string;
  technology?: Technology | "";
  status?: SimulationStatus | "";
  comparison_group_id?: string;
  sort?: "newest" | "oldest" | "name";
}

/**
 * Payload for creating a simulation from a scenario (UC-SI-01).
 */
export interface CreateSimulationPayload {
  scenario_id: string;
  name: string;
  description?: string | null;
}

/**
 * Payload for updating simulation metadata (UC-SI-04).
 */
export interface UpdateSimulationPayload {
  name?: string | null;
  description?: string | null;
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
 * Lists simulations owned by the authenticated user.
 * @param token - Bearer JWT access token.
 * @param filters - Optional search, technology, status, and sort filters.
 * @returns Array of Simulation summaries.
 */
export async function listSimulations(
  token: string,
  filters?: ListSimulationsFilters,
): Promise<Simulation[]> {
  const params = new URLSearchParams();
  if (filters?.q) params.set("q", filters.q);
  if (filters?.technology) params.set("technology", filters.technology);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.comparison_group_id) {
    params.set("comparison_group_id", filters.comparison_group_id);
  }
  if (filters?.sort) params.set("sort", filters.sort);

  const qs = params.toString();
  const url = qs ? `/api/v1/simulations?${qs}` : "/api/v1/simulations";
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Simulation[]>(response);
}

/**
 * Creates a new simulation in CREATED state capturing the scenario snapshot (UC-SI-01).
 * @param token - Bearer JWT access token.
 * @param payload - Scenario identifier, name, and optional description.
 * @returns Created Simulation aggregate.
 */
export async function createSimulation(
  token: string,
  payload: CreateSimulationPayload,
): Promise<Simulation> {
  const response = await fetch("/api/v1/simulations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Simulation>(response);
}

/**
 * Starts execution of a CREATED simulation in the background (UC-SI-02).
 * @param token - Bearer JWT access token.
 * @param simulationId - Simulation UUID.
 * @returns Updated Simulation in RUNNING state.
 */
export async function runSimulation(
  token: string,
  simulationId: string,
): Promise<Simulation> {
  const response = await fetch(`/api/v1/simulations/${simulationId}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Simulation>(response);
}

/**
 * Retries a FAILED simulation in the background (UC-SI-02).
 * @param token - Bearer JWT access token.
 * @param simulationId - Simulation UUID.
 * @returns Updated Simulation in RUNNING state.
 */
export async function retrySimulation(
  token: string,
  simulationId: string,
): Promise<Simulation> {
  const response = await fetch(`/api/v1/simulations/${simulationId}/retry`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Simulation>(response);
}

/**
 * Retrieves a simulation and its detailed per-link results, profiles, and warnings.
 * @param token - Bearer JWT access token.
 * @param simulationId - Simulation UUID.
 * @returns Full SimulationResults payload.
 */
export async function getSimulationResults(
  token: string,
  simulationId: string,
): Promise<SimulationResults> {
  const response = await fetch(`/api/v1/simulations/${simulationId}/results`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<SimulationResults>(response);
}

/**
 * Updates the name and description of a simulation (UC-SI-04).
 * @param token - Bearer JWT access token.
 * @param simulationId - Simulation UUID.
 * @param payload - Updated name and description.
 * @returns Updated Simulation summary.
 */
export async function updateSimulation(
  token: string,
  simulationId: string,
  payload: UpdateSimulationPayload,
): Promise<Simulation> {
  const response = await fetch(`/api/v1/simulations/${simulationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Simulation>(response);
}

/**
 * Deletes a simulation unless it is currently RUNNING (UC-SI-04, RN-33).
 * @param token - Bearer JWT access token.
 * @param simulationId - Simulation UUID.
 */
export async function deleteSimulation(
  token: string,
  simulationId: string,
): Promise<void> {
  const response = await fetch(`/api/v1/simulations/${simulationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await handleResponse<void>(response);
}

/**
 * Compares two or more COMPLETED simulations of the same group and model (UC-SI-03, RN-37).
 * @param token - Bearer JWT access token.
 * @param simulationIds - Array of simulation UUIDs to compare.
 * @returns ComparisonReport with side-by-side summary and link metrics.
 */
export async function compareSimulations(
  token: string,
  simulationIds: string[],
): Promise<ComparisonReport> {
  const idsParam = encodeURIComponent(simulationIds.join(","));
  const response = await fetch(`/api/v1/simulations/compare?ids=${idsParam}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ComparisonReport>(response);
}

/**
 * Downloads coverage and DSR metrics data in Radio Mobile calibration format (UC-CO-04, AC-29).
 * Requests the spatial sampling dataset with Bearer token authentication and returns
 * the response as a downloadable Blob.
 * @param token - Bearer JWT access token.
 * @param simulationId - Simulation UUID.
 * @returns Blob containing the JSON coverage export dataset.
 */
export async function exportCoverageData(
  token: string,
  simulationId: string,
): Promise<Blob> {
  const response = await fetch(
    `/api/v1/simulations/${simulationId}/coverage/export`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string;
      detail?: string;
    };
    throw new Error(
      errorData.message ||
        errorData.detail ||
        "Error al exportar datos de cobertura",
    );
  }
  return response.blob();
}


