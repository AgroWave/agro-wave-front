import type { Bounds, Dem } from "../domain/terrain";

/**
 * Standardized API error shape.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Payload for requesting a DEM download.
 */
export interface CreateDemPayload {
  name: string;
  description?: string | null;
  bounds: Bounds;
}

/**
 * Payload for updating DEM metadata.
 */
export interface UpdateDemPayload {
  name?: string;
  description?: string | null;
}

/**
 * Handles DEM fetch responses and parses standardized API errors.
 * @param response - Fetch response.
 * @returns Parsed response body.
 */
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
 * Lists DEMs owned by the authenticated user.
 * @param token - Bearer JWT access token.
 * @param search - Optional name/description filter.
 * @returns Array of user-owned DEM entities.
 */
export async function listDems(token: string, search?: string): Promise<Dem[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`/api/v1/dems${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<Dem[]>(response);
}

/**
 * Requests a new DEM download asynchronously.
 * @param token - Bearer JWT access token.
 * @param payload - Bounding box and metadata.
 * @returns Created DEM in DOWNLOADING status.
 */
export async function createDem(
  token: string,
  payload: CreateDemPayload
): Promise<Dem> {
  const response = await fetch("/api/v1/dems", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Dem>(response);
}

/**
 * Retrieves a single DEM by identifier.
 * @param token - Bearer JWT access token.
 * @param demId - DEM identifier UUID.
 * @returns Dem entity.
 */
export async function getDem(token: string, demId: string): Promise<Dem> {
  const response = await fetch(`/api/v1/dems/${demId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<Dem>(response);
}

/**
 * Updates metadata of an existing DEM.
 * @param token - Bearer JWT access token.
 * @param demId - DEM identifier UUID.
 * @param payload - Updated name and description.
 * @returns Updated Dem entity.
 */
export async function updateDem(
  token: string,
  demId: string,
  payload: UpdateDemPayload
): Promise<Dem> {
  const response = await fetch(`/api/v1/dems/${demId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Dem>(response);
}

/**
 * Deletes a DEM from database and object storage.
 * @param token - Bearer JWT access token.
 * @param demId - DEM identifier UUID.
 */
export async function deleteDem(token: string, demId: string): Promise<void> {
  const response = await fetch(`/api/v1/dems/${demId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  await handleResponse<void>(response);
}
