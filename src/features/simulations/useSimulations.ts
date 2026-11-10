import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  compareSimulations,
  createSimulation,
  deleteSimulation,
  getSimulationResults,
  listSimulations,
  retrySimulation,
  runSimulation,
  updateSimulation,
  type CreateSimulationPayload,
  type ListSimulationsFilters,
  type UpdateSimulationPayload,
} from "../../api/simulations";
import { useAuthStore } from "../auth/useAuthStore";

/**
 * Query hook for listing simulations with automatic polling while any simulation is RUNNING.
 * @param filters - Optional search, technology, status, and sort filters.
 * @returns TanStack Query result with Simulation list.
 */
export function useSimulationsList(filters?: ListSimulationsFilters) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["simulations", filters],
    queryFn: () => listSimulations(token ?? "", filters),
    enabled: Boolean(token),
    refetchInterval: (query) => {
      const items = query.state.data;
      if (
        items &&
        items.some((s) => s.status === "RUNNING" || s.status === "CREATED")
      ) {
        return 2500;
      }
      return false;
    },
  });
}

/**
 * Query hook for fetching simulation detail and results with polling while RUNNING.
 * @param simulationId - Simulation UUID.
 * @returns TanStack Query result with SimulationResults.
 */
export function useSimulationDetail(simulationId: string) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["simulation-results", simulationId],
    queryFn: () => getSimulationResults(token ?? "", simulationId),
    enabled: Boolean(token && simulationId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "RUNNING" || data.status === "CREATED")) {
        return 2000;
      }
      return false;
    },
  });
}

/**
 * Query hook for comparing two or more simulations side by side (UC-SI-03, RN-37).
 * @param simulationIds - Array of simulation UUIDs.
 * @returns TanStack Query result with ComparisonReport.
 */
export function useSimulationComparison(simulationIds: string[]) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["simulation-compare", simulationIds.join(",")],
    queryFn: () => compareSimulations(token ?? "", simulationIds),
    enabled: Boolean(token && simulationIds.length >= 2),
  });
}

/**
 * Mutation hooks for creating, running, retrying, updating, and deleting simulations.
 * @returns Object containing simulation mutations.
 */
export function useSimulationMutations() {
  const { token } = useAuthStore();
  const safeToken = token ?? "";
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["simulations"] });
    void queryClient.invalidateQueries({ queryKey: ["simulation-results"] });
  };

  const createAndRunMutation = useMutation({
    mutationFn: async (payload: CreateSimulationPayload) => {
      const created = await createSimulation(safeToken, payload);
      return await runSimulation(safeToken, created.id);
    },
    onSuccess: invalidateAll,
  });

  const runMutation = useMutation({
    mutationFn: (simulationId: string) =>
      runSimulation(safeToken, simulationId),
    onSuccess: invalidateAll,
  });

  const retryMutation = useMutation({
    mutationFn: (simulationId: string) =>
      retrySimulation(safeToken, simulationId),
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: (args: {
      simulationId: string;
      payload: UpdateSimulationPayload;
    }) => updateSimulation(safeToken, args.simulationId, args.payload),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (simulationId: string) =>
      deleteSimulation(safeToken, simulationId),
    onSuccess: invalidateAll,
  });

  return {
    createAndRunMutation,
    runMutation,
    retryMutation,
    updateMutation,
    deleteMutation,
  };
}

