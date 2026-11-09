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

const mockProfiles = [
  {
    id: "prof-lora",
    name: "LoRaWAN SF12",
    technology: "LORAWAN",
    reference_sensitivity_dbm: -137.0,
    bands: [{ code: "US915", min_mhz: 902.0, max_mhz: 928.0 }],
    spreading_factor: 12,
    owner_id: null,
    is_predefined: true,
    created_at: "2026-11-01T10:00:00Z",
  },
  {
    id: "prof-nbiot",
    name: "NB-IoT Cat-NB1",
    technology: "NB_IOT",
    reference_sensitivity_dbm: -141.0,
    bands: [{ code: "B28", min_mhz: 703.0, max_mhz: 748.0 }],
    spreading_factor: null,
    owner_id: null,
    is_predefined: true,
    created_at: "2026-11-01T10:00:00Z",
  },
];

const mockScenarios = [
  {
    id: "sc-001",
    owner_id: "user-123",
    name: "Finca El Rosal LoRaWAN",
    description: "Despliegue de sensores en invernadero",
    comparison_group_id: "cg-11112222",
    bounds: { south: 4.58, west: -74.12, north: 4.64, east: -74.06 },
    terrain_ref: {
      dem_id: "dem-001",
      window: { south: 4.58, west: -74.12, north: 4.64, east: -74.06 },
    },
    radio_config: {
      profile_id: "prof-lora",
      technology: "LORAWAN",
      band_code: "US915",
      frequency_mhz: 915.0,
    },
    access_nodes: [
      {
        id: "an-1",
        name: "Gateway Norte",
        lat: 4.6,
        lng: -74.1,
        height_agl_m: 15.0,
        antenna_ref: "Dragino",
        antenna_gain_dbi: 5.5,
        polarization: "VERTICAL",
        sensitivity_dbm: -137.0,
        sensitivity_origin: "REFERENCE_TO_VERIFY",
      },
    ],
    end_nodes: [
      {
        id: "en-1",
        name: "Sensor Humedad 1",
        lat: 4.62,
        lng: -74.08,
        height_agl_m: 2.0,
        antenna_ref: "Taoglas",
        antenna_gain_dbi: 1.1,
        polarization: "VERTICAL",
        tx_power_nominal_dbm: 20.0,
        tx_power_tolerance_db: 1.5,
        source_template_id: null,
      },
    ],
    links: [{ id: "lk-1", end_node_id: "en-1", access_node_id: "an-1" }],
    propagation_setup: {
      model_id: "LONGLEY_RICE",
      schema_version: 1,
      parameters: {
        ens0: 314.0,
        ipol: 1,
        eps: 15.0,
        sgm: 0.005,
        klim: 5,
        mdvar: 11,
        qc: 50.0,
        qr: [10.0, 50.0, 90.0],
      },
    },
    created_at: "2026-11-09T10:00:00Z",
    updated_at: "2026-11-09T10:05:00Z",
  },
];

describe("AC-04-04 Scenarios catalog and editor views", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("agrowave_token", "test-token");
    sessionStorage.setItem("agrowave_user", JSON.stringify(mockUser));
    window.history.pushState({}, "", "/scenarios");
    vi.restoreAllMocks();
  });

  it("test_ac04_04_renders_scenarios_catalog_and_opens_variant_modal", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes("/api/v1/scenarios")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockScenarios,
        } as Response;
      }
      if (u.includes("/api/v1/profiles")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockProfiles,
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Finca El Rosal LoRaWAN")).toBeInTheDocument();
    });

    expect(screen.getByText(/LORAWAN · 915 MHz/)).toBeInTheDocument();
    expect(screen.getByText(/2 nodos · 1 enlaces/)).toBeInTheDocument();

    const variantBtn = screen.getByRole("button", {
      name: new RegExp(t("scenarios.variant_action"), "i"),
    });
    fireEvent.click(variantBtn);

    expect(
      screen.getByText(t("scenarios.variant_modal_title"))
    ).toBeInTheDocument();
  });

  it("test_ac04_04_renders_scenario_editor_stars_and_blocked_simulate_causes", async () => {
    window.history.pushState({}, "", "/scenarios/sc-001");

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes("/api/v1/scenarios/sc-001/validate")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            simulable: false,
            causes: [
              {
                code: "DemNotAvailable",
                message: "Assigned DEM is not yet AVAILABLE",
              },
            ],
          }),
        } as Response;
      }
      if (u.includes("/api/v1/scenarios/sc-001")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockScenarios[0],
        } as Response;
      }
      if (u.includes("/api/v1/dems")) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "dem-001",
              name: "Sabana DEM",
              description: null,
              bounds: { south: 4.5, west: -74.2, north: 4.7, east: -74.0 },
              status: "DOWNLOADING",
              resolution_m: 30.0,
              object_key: null,
              size_bytes: null,
              failure_reason: null,
              created_at: "2026-11-09T10:00:00Z",
              updated_at: "2026-11-09T10:00:00Z",
            },
          ],
        } as Response;
      }
      if (u.includes("/api/v1/profiles")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockProfiles,
        } as Response;
      }
      return { ok: true, status: 200, json: async () => [] } as Response;
    });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(/Editor de Escenario: Finca El Rosal LoRaWAN/)
      ).toBeInTheDocument();
    });

    // Switch to step 4 (Deployment & Links) and verify star tree view
    const stepDeploymentBtn = screen.getByRole("button", {
      name: t("scenarios.step_deployment"),
    });
    fireEvent.click(stepDeploymentBtn);

    expect(screen.getByText("Estrella de Gateway Norte")).toBeInTheDocument();
    expect(screen.getByText("Sensor Humedad 1")).toBeInTheDocument();

    // Verify Simulate button is disabled because DEM is DOWNLOADING (AC-16, RN-31)
    const simulateBtn = screen.getByRole("button", {
      name: new RegExp(t("scenarios.simulate_button"), "i"),
    });
    expect(simulateBtn).toBeDisabled();
  });
});

