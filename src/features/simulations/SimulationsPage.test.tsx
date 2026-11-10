/**
 * Component tests for SimulationsPage and SimulationDetailPage (AC-05-04).
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as simulationsApi from "../../api/simulations";
import * as scenariosApi from "../../api/scenarios";
import { SimulationDetailPage } from "./SimulationDetailPage";
import { SimulationsPage } from "./SimulationsPage";

vi.mock("../../api/simulations");
vi.mock("../../api/scenarios");

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe("Simulations UI (AC-05-04)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.setItem("agrowave_token", "test-token");
  });

  it("test_ac05_04_simulations_page_renders_list_and_status_badges", async () => {
    vi.mocked(simulationsApi.listSimulations).mockResolvedValue([
      {
        id: "sim-1",
        owner_id: "user-1",
        scenario_id: "sc-1",
        comparison_group_id: "cg-1",
        name: "Simulación La Calera SF12",
        description: "Ejecución base LoRaWAN",
        status: "COMPLETED",
        technology: "LORAWAN",
        propagation_model_id: "LONGLEY_RICE",
        snapshot: {},
        summary: {
          viable_links_pct: 100.0,
          min_margin_db: 8.5,
          mean_margin_db: 11.2,
          fresnel_clear_count: 1,
          fresnel_marginal_count: 0,
          fresnel_obstructed_count: 0,
        },
        failure_reason: null,
        created_at: "2026-11-09T12:00:00Z",
        started_at: "2026-11-09T12:00:01Z",
        finished_at: "2026-11-09T12:00:03Z",
      },
    ]);
    vi.mocked(scenariosApi.listScenarios).mockResolvedValue([]);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/simulations"]}>
          <Routes>
            <Route path="/simulations" element={<SimulationsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Simulación La Calera SF12")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Completada/i).length).toBeGreaterThan(0);
  });

  it("test_ac05_04_simulation_detail_renders_link_results_profile_and_warnings", async () => {
    vi.mocked(simulationsApi.getSimulationResults).mockResolvedValue({
      id: "sim-1",
      owner_id: "user-1",
      scenario_id: "sc-1",
      comparison_group_id: "cg-1",
      name: "Simulación La Calera SF12",
      description: "Ejecución base",
      status: "COMPLETED",
      technology: "LORAWAN",
      propagation_model_id: "LONGLEY_RICE",
      snapshot: { frequency_mhz: 915.0 },
      summary: {
        viable_links_pct: 100.0,
        min_margin_db: 8.87,
        mean_margin_db: 8.87,
        fresnel_clear_count: 0,
        fresnel_marginal_count: 0,
        fresnel_obstructed_count: 1,
      },
      failure_reason: null,
      created_at: "2026-11-09T12:00:00Z",
      started_at: "2026-11-09T12:00:01Z",
      finished_at: "2026-11-09T12:00:03Z",
      link_results: [
        {
          id: "lr-1",
          link_id: "lnk-1",
          end_node_name: "EN-Calera-1",
          access_node_name: "GW-Calera",
          distance_m: 1613.0,
          fresnel: {
            min_clearance_ratio: -2.24,
            min_clearance_at_m: 806.5,
            max_radius_m: 11.49,
            verdict: "OBSTRUCTED",
          },
          path_loss: {
            free_space_loss_db: 95.82,
            loss_by_quantile: [
              { reliability_pct: 10, confidence_pct: 50, loss_db: 138.0 },
              { reliability_pct: 50, confidence_pct: 50, loss_db: 142.13 },
              { reliability_pct: 90, confidence_pct: 50, loss_db: 146.5 },
            ],
          },
          received_power_dbm: -116.13,
          sensitivity_used_dbm: -137.0,
          sensitivity_origin: "REFERENCE_TO_VERIFY",
          margin_db: 20.87,
          viable: true,
          profile_series: {
            distances_m: [0, 806.5, 1613],
            terrain_with_curvature_m: [2700, 2727.7, 2700],
            los_m: [2702, 2702, 2702],
            f1_radius_m: [0, 11.49, 0],
            series_version: 1,
          },
        },
      ],
      warnings: [
        {
          id: "w-1",
          link_id: "lnk-1",
          source: "LONGLEY_RICE",
          code: "KWX_4",
          message: "Parámetros fuera del rango exacto de Longley-Rice (kwx=4).",
        },
      ],
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/simulations/sim-1"]}>
          <Routes>
            <Route path="/simulations/:id" element={<SimulationDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/EN-Calera-1/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/KWX_4/i)).toBeInTheDocument();
    expect(screen.getByText(/Por verificar/i)).toBeInTheDocument();
  });
});
