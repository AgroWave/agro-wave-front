import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProfile,
  deleteProfile,
  duplicateProfile,
  listNodeTemplates,
  listProfiles,
  updateProfile,
  type CreateProfilePayload,
  type ProfileFilters,
  type UpdateProfilePayload,
} from "../../api/profiles";
import { useAuthStore } from "../auth/useAuthStore";

/**
 * Hook providing queries and mutations for LPWAN profiles.
 * @param filters - Optional technology and owner filter settings.
 * @returns Query object for profiles list.
 */
export function useProfiles(filters?: ProfileFilters) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["profiles", filters],
    queryFn: () => {
      if (!token) throw new Error("No token");
      return listProfiles(token, filters);
    },
    enabled: Boolean(token),
  });
}

/**
 * Hook to retrieve reference node templates for a given profile.
 * @param profileId - Profile UUID identifier.
 * @returns Query object for equipment templates.
 */
export function useProfileTemplates(profileId: string | null) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["profile-templates", profileId],
    queryFn: () => {
      if (!token || !profileId) throw new Error("Missing parameters");
      return listNodeTemplates(token, profileId);
    },
    enabled: Boolean(token && profileId),
  });
}

/**
 * Hook providing mutations to create, update, duplicate, and delete profiles.
 * @returns Object with profile mutation handlers.
 */
export function useProfileMutations() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateProfilePayload) => {
      if (!token) throw new Error("No token");
      return createProfile(token, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProfilePayload }) => {
      if (!token) throw new Error("No token");
      return updateProfile(token, id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) => {
      if (!token) throw new Error("No token");
      return duplicateProfile(token, id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error("No token");
      return deleteProfile(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  return {
    createProfile: createMutation,
    updateProfile: updateMutation,
    duplicateProfile: duplicateMutation,
    deleteProfile: deleteMutation,
  };
}
