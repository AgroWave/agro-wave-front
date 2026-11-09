import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { t } from "../../i18n";

const mockUser = {
  id: "user-123",
  name: "Juan Pérez",
  email: "juan@example.com",
  role: "USER",
  email_confirmed: true,
};

const mockDems = [
  {
    id: "dem-001",
    name: "Sabana Centro Bogotá",
    description: "Zona de flores",
    bounds: { south: 4.85, west: -74.05, north: 4.95, east: -73.95 },
    status: "AVAILABLE",
    resolution_m: 30.0,
    object_key: "dems/dem-001.tif",
    size_bytes: 5242880,
    failure_reason: null,
    created_at: "2026-11-03T10:00:00Z",
    updated_at: "2026-11-03T10:05:00Z",
  },
  {
    id: "dem-002",
    name: "Valle del Cauca",
    description: null,
    bounds: { south: 3.40, west: -76.50, north: 3.50, east: -76.40 },
    status: "DOWNLOADING",
    resolution_m: 30.0,
    object_key: null,
    size_bytes: null,
    failure_reason: null,
    created_at: "2026-11-03T11:00:00Z",
    updated_at: "2026-11-03T11:00:00Z",
  },
  {
    id: "dem-003",
    name: "Boyacá Páramo",
    description: "Zona alta",
    bounds: { south: 5.50, west: -73.40, north: 5.60, east: -73.30 },
    status: "FAILED",
    resolution_m: 30.0,
    object_key: null,
    size_bytes: null,
    failure_reason: "Network timeout connecting to Copernicus",
    created_at: "2026-11-03T11:30:00Z",
    updated_at: "2026-11-03T11:31:00Z",
  },
];

describe("AC-03-14 DEM catalog listing and actions", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("agrowave_token", "test-token");
    sessionStorage.setItem("agrowave_user", JSON.stringify(mockUser));
    window.history.pushState({}, "", "/dem");
    vi.restoreAllMocks();
  });

  it("test_ac03_14_renders_dem_list_with_statuses_and_dimensions", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes("/api/v1/dems")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockDems,
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    render(<App />);

    // Wait for DEM list to load
    await waitFor(() => {
      expect(screen.getByText("Sabana Centro Bogotá")).toBeInTheDocument();
      expect(screen.getByText("Valle del Cauca")).toBeInTheDocument();
      expect(screen.getByText("Boyacá Páramo")).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText(t("dem.status_available"))).toBeInTheDocument();
    expect(screen.getByText(t("dem.status_downloading"))).toBeInTheDocument();
    expect(screen.getByText(t("dem.status_failed"))).toBeInTheDocument();

    // Check resolution and failure reason
    expect(screen.getByText("Network timeout connecting to Copernicus")).toBeInTheDocument();
    expect(screen.getAllByText(/30 m/).length).toBeGreaterThan(0);
  });

  it("test_ac03_13_opens_download_modal_and_submits", async () => {
    let createdPayload: unknown = null;
    vi.spyOn(global, "fetch").mockImplementation(async (url, init) => {
      const u = url.toString();
      if (u.includes("/api/v1/dems") && init?.method === "POST") {
        createdPayload = JSON.parse(init.body as string);
        return {
          ok: true,
          status: 202,
          json: async () => ({
            ...mockDems[0],
            id: "dem-new",
            name: "Nuevo DEM",
            status: "DOWNLOADING",
          }),
        } as Response;
      }
      if (u.includes("/api/v1/dems")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockDems,
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Sabana Centro Bogotá")).toBeInTheDocument();
    });

    // Click "Descargar DEM" button
    const downloadBtn = screen.getByRole("button", { name: new RegExp(t("dem.download_button"), "i") });
    fireEvent.click(downloadBtn);

    // Modal title visible
    expect(screen.getByText(t("dem.download_modal_title"))).toBeInTheDocument();

    // Fill in DEM name
    const nameInput = screen.getByPlaceholderText(t("dem.name_placeholder"));
    fireEvent.change(nameInput, { target: { value: "Nuevo Terreno Meta" } });

    // Submit download form
    const submitBtn = screen.getByRole("button", { name: new RegExp(t("dem.start_download"), "i") });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createdPayload).not.toBeNull();
    });

    expect(createdPayload).toMatchObject({
      name: "Nuevo Terreno Meta",
    });
  });
});

