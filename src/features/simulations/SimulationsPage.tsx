import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  Play,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { ApiError } from "../../api/scenarios";
import { ResourceList } from "../../components/layout/ResourceList";
import type { Technology } from "../../domain/scenarios";
import {
  canCompareSimulations,
  type Simulation,
  type SimulationStatus,
} from "../../domain/simulation";
import { useScenarios } from "../scenarios/useScenarios";
import { useSimulationMutations, useSimulationsList } from "./useSimulations";

function statusBadge(status: SimulationStatus) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 rounded-xs bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completada
        </span>
      );
    case "RUNNING":
      return (
        <span className="inline-flex items-center gap-1 rounded-xs bg-sky-50 border border-sky-300 px-2 py-0.5 text-xs font-semibold text-sky-800 animate-pulse">
          <Activity className="h-3.5 w-3.5" />
          En ejecución
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-xs bg-rose-50 border border-rose-300 px-2 py-0.5 text-xs font-semibold text-rose-800">
          <XCircle className="h-3.5 w-3.5" />
          Fallida
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-xs bg-slate-100 border border-slate-300 px-2 py-0.5 text-xs font-semibold text-[#475569]">
          <Clock className="h-3.5 w-3.5" />
          Creada
        </span>
      );
  }
}

/**
 * Page displaying the user's simulations with search, filtering, creation/execution,
 * and selection for multi-variant comparison (UC-SI-01 to UC-SI-04, AC-05-04).
 * @returns Simulations list page component.
 */
export function SimulationsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [techFilter, setTechFilter] = useState<Technology | "">("");
  const [statusFilter, setStatusFilter] = useState<SimulationStatus | "">("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name">(
    "newest",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [newSimName, setNewSimName] = useState("");
  const [newSimDesc, setNewSimDesc] = useState("");

  const { data: simulations = [], isLoading } = useSimulationsList({
    q: searchQuery || undefined,
    technology: techFilter,
    status: statusFilter,
    sort: sortOrder,
  });
  const { data: scenarios = [] } = useScenarios();
  const { createAndRunMutation, deleteMutation } = useSimulationMutations();

  const selectedSimulations = simulations.filter((s) =>
    selectedIds.includes(s.id),
  );
  const compareCheck = canCompareSimulations(selectedSimulations);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleCreateAndRun = async () => {
    if (!selectedScenarioId) return;
    setErrorMessage(null);
    try {
      const sim = await createAndRunMutation.mutateAsync({
        scenario_id: selectedScenarioId,
        name: newSimName.trim() || "Simulación LPWAN",
        description: newSimDesc.trim() || null,
      });
      setShowNewModal(false);
      setNewSimName("");
      setNewSimDesc("");
      navigate(`/simulations/${sim.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || "No se pudo ejecutar la simulación.");
    }
  };

  const handleDelete = async (sim: Simulation) => {
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(sim.id);
      setSelectedIds((prev) => prev.filter((id) => id !== sim.id));
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || "No se pudo eliminar la simulación.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-300">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">Simulaciones</h1>
          <p className="text-sm text-[#475569] font-medium mt-1">
            Ejecuta modelos de propagación Longley-Rice y compara variantes del
            mismo grupo de escenarios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              type="button"
              disabled={!compareCheck.comparable}
              onClick={() =>
                navigate(`/simulations/compare?ids=${selectedIds.join(",")}`)
              }
              title={
                compareCheck.comparable
                  ? "Comparar simulaciones seleccionadas"
                  : "Selecciona al menos 2 simulaciones Completadas del mismo grupo y modelo"
              }
              className="inline-flex items-center gap-2 rounded-xs border border-sky-400 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-800 hover:bg-sky-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              <BarChart3 className="h-4 w-4" />
              Comparar ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 rounded-xs bg-[#047857] hover:bg-[#065f46] px-4 py-2 text-sm font-bold text-white shadow-2xs border border-[#065f46] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva Simulación
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-none border border-rose-300 border-l-4 border-l-rose-700 bg-rose-50 p-3 text-sm text-rose-900 font-medium">
          {errorMessage}
        </div>
      )}

      <ResourceList<Simulation>
        items={simulations}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar simulación por nombre..."
        keyExtractor={(sim) => sim.id}
        emptyMessage="No hay simulaciones registradas. Crea una desde un escenario válido."
        filterSlot={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtrar por tecnología"
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value as Technology | "")}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200"
            >
              <option value="">Todas las tecnologías</option>
              <option value="LORAWAN">LoRaWAN</option>
              <option value="NB_IOT">NB-IoT</option>
              <option value="LTE_M">LTE-M</option>
            </select>
            <select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as SimulationStatus | "")
              }
              className="rounded-xs border border-slate-300 bg-white px-3 py-2 text-xs text-[#0f172a] shadow-2xs focus:border-[#8b1919] focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="COMPLETED">Completada</option>
              <option value="RUNNING">En ejecución</option>
              <option value="FAILED">Fallida</option>
              <option value="CREATED">Creada</option>
            </select>
            <select
              aria-label="Ordenar simulaciones"
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest" | "name")
              }
              className="rounded-xs border border-slate-300 bg-white px-3 py-2 text-xs text-[#0f172a] shadow-2xs focus:border-[#8b1919] focus:outline-none"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="name">Por nombre</option>
            </select>
          </div>
        }
        renderItem={(sim) => {
          const isSelected = selectedIds.includes(sim.id);
          return (
            <div
              className={`rounded-none border p-5 transition-colors flex flex-col justify-between gap-4 shadow-2xs ${
                isSelected
                  ? "border-[#8b1919] bg-[#fbf5f5]"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(sim.id)}
                      className="rounded-none border-slate-400 text-[#8b1919]"
                    />
                    <span className="font-bold text-[#0f172a]">
                      {sim.name}
                    </span>
                  </label>
                  {statusBadge(sim.status)}
                </div>

                {sim.description && (
                  <p className="text-xs text-[#64748b] line-clamp-2">
                    {sim.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-xs bg-[#f1f3f7] border border-slate-300 px-2 py-0.5 text-[#0f172a] font-semibold">
                    {sim.technology}
                  </span>
                  <span className="rounded-xs bg-[#f1f3f7] border border-slate-200 px-2 py-0.5 text-[#475569]">
                    {sim.propagation_model_id}
                  </span>
                  <span className="rounded-xs bg-[#f1f3f7] border border-slate-200 px-2 py-0.5 font-mono text-[11px] text-[#475569]">
                    Grupo {sim.comparison_group_id.slice(0, 8)}
                  </span>
                </div>

                {sim.summary && (
                  <div className="grid grid-cols-3 gap-2 rounded-none bg-[#f8f9fb] border border-slate-200 p-2.5 text-center text-xs">
                    <div>
                      <div className="text-slate-500 font-medium">Viables</div>
                      <div className="font-bold text-emerald-700">
                        {sim.summary.viable_links_pct.toFixed(0)} %
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">Margen mín.</div>
                      <div className="font-mono font-bold text-[#0f172a]">
                        {sim.summary.min_margin_db.toFixed(1)} dB
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">Margen medio</div>
                      <div className="font-mono font-bold text-[#0f172a]">
                        {sim.summary.mean_margin_db.toFixed(1)} dB
                      </div>
                    </div>
                  </div>
                )}

                {sim.failure_reason && (
                  <div className="rounded bg-rose-950/50 p-2 text-xs text-rose-300">
                    Motivo: {sim.failure_reason}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-300 pt-3">
                <button
                  type="button"
                  onClick={() => navigate(`/simulations/${sim.id}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] hover:text-[#065f46] cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver resultados
                </button>
                <button
                  type="button"
                  disabled={sim.status === "RUNNING"}
                  onClick={() => void handleDelete(sim)}
                  title={
                    sim.status === "RUNNING"
                      ? "No se puede eliminar mientras está en ejecución (RN-33)"
                      : "Eliminar simulación"
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 disabled:opacity-40 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          );
        }}
      />

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-none border border-slate-400 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <h2 className="text-base font-bold uppercase tracking-wide text-[#0f172a]">
                Ejecutar Nueva Simulación
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                  Escenario de origen
                </label>
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className="w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#8b1919] focus:outline-none"
                >
                  <option value="">Selecciona un escenario...</option>
                  {scenarios.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.radio_config?.technology ?? "Borrador"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                  Nombre de la simulación
                </label>
                <input
                  type="text"
                  value={newSimName}
                  onChange={(e) => setNewSimName(e.target.value)}
                  placeholder="Ej. Simulación La Calera SF12"
                  className="w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#64748b] focus:border-[#8b1919] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newSimDesc}
                  onChange={(e) => setNewSimDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#64748b] focus:border-[#8b1919] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-300">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-xs border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#1e293b] hover:bg-[#f3f2ef] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  !selectedScenarioId || createAndRunMutation.isPending
                }
                onClick={() => void handleCreateAndRun()}
                className="inline-flex items-center gap-1.5 rounded-xs bg-[#047857] hover:bg-[#065f46] px-4 py-2 text-xs font-bold text-white shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                {createAndRunMutation.isPending ? "Iniciando..." : "Simular"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
