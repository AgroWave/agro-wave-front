import React from "react";
import type { CoverageMetrics } from "../../../domain/simulation";

interface DsrMetricsCardsProps {
  metrics: CoverageMetrics;
}

/**
 * Renders the 4 quantitative DSR evaluation metrics (ACE, %COB, Rmax, IVC).
 *
 * Implements RN-44, RN-45, RN-46, and RN-47.
 */
export const DsrMetricsCards: React.FC<DsrMetricsCardsProps> = ({ metrics }) => {
  return (
    <div className="space-y-4" data-testid="dsr-metrics-section">
      <div className="flex items-center justify-between border-b pb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Métricas de Evaluación Cuantitativa DSR (Fase 5)
          </h3>
          <p className="text-xs text-gray-600">
            Evaluación zonal sobre terreno FABDEM de 30 m contrastable con Radio Mobile
          </p>
        </div>
        <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
          Metodología DSR
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* ACE (RN-44) */}
        <div
          data-testid="metric-card-ace"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-red-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Área Cobertura Efectiva (ACE)
            </span>
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
              RN-44
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900">
              {metrics.effective_coverage_area_km2.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-gray-600">km²</span>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Superficie geográfica viable con P<sub>rx</sub> ≥ Sensibilidad.
          </p>
        </div>

        {/* %COB (RN-45) */}
        <div
          data-testid="metric-card-cob"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-red-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Porcentaje Cobertura (%COB)
            </span>
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
              RN-45
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900">
              {metrics.coverage_percentage.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-gray-600">%</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-red-700 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, metrics.coverage_percentage))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Razón ACE / Área Total ({metrics.total_area_km2.toFixed(1)} km²).
          </p>
        </div>

        {/* Rmax (RN-46) */}
        <div
          data-testid="metric-card-rmax"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-red-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Radio Máximo (R<sub>máx</sub>)
            </span>
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
              RN-46
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900">
              {metrics.max_coverage_radius_km.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-gray-600">km</span>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Distancia geodésica extrema alcanzable desde el Gateway.
          </p>
        </div>

        {/* IVC (RN-47) */}
        <div
          data-testid="metric-card-ivc"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-red-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Índice Variabilidad (IVC)
            </span>
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
              RN-47
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900">
              {metrics.variability_index.toFixed(4)}
            </span>
            <span className="text-xs font-semibold text-gray-600">(σ/μ en mW)</span>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Dispersión relativa en mW lineales; mide impacto del relieve.
          </p>
        </div>
      </div>
    </div>
  );
};
