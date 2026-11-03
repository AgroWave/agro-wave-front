import { Copy, Edit2, Layers, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { ResourceList } from "../../components/layout/ResourceList";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card";
import type { LpwanProfile, ProfileFormData } from "../../domain/profiles";
import { t } from "../../i18n";
import { ProfileForm } from "./ProfileForm";
import { ProfileTemplates } from "./ProfileTemplates";
import { useProfileMutations, useProfiles } from "./useProfiles";

/**
 * LPWAN profiles catalog page with listing, filtering, creation, and equipment templates (AC-02-11).
 * @returns Rendered profiles management view.
 */
export function ProfilesPage() {
  const [ownerFilter, setOwnerFilter] = React.useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [activeTemplatesProfile, setActiveTemplatesProfile] = React.useState<LpwanProfile | null>(null);
  const [editingProfile, setEditingProfile] = React.useState<LpwanProfile | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const { data: profiles = [], isLoading } = useProfiles(
    ownerFilter ? { owner: ownerFilter } : undefined
  );
  const { createProfile, updateProfile, duplicateProfile, deleteProfile } = useProfileMutations();

  const filteredProfiles = React.useMemo(() => {
    if (!searchQuery) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(
      (p) => p.name.toLowerCase().includes(q) || p.technology.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const handleCreate = async (data: ProfileFormData) => {
    await createProfile.mutateAsync({
      name: data.name,
      technology: data.technology,
      reference_sensitivity_dbm: data.reference_sensitivity_dbm,
      spreading_factor: data.spreading_factor,
      bands: data.bands,
    });
  };

  const handleUpdate = async (data: ProfileFormData) => {
    if (!editingProfile) return;
    await updateProfile.mutateAsync({
      id: editingProfile.id,
      payload: {
        name: data.name,
        reference_sensitivity_dbm: data.reference_sensitivity_dbm,
        spreading_factor: data.spreading_factor,
        bands: data.bands,
      },
    });
  };

  const handleDuplicate = async (profile: LpwanProfile) => {
    await duplicateProfile.mutateAsync({
      id: profile.id,
    });
  };

  const handleDelete = async (profileId: string) => {
    if (window.confirm(t("profiles.delete_confirm"))) {
      await deleteProfile.mutateAsync(profileId);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("profiles.title")}
        description={t("profiles.subtitle")}
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("profiles.new_profile")}
          </Button>
        }
      />

      <ResourceList<LpwanProfile>
        items={filteredProfiles}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("profiles.search_placeholder")}
        keyExtractor={(p) => p.id}
        filterSlot={
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setOwnerFilter(undefined)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                ownerFilter === undefined
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("profiles.filter_all")}
            </button>
            <button
              onClick={() => setOwnerFilter("predefined")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                ownerFilter === "predefined"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("profiles.filter_predefined")}
            </button>
            <button
              onClick={() => setOwnerFilter("mine")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                ownerFilter === "mine"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("profiles.filter_mine")}
            </button>
          </div>
        }
        renderItem={(profile) => (
          <Card
            key={profile.id}
            data-testid={`profile-card-${profile.id}`}
            className="flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-bold text-white leading-tight">
                  {profile.name}
                </CardTitle>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    profile.is_predefined
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {profile.is_predefined
                    ? t("profiles.predefined_badge")
                    : t("profiles.custom_badge")}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                {profile.technology}
                {profile.spreading_factor && ` • SF${profile.spreading_factor}`}
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5 text-xs text-slate-300 py-2">
              <div>
                <span className="text-slate-500 block">
                  {t("profiles.sensitivity_label")}
                </span>
                <span className="font-semibold text-slate-100">
                  {profile.reference_sensitivity_dbm} dBm{" "}
                  <span className="text-amber-400/90 font-normal italic">
                    ({t("profiles.to_verify")})
                  </span>
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">{t("profiles.bands_label")}</span>
                <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                  {profile.bands.map((b) => (
                    <span
                      key={b.code}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300"
                    >
                      {b.code}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
              <Button
                variant="outline"
                size="sm"
                data-testid={`view-templates-${profile.id}`}
                onClick={() => setActiveTemplatesProfile(profile)}
                className="w-full text-xs"
              >
                <Layers className="w-3.5 h-3.5 mr-1.5" />
                {t("profiles.view_templates_action")}
              </Button>

              <div className="flex items-center gap-1.5 w-full">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDuplicate(profile)}
                  className="flex-1 text-xs"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  {t("profiles.duplicate_action")}
                </Button>

                {!profile.is_predefined && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfile(profile)}
                      className="text-xs px-2.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      {t("profiles.edit_action")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(profile.id)}
                      className="text-xs px-2.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      {t("profiles.delete_action")}
                    </Button>
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
        )}
      />

      {/* Modals */}
      {isCreating && (
        <ProfileForm
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreate}
          title={t("profiles.create_title")}
        />
      )}

      {editingProfile && (
        <ProfileForm
          initialProfile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSubmit={handleUpdate}
          title={t("profiles.edit_title")}
        />
      )}

      {activeTemplatesProfile && (
        <ProfileTemplates
          profile={activeTemplatesProfile}
          onClose={() => setActiveTemplatesProfile(null)}
        />
      )}
    </div>
  );
}

