import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useSimulationComparison } from "./useSimulations";

const VARIANT_COLORS = ["#10b981", "#38bdf8", "#f59e0b", "#a855f7"];

/**
 * Displays side-by-side comparison of COMPLETED simulations from the same comparison group
 * and propagation model, including summary table and grouped link bars (UC-SI-03, RN-37).
 * @returns Simulation comparison page component.
 */
export function SimulationComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawIds = searchParams.get("ids") ?? "";
  const simIds = rawIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { data: report, isLoading, error } = useSimulationComparison(simIds);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Calculando comparativa de variantes...
      </div>
    );
  }

  if (error || !report) {
    const errMsg =
      (error as { message?: string } | null)?.message ??
      "No se pudieron comparar las simulaciones seleccionadas (RN-37).";
    return (
      <div className="p-6 space-y-4">
        <button
          type="button"
          onClick={() => navigate("/simulations")}
          className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a Simulaciones
        </button>
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-300">
          {errMsg}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-300">
        <button
          type="button"
          onClick={() => navigate("/simulations")}
          className="rounded-xs border border-slate-300 bg-white p-2 text-[#0f172a] hover:bg-[#f3f2ef] shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#0f172a]">
            Comparación de Variantes LPWAN
          </h1>
          <p className="text-xs text-[#475569] font-medium mt-0.5">
            Grupo {report.comparison_group_id} · Modelo{" "}
            {report.propagation_model_id}
          </p>
        </div>
      </div>

      {/* Summary Comparison Table */}
      <div className="rounded-none border border-slate-300 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-300 px-4 py-3 bg-[#eae9e6]">
          <h3 className="text-sm font-bold text-[#0f172a]">
            Resumen por Variante
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1e293b]">
            <thead className="bg-[#f1f5f9] text-[#0f172a] font-bold uppercase border-b border-slate-300">
              <tr>
                <th className="px-4 py-3">Simulación</th>
                <th className="px-4 py-3">Tecnología</th>
                <th className="px-4 py-3">Frecuencia</th>
                <th className="px-4 py-3">% Enlaces Viables</th>
                <th className="px-4 py-3">Margen Mín. (dB)</th>
                <th className="px-4 py-3">Margen Medio (dB)</th>
                <th className="px-4 py-3">Fresnel (Desp/Marg/Obst)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.simulations.map((s, idx) => (
                <tr key={s.simulation_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-[#0f172a] flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-none"
                      style={{
                        backgroundColor:
                          VARIANT_COLORS[idx % VARIANT_COLORS.length],
                      }}
                    />
                    {s.name}
                  </td>
                  <td className="px-4 py-3 font-semibold">{s.technology}</td>
                  <td className="px-4 py-3 font-mono font-medium">
                    {s.frequency_mhz.toFixed(1)} MHz
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-800">
                    {s.summary.viable_links_pct.toFixed(1)} %
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-[#0f172a]">
                    {s.summary.min_margin_db.toFixed(2)} dB
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-[#0f172a]">
                    {s.summary.mean_margin_db.toFixed(2)} dB
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-[#475569]">
                    {s.summary.fresnel_clear_count} /{" "}
                    {s.summary.fresnel_marginal_count} /{" "}
                    {s.summary.fresnel_obstructed_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-Link Grouped Bar Comparison */}
      <div className="rounded-none border border-slate-300 bg-white shadow-2xs p-5 space-y-5">
        <h3 className="text-sm font-bold text-[#0f172a]">
          Comparación por Enlace (Margen y Path Loss p50)
        </h3>
        <div className="space-y-4">
          {report.links.map((linkRow) => (
            <div
              key={linkRow.link_key}
              className="rounded-none border border-slate-300 bg-[#f8f9fb] p-4 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-100">
                  {linkRow.link_key}
                </span>
                <span className="font-mono text-slate-400">
                  {(linkRow.distance_m / 1000).toFixed(3)} km
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkRow.metrics_by_simulation.map((m, idx) => {
                  const color = VARIANT_COLORS[idx % VARIANT_COLORS.length];
                  const barPct = Math.min(
                    100,
                    Math.max(8, ((m.margin_db + 30) / 60) * 100),
                  );
                  return (
                    <div
                      key={m.simulation_id}
                      className="rounded border border-slate-800/90 bg-slate-900/70 p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200 flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {m.simulation_name} ({m.technology})
                        </span>
                        <span
                          className={
                            m.viable
                              ? "text-emerald-400 font-semibold"
                              : "text-rose-400 font-semibold"
                          }
                        >
                          {m.viable ? "Viable" : "No viable"}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${barPct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[11px] text-slate-300">
                        <span>PL p50: {m.path_loss_p50_db.toFixed(2)} dB</span>
                        <span>Prx: {m.received_power_dbm.toFixed(2)} dBm</span>
                        <span>
                          Margen: {m.margin_db >= 0 ? "+" : ""}
                          {m.margin_db.toFixed(2)} dB
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
