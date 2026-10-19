/**
 * Represents the health status response returned by the backend.
 */
export interface HealthStatus {
  status: string;
  database: string;
}

/**
 * Fetches the application health status from the API.
 * @returns A promise resolving to the HealthStatus payload.
 */
export async function getHealth(): Promise<HealthStatus> {
  const response = await fetch("/api/v1/health");
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return response.json();
}
