import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createScenario,
  createScenarioVariant,
  deleteScenario,
  duplicateScenario,
  getScenario,
  listScenarios,
  updateScenario,
  validateScenario,
  type CreateScenarioVariantPayload,
  type SaveScenarioPayload,
} from "../../api/scenarios";
import { useAuthStore } from "../auth/useAuthStore";

/**
 * Queries the list of scenarios owned by the current user.
 * @returns TanStack Query result for user scenarios.
 */
export function useScenarios() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["scenarios"],
    queryFn: () => {
      if (!token) throw new Error("Unauthenticated");
      return listScenarios(token);
    },
    enabled: Boolean(token),
  });
}

/**
 * Queries a single scenario by ID.
 * @param scenarioId - Scenario identifier UUID, or undefined for new scenarios.
 * @returns TanStack Query result for the scenario.
 */
export function useScenario(scenarioId?: string) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["scenarios", scenarioId],
    queryFn: () => {
      if (!token || !scenarioId) throw new Error("Missing token or scenarioId");
      return getScenario(token, scenarioId);
    },
    enabled: Boolean(token && scenarioId),
  });
}

/**
 * Queries the simulation readiness validation result for a persisted scenario (RN-31, AC-16).
 * @param scenarioId - Scenario identifier UUID.
 * @returns TanStack Query result with simulable flag and causes.
 */
export function useScenarioValidation(scenarioId?: string) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["scenarios", scenarioId, "validate"],
    queryFn: () => {
      if (!token || !scenarioId) throw new Error("Missing token or scenarioId");
      return validateScenario(token, scenarioId);
    },
    enabled: Boolean(token && scenarioId),
  });
}

/**
 * Provides mutations for creating, updating, duplicating, creating variants, and deleting scenarios.
 * @returns Mutation objects for scenario operations.
 */
export function useScenarioMutations() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: SaveScenarioPayload) => {
      if (!token) throw new Error("Unauthenticated");
      return createScenario(token, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveScenarioPayload }) => {
      if (!token) throw new Error("Unauthenticated");
      return updateScenario(token, id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["scenarios", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["scenarios", variables.id, "validate"],
      });
    },
  });

  const duplicate = useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) => {
      if (!token) throw new Error("Unauthenticated");
      return duplicateScenario(token, id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });

  const createVariant = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateScenarioVariantPayload;
    }) => {
      if (!token) throw new Error("Unauthenticated");
      return createScenarioVariant(token, id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error("Unauthenticated");
      return deleteScenario(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });

  return {
    createScenario: create,
    updateScenario: update,
    duplicateScenario: duplicate,
    createScenarioVariant: createVariant,
    deleteScenario: remove,
  };
}

