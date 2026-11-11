/**
 * Tests for DSR coverage metrics cards and simulation detail coverage layer (AC-30).
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as simulationsApi from "../../api/simulations";
import type { CoverageMetrics, SimulationResults } from "../../domain/simulation";
import { DsrMetricsCards } from "./components/DsrMetricsCards";
import { SimulationDetailPage } from "./SimulationDetailPage";

vi.mock("../../api/simulations");

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

const mockMetrics: CoverageMetrics = {
  effective_coverage_area_km2: 45.67,
  total_area_km2: 100.0,
  coverage_percentage: 45.67,
  max_coverage_radius_km: 12.34,
  variability_index: 0.0892,
  covered_samples_count: 456,
  total_samples_count: 1000,
};

describe("AC-30: DSR Metrics and Spatial Coverage UI", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.setItem("agrowave_token", "test-token");
  });

  it("test_ac30_dsr_metrics_cards_renders_four_quantitative_metrics", () => {
    render(<DsrMetricsCards metrics={mockMetrics} />);

    // Check headings
    expect(screen.getByTestId("dsr-metrics-section")).toBeInTheDocument();
    expect(
      screen.getByText(/Métricas de Evaluación Cuantitativa DSR/i),
    ).toBeInTheDocument();

    // Check ACE (RN-44)
    expect(screen.getByTestId("metric-card-ace")).toBeInTheDocument();
    expect(screen.getByText("RN-44")).toBeInTheDocument();
    expect(screen.getByText("45.67")).toBeInTheDocument();
    expect(screen.getByText("km²")).toBeInTheDocument();

    // Check %COB (RN-45)
    expect(screen.getByTestId("metric-card-cob")).toBeInTheDocument();
    expect(screen.getByText("RN-45")).toBeInTheDocument();
    expect(screen.getByText("45.7")).toBeInTheDocument();

    // Check Rmax (RN-46)
    expect(screen.getByTestId("metric-card-rmax")).toBeInTheDocument();
    expect(screen.getByText("RN-46")).toBeInTheDocument();
    expect(screen.getByText("12.34")).toBeInTheDocument();
    expect(screen.getByText("km")).toBeInTheDocument();

    // Check IVC (RN-47)
    expect(screen.getByTestId("metric-card-ivc")).toBeInTheDocument();
    expect(screen.getByText("RN-47")).toBeInTheDocument();
    expect(screen.getByText("0.0892")).toBeInTheDocument();
  });

  it("test_ac30_simulation_detail_renders_dsr_section_and_export_button", async () => {
    const mockSimulationResults: SimulationResults = {
      id: "sim-dsr-1",
      owner_id: "user-1",
      scenario_id: "sc-1",
      comparison_group_id: "cg-1",
      name: "Simulación DSR Experimental",
      description: "Prueba de métricas zonales",
      status: "COMPLETED",
      technology: "LORAWAN",
      propagation_model_id: "LONGLEY_RICE",
      snapshot: {
        frequency_mhz: 915.0,
        access_nodes: [
          {
            id: "an-1",
            name: "GW-Central",
            lat: 4.66,
            lng: -74.0,
            antenna_gain_dbi: 5.8,
            sensitivity_dbm: -137.0,
          },
        ],
      },
      summary: {
        viable_links_pct: 100.0,
        min_margin_db: 12.0,
        mean_margin_db: 15.5,
        fresnel_clear_count: 1,
        fresnel_marginal_count: 0,
        fresnel_obstructed_count: 0,
        coverage_metrics: mockMetrics,
      },
      coverage_result: {
        id: "cov-1",
        access_node_id: "an-1",
        metrics: mockMetrics,
        samples: [
          {
            distance_m: 1000.0,
            azimuth_deg: 0.0,
            latitude: 4.669,
            longitude: -74.0,
            received_power_dbm: -100.0,
            viable: true,
            cell_area_km2: 0.1,
          },
          {
            distance_m: 2000.0,
            azimuth_deg: 0.0,
            latitude: 4.678,
            longitude: -74.0,
            received_power_dbm: -140.0,
            viable: false,
            cell_area_km2: 0.1,
          },
        ],
      },
      link_results: [],
      warnings: [],
      failure_reason: null,
      created_at: "2026-11-10T12:00:00Z",
      started_at: "2026-11-10T12:00:01Z",
      finished_at: "2026-11-10T12:00:05Z",
    };

    vi.mocked(simulationsApi.getSimulationResults).mockResolvedValue(
      mockSimulationResults,
    );

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/simulations/sim-dsr-1"]}>
          <Routes>
            <Route path="/simulations/:id" element={<SimulationDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Simulación DSR Experimental"),
      ).toBeInTheDocument();
    });

    // Verify DSR metrics section is present
    expect(screen.getByTestId("dsr-metrics-section")).toBeInTheDocument();
    expect(screen.getByText("45.67")).toBeInTheDocument();

    // Verify Radio Mobile export button is rendered
    const exportButton = screen.getByRole("link", {
      name: /Exportar para Radio Mobile/i,
    });
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toHaveAttribute(
      "href",
      "/api/v1/simulations/sim-dsr-1/coverage/export",
    );
  });
});
