import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDem,
  deleteDem,
  listDems,
  updateDem,
  type CreateDemPayload,
  type UpdateDemPayload,
} from "../../api/dems";
import { useAuthStore } from "../auth/useAuthStore";

/**
 * Hook providing query for user's DEM list with 3-second polling for DOWNLOADING status.
 * @param search - Optional substring filter for name/description.
 * @returns Query object for DEM list.
 */
export function useDems(search?: string) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["dems", search],
    queryFn: () => {
      if (!token) throw new Error("No token");
      return listDems(token, search);
    },
    enabled: Boolean(token),
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasDownloading = data?.some((dem) => dem.status === "DOWNLOADING");
      return hasDownloading ? 3000 : false;
    },
  });
}

/**
 * Hook providing mutations to create (download), update, and delete DEM datasets.
 * @returns Object with DEM mutation handlers.
 */
export function useDemMutations() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateDemPayload) => {
      if (!token) throw new Error("No token");
      return createDem(token, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dems"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDemPayload }) => {
      if (!token) throw new Error("No token");
      return updateDem(token, id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dems"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error("No token");
      return deleteDem(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dems"] });
    },
  });

  return {
    createDem: createMutation,
    updateDem: updateMutation,
    deleteDem: deleteMutation,
  };
}
