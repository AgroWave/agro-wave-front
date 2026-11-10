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

function fresnelBadge(verdict: FresnelVerdict) {
  switch (verdict) {
    case "CLEAR":
      return (
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          Despejado (≥ 0.6 F1)
        </span>
      );
    case "MARGINAL":
      return (
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
          Marginal (0–0.6 F1)
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-medium text-rose-400">
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
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/simulations")}
            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{sim.name}</h1>
              <span className="rounded bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-200">
                {sim.technology}
              </span>
              <span className="rounded bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-300">
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
              <p className="text-sm text-slate-400 mt-0.5">{sim.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sim.status === "FAILED" && (
            <button
              type="button"
              onClick={() => void retryMutation.mutateAsync(sim.id)}
              disabled={retryMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </button>
          )}
          <button
            type="button"
            disabled
            title="Formato de exportación pendiente de definir (Q7)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar resultados
          </button>
        </div>
      </div>

      {/* Running banner */}
      {(sim.status === "RUNNING" || sim.status === "CREATED") && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-4 text-sm text-sky-300 flex items-center gap-3">
          <RefreshCw className="h-4 w-4 animate-spin" />
          La simulación está ejecutándose en segundo plano. Los resultados se
          actualizarán automáticamente.
        </div>
      )}

      {/* Failure banner */}
      {sim.status === "FAILED" && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-300">
          <strong>Simulación fallida:</strong>{" "}
          {sim.failure_reason ?? "Error desconocido durante el cálculo."}
        </div>
      )}

      {/* Engine Warnings (RN-43, AC-22) */}
      {sim.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Advertencias del motor de propagación ({sim.warnings.length})
          </div>
          <ul className="space-y-1 text-xs text-amber-200/90">
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-400">Enlaces viables</div>
            <div className="mt-1 text-2xl font-bold text-emerald-400">
              {sim.summary.viable_links_pct.toFixed(1)} %
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-400">Margen mínimo</div>
            <div className="mt-1 text-2xl font-mono font-bold text-slate-100">
              {sim.summary.min_margin_db.toFixed(2)} dB
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-400">Margen medio</div>
            <div className="mt-1 text-2xl font-mono font-bold text-slate-100">
              {sim.summary.mean_margin_db.toFixed(2)} dB
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-400">
              Veredictos Fresnel (Desp / Marg / Obst)
            </div>
            <div className="mt-1 text-lg font-mono font-semibold text-slate-200">
              <span className="text-emerald-400">
                {sim.summary.fresnel_clear_count}
              </span>{" "}
              /{" "}
              <span className="text-amber-400">
                {sim.summary.fresnel_marginal_count}
              </span>{" "}
              /{" "}
              <span className="text-rose-400">
                {sim.summary.fresnel_obstructed_count}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Per-Link Results Table */}
      {sim.link_results.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-100">
              Resultados por Enlace Uplink (selecciona una fila para ver su
              perfil)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950/70 text-slate-400 uppercase">
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
              <tbody className="divide-y divide-slate-800/80">
                {sim.link_results.map((lr) => {
                  const qLosses = extractQuantileLosses(lr.path_loss);
                  const isActive = activeLink?.link_id === lr.link_id;
                  return (
                    <tr
                      key={lr.id}
                      onClick={() => setSelectedLinkId(lr.link_id)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? "bg-sky-950/40"
                          : "hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-100">
                        {lr.end_node_name} → {lr.access_node_name}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {(lr.distance_m / 1000).toFixed(3)} km
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="font-semibold text-slate-100">
                          {qLosses.p50Db.toFixed(2)} dB
                        </span>{" "}
                        <span className="text-slate-400">
                          ({qLosses.p10Db.toFixed(1)}–{qLosses.p90Db.toFixed(1)})
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {lr.received_power_dbm.toFixed(2)} dBm
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono">
                          {lr.sensitivity_used_dbm.toFixed(1)} dBm
                        </div>
                        <span className="text-[10px] text-amber-300/90">
                          {lr.sensitivity_origin === "REFERENCE_TO_VERIFY"
                            ? "Por verificar (RN-42)"
                            : "Definida por usuario"}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 font-mono font-semibold ${
                          lr.margin_db >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {lr.margin_db >= 0 ? "+" : ""}
                        {lr.margin_db.toFixed(2)} dB
                      </td>
                      <td className="px-4 py-3">
                        {lr.viable ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
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
