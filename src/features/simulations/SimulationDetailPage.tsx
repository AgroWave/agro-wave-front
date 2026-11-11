import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  extractQuantileLosses,
  type FresnelVerdict,
  type LinkResult,
} from "../../domain/simulation";
import { LinkProfileChart } from "./LinkProfileChart";
import { useSimulationDetail, useSimulationMutations } from "./useSimulations";
import { DsrMetricsCards } from "./components/DsrMetricsCards";
import { CoverageMapLayer } from "./components/CoverageMapLayer";

function fresnelBadge(verdict: FresnelVerdict) {
  switch (verdict) {
    case "CLEAR":
      return (
        <span className="rounded-xs border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
          Despejado (≥ 0.6 F1)
        </span>
      );
    case "MARGINAL":
      return (
        <span className="rounded-xs border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
          Marginal (0–0.6 F1)
        </span>
      );
    default:
      return (
        <span className="rounded-xs border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-800">
          Obstruido (&lt; 0 F1)
        </span>
      );
  }
}

/**
 * Displays simulation status, summary cards, engine warnings (kwx), link results table
 * with sensitivity origin, and interactive terrain + Fresnel profile chart (AC-05-04).
 * @returns Simulation detail and results page component.
 */
export function SimulationDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: sim, isLoading } = useSimulationDetail(id);
  const { retryMutation } = useSimulationMutations();
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  if (isLoading || !sim) {
    return (
      <div className="p-8 text-center text-slate-400">
        Cargando resultados de la simulación...
      </div>
    );
  }

  const activeLink: LinkResult | undefined =
    sim.link_results.find((lr) => lr.link_id === selectedLinkId) ??
    sim.link_results[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-300">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/simulations")}
            className="rounded-xs border border-slate-300 bg-white p-2 text-[#0f172a] hover:bg-[#f3f2ef] shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#0f172a]">{sim.name}</h1>
              <span className="rounded-xs bg-[#f1f3f7] border border-slate-300 px-2.5 py-0.5 text-xs font-bold text-[#0f172a]">
                {sim.technology}
              </span>
              <span className="rounded-xs border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-[#1e293b]">
                {sim.status === "COMPLETED"
                  ? "Completada"
                  : sim.status === "RUNNING"
                    ? "En ejecución..."
                    : sim.status === "FAILED"
                      ? "Fallida"
                      : "Creada"}
              </span>
            </div>
            {sim.description && (
              <p className="text-sm text-[#475569] font-medium mt-0.5">{sim.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sim.status === "FAILED" && (
            <button
              type="button"
              onClick={() => void retryMutation.mutateAsync(sim.id)}
              disabled={retryMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xs bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-2xs cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </button>
          )}
          {sim.status === "COMPLETED" ? (
            <a
              href={`/api/v1/simulations/${sim.id}/coverage/export`}
              download={`coverage_${sim.id}.json`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xs border border-red-300 bg-red-50 hover:bg-red-100 px-4 py-2 text-xs font-bold text-red-800 shadow-2xs cursor-pointer transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar para Radio Mobile
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Disponible al completar la simulación"
              className="inline-flex items-center gap-1.5 rounded-xs border border-slate-300 bg-[#f8f9fb] px-4 py-2 text-xs font-semibold text-[#64748b] cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar resultados
            </button>
          )}
        </div>
      </div>

      {/* Running banner */}
      {(sim.status === "RUNNING" || sim.status === "CREATED") && (
        <div className="rounded-none border border-sky-300 border-l-4 border-l-sky-600 bg-sky-50 p-4 text-sm text-sky-900 font-medium flex items-center gap-3">
          <RefreshCw className="h-4 w-4 animate-spin text-sky-700" />
          La simulación está ejecutándose en segundo plano. Los resultados se
          actualizarán automáticamente.
        </div>
      )}

      {/* Failure banner */}
      {sim.status === "FAILED" && (
        <div className="rounded-none border border-rose-300 border-l-4 border-l-rose-700 bg-rose-50 p-4 text-sm text-rose-900">
          <strong>Simulación fallida:</strong>{" "}
          {sim.failure_reason ?? "Error desconocido durante el cálculo."}
        </div>
      )}

      {/* Engine Warnings (RN-43, AC-22) */}
      {sim.warnings.length > 0 && (
        <div className="rounded-none border border-amber-300 border-l-4 border-l-amber-600 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            Advertencias del motor de propagación ({sim.warnings.length})
          </div>
          <ul className="space-y-1 text-xs text-amber-900 font-medium">
            {sim.warnings.map((w) => (
              <li key={w.id} className="font-mono">
                [{w.code}] ({w.source}): {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Cards */}
      {sim.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-none border border-slate-300 bg-white p-4 shadow-2xs">
            <div className="text-xs text-[#475569] font-semibold">Enlaces viables</div>
            <div className="mt-1 text-2xl font-bold text-emerald-800">
              {sim.summary.viable_links_pct.toFixed(1)} %
            </div>
          </div>
          <div className="rounded-none border border-slate-300 bg-white p-4 shadow-2xs">
            <div className="text-xs text-[#475569] font-semibold">Margen mínimo</div>
            <div className="mt-1 text-2xl font-mono font-bold text-[#0f172a]">
              {sim.summary.min_margin_db.toFixed(2)} dB
            </div>
          </div>
          <div className="rounded-none border border-slate-300 bg-white p-4 shadow-2xs">
            <div className="text-xs text-[#475569] font-semibold">Margen medio</div>
            <div className="mt-1 text-2xl font-mono font-bold text-[#0f172a]">
              {sim.summary.mean_margin_db.toFixed(2)} dB
            </div>
          </div>
          <div className="rounded-none border border-slate-300 bg-white p-4 shadow-2xs">
            <div className="text-xs text-[#475569] font-semibold">
              Veredictos Fresnel (Desp / Marg / Obst)
            </div>
            <div className="mt-1 text-lg font-mono font-bold text-[#0f172a]">
              <span className="text-emerald-800">
                {sim.summary.fresnel_clear_count}
              </span>{" "}
              /{" "}
              <span className="text-amber-800">
                {sim.summary.fresnel_marginal_count}
              </span>{" "}
              /{" "}
              <span className="text-rose-800">
                {sim.summary.fresnel_obstructed_count}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DSR Quantitative Evaluation Metrics (RN-44..47) */}
      {sim.summary?.coverage_metrics && (
        <DsrMetricsCards metrics={sim.summary.coverage_metrics} />
      )}

      {/* Spatial Coverage Map Layer (RN-48) */}
      {sim.coverage_result && sim.coverage_result.samples.length > 0 && (() => {
        const rawAccessNodes = (sim.snapshot as { access_nodes?: Array<{ name?: string; lat?: number; latitude?: number; lng?: number; longitude?: number; sensitivity_dbm?: number }> })?.access_nodes;
        const rawEndNodes = (sim.snapshot as { end_nodes?: Array<{ id?: string; name?: string; lat?: number; latitude?: number; lng?: number; longitude?: number; height_agl_m?: number }> })?.end_nodes;
        const firstNode = rawAccessNodes?.[0];
        const nodeName = firstNode?.name ?? "Gateway";
        const nodeLat = firstNode?.lat ?? firstNode?.latitude ?? 4.66;
        const nodeLon = firstNode?.lng ?? firstNode?.longitude ?? -74.00;
        const sensDbm = firstNode?.sensitivity_dbm ?? -137.0;

        const endNodeMarkers = (rawEndNodes ?? []).map((en, idx) => ({
          id: en.id ?? `en-${idx}`,
          name: en.name ?? `Sensor ${idx + 1}`,
          lat: Number(en.lat ?? en.latitude ?? 4.66),
          lng: Number(en.lng ?? en.longitude ?? -74.00),
          heightAglM: en.height_agl_m,
        }));

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f172a]">
                Mapa de Cobertura Zonal sobre Terreno FABDEM (360° Azimutal)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {sim.coverage_result.samples.length} muestras evaluadas
              </span>
            </div>
            <CoverageMapLayer
              accessNodeName={nodeName}
              accessNodeLat={nodeLat}
              accessNodeLon={nodeLon}
              sensitivityDbm={sensDbm}
              samples={sim.coverage_result.samples}
              endNodes={endNodeMarkers}
            />
          </div>
        );
      })()}

      {/* Per-Link Results Table */}
      {sim.link_results.length > 0 && (
        <div className="rounded-none border border-slate-300 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-300 px-4 py-3 bg-[#eae9e6]">
            <h3 className="text-sm font-bold text-[#0f172a]">
              Resultados por Enlace Uplink (selecciona una fila para ver su
              perfil)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1e293b]">
              <thead className="bg-[#f1f5f9] text-[#0f172a] uppercase border-b border-slate-300 font-bold">
                <tr>
                  <th className="px-4 py-3">Enlace (End → Access)</th>
                  <th className="px-4 py-3">Distancia</th>
                  <th className="px-4 py-3">Path Loss p50 (p10–p90)</th>
                  <th className="px-4 py-3">Prx (dBm)</th>
                  <th className="px-4 py-3">Sensibilidad (dBm)</th>
                  <th className="px-4 py-3">Margen (dB)</th>
                  <th className="px-4 py-3">Viable</th>
                  <th className="px-4 py-3">Fresnel F1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sim.link_results.map((lr) => {
                  const qLosses = extractQuantileLosses(lr.path_loss);
                  const isActive = activeLink?.link_id === lr.link_id;
                  return (
                    <tr
                      key={lr.id}
                      onClick={() => setSelectedLinkId(lr.link_id)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? "bg-blue-50/80"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-[#0f172a]">
                        {lr.end_node_name} → {lr.access_node_name}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">
                        {(lr.distance_m / 1000).toFixed(3)} km
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-[#0f172a]">
                          {qLosses.p50Db.toFixed(2)} dB
                        </span>{" "}
                        <span className="text-[#64748b]">
                          ({qLosses.p10Db.toFixed(1)}–{qLosses.p90Db.toFixed(1)})
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">
                        {lr.received_power_dbm.toFixed(2)} dBm
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium">
                          {lr.sensitivity_used_dbm.toFixed(1)} dBm
                        </div>
                        <span className="text-[10px] text-amber-800 font-semibold">
                          {lr.sensitivity_origin === "REFERENCE_TO_VERIFY"
                            ? "Por verificar (RN-42)"
                            : "Definida por usuario"}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 font-mono font-bold ${
                          lr.margin_db >= 0
                            ? "text-emerald-800"
                            : "text-rose-800"
                        }`}
                      >
                        {lr.margin_db >= 0 ? "+" : ""}
                        {lr.margin_db.toFixed(2)} dB
                      </td>
                      <td className="px-4 py-3">
                        {lr.viable ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-800 font-bold">
                            <XCircle className="h-3.5 w-3.5" /> No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {fresnelBadge(lr.fresnel.verdict)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Link Profile Chart */}
      {activeLink && (
        <LinkProfileChart
          series={activeLink.profile_series}
          fresnel={activeLink.fresnel}
          endNodeName={activeLink.end_node_name}
          accessNodeName={activeLink.access_node_name}
        />
      )}
    </div>
  );
}
