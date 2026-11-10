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
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completada
        </span>
      );
    case "RUNNING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-400 animate-pulse">
          <Activity className="h-3.5 w-3.5" />
          En ejecución
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-medium text-rose-400">
          <XCircle className="h-3.5 w-3.5" />
          Fallida
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-medium text-slate-300">
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
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Simulaciones</h1>
          <p className="text-sm text-slate-400">
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
              className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BarChart3 className="h-4 w-4" />
              Comparar ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Nueva Simulación
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 p-3 text-sm text-rose-300">
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
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200"
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
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200"
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
              className={`rounded-xl border p-5 transition-colors flex flex-col justify-between gap-4 ${
                isSelected
                  ? "border-sky-500 bg-slate-900/90"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(sim.id)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500"
                    />
                    <span className="font-semibold text-slate-100">
                      {sim.name}
                    </span>
                  </label>
                  {statusBadge(sim.status)}
                </div>

                {sim.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {sim.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 font-medium">
                    {sim.technology}
                  </span>
                  <span className="rounded bg-slate-800/70 px-2 py-0.5 text-slate-400">
                    {sim.propagation_model_id}
                  </span>
                  <span className="rounded bg-slate-800/50 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                    Grupo {sim.comparison_group_id.slice(0, 8)}
                  </span>
                </div>

                {sim.summary && (
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-950/60 p-2.5 text-center text-xs">
                    <div>
                      <div className="text-slate-400">Viables</div>
                      <div className="font-semibold text-emerald-400">
                        {sim.summary.viable_links_pct.toFixed(0)} %
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Margen mín.</div>
                      <div className="font-mono font-semibold text-slate-200">
                        {sim.summary.min_margin_db.toFixed(1)} dB
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Margen medio</div>
                      <div className="font-mono font-semibold text-slate-200">
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

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <button
                  type="button"
                  onClick={() => navigate(`/simulations/${sim.id}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300"
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
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">
              Ejecutar Nueva Simulación
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Escenario de origen
                </label>
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre de la simulación
                </label>
                <input
                  type="text"
                  value={newSimName}
                  onChange={(e) => setNewSimName(e.target.value)}
                  placeholder="Ej. Simulación La Calera SF12"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newSimDesc}
                  onChange={(e) => setNewSimDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  !selectedScenarioId || createAndRunMutation.isPending
                }
                onClick={() => void handleCreateAndRun()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
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
