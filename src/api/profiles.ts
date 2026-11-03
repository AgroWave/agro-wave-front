import type { LpwanProfile, NodeTemplate, Technology } from "../domain/profiles";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CreateProfilePayload {
  name: string;
  technology: Technology;
  reference_sensitivity_dbm: number;
  bands: Array<{
    code: string;
    min_mhz?: number | null;
    max_mhz?: number | null;
  }>;
  spreading_factor?: number | null;
}

export interface UpdateProfilePayload {
  name?: string;
  reference_sensitivity_dbm?: number;
  bands?: Array<{
    code: string;
    min_mhz?: number | null;
    max_mhz?: number | null;
  }>;
  spreading_factor?: number | null;
}

/**
 * Handles profile fetch responses and parses standardized API errors.
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

export interface ProfileFilters {
  technology?: string;
  owner?: string;
}

/**
 * Lists predefined profiles and profiles owned by current user.
 * @param token - Bearer JWT access token.
 * @param filters - Optional technology and owner filter settings.
 * @returns List of accessible LPWAN profiles.
 */
export async function listProfiles(
  token: string,
  filters?: ProfileFilters
): Promise<LpwanProfile[]> {
  const params = new URLSearchParams();
  if (filters?.technology) params.append("technology", filters.technology);
  if (filters?.owner) params.append("owner", filters.owner);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`/api/v1/profiles${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<LpwanProfile[]>(response);
}

/**
 * Creates a new custom LPWAN profile.
 * @param token - Bearer JWT access token.
 * @param payload - Profile creation attributes.
 * @returns Created LPWAN profile.
 */
export async function createProfile(
  token: string,
  payload: CreateProfilePayload
): Promise<LpwanProfile> {
  const response = await fetch("/api/v1/profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<LpwanProfile>(response);
}

/**
 * Updates an owned LPWAN profile.
 * @param token - Bearer JWT access token.
 * @param profileId - Profile identifier UUID.
 * @param payload - Updated attributes.
 * @returns Updated profile.
 */
export async function updateProfile(
  token: string,
  profileId: string,
  payload: UpdateProfilePayload
): Promise<LpwanProfile> {
  const response = await fetch(`/api/v1/profiles/${profileId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<LpwanProfile>(response);
}

/**
 * Duplicates a predefined or owned profile into a custom profile.
 * @param token - Bearer JWT access token.
 * @param profileId - Source profile identifier.
 * @param name - Optional custom name for duplicate.
 * @returns Duplicated profile.
 */
export async function duplicateProfile(
  token: string,
  profileId: string,
  name?: string
): Promise<LpwanProfile> {
  const response = await fetch(`/api/v1/profiles/${profileId}/duplicate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(name ? { name } : {}),
  });
  return handleResponse<LpwanProfile>(response);
}

/**
 * Deletes an owned LPWAN profile.
 * @param token - Bearer JWT access token.
 * @param profileId - Profile identifier UUID.
 */
export async function deleteProfile(token: string, profileId: string): Promise<void> {
  const response = await fetch(`/api/v1/profiles/${profileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  await handleResponse<void>(response);
}

/**
 * Lists reference node templates matching a profile's technology.
 * @param token - Bearer JWT access token.
 * @param profileId - Profile identifier UUID.
 * @returns List of equipment templates.
 */
export async function listNodeTemplates(
  token: string,
  profileId: string
): Promise<NodeTemplate[]> {
  const response = await fetch(`/api/v1/profiles/${profileId}/node-templates`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<NodeTemplate[]>(response);
}
