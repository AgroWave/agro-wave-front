import { Edit2, Loader2, Mountain, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { ResourceList } from "../../components/layout/ResourceList";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card";
import {
  boundsDimensionsKm,
  type CreateDemFormData,
  type Dem,
} from "../../domain/terrain";
import { t } from "../../i18n";
import { DemDownloadModal } from "./DemDownloadModal";
import { DemEditModal } from "./DemEditModal";
import { useDemMutations, useDems } from "./useDems";

/**
 * Page displaying user-downloaded DEM datasets with 3-second polling for active downloads (AC-03-14).
 * @returns Rendered DEM datasets management view.
 */
export function DemsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDownloadingModalOpen, setIsDownloadingModalOpen] = React.useState(false);
  const [editingDem, setEditingDem] = React.useState<Dem | null>(null);
  const [deletingDemId, setDeletingDemId] = React.useState<string | null>(null);

  const { data: dems = [], isLoading } = useDems(searchQuery || undefined);
  const { createDem, updateDem, deleteDem } = useDemMutations();

  const handleDownload = async (data: CreateDemFormData) => {
    await createDem.mutateAsync({
      name: data.name,
      description: data.description || null,
      bounds: {
        south: data.south,
        west: data.west,
        north: data.north,
        east: data.east,
      },
    });
  };

  const handleUpdate = async (data: { name: string; description: string | null }) => {
    if (!editingDem) return;
    await updateDem.mutateAsync({
      id: editingDem.id,
      payload: data,
    });
  };

  const handleDelete = async (demId: string) => {
    if (window.confirm(t("dem.delete_confirm"))) {
      setDeletingDemId(demId);
      try {
        await deleteDem.mutateAsync(demId);
      } finally {
        setDeletingDemId(null);
      }
    }
  };

  const renderStatusBadge = (status: Dem["status"]) => {
    switch (status) {
      case "DOWNLOADING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-sky-500/10 text-sky-400 border-sky-500/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("dem.status_downloading")}
          </span>
        );
      case "AVAILABLE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            {t("dem.status_available")}
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-rose-500/10 text-rose-400 border-rose-500/20">
            {t("dem.status_failed")}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("dem.title")} subtitle={t("dem.subtitle")} />

      <ResourceList<Dem>
        items={dems}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("dem.search_placeholder")}
        actionSlot={
          <Button
            variant="primary"
            onClick={() => setIsDownloadingModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("dem.download_button")}
          </Button>
        }
        keyExtractor={(item) => item.id}
        renderItem={(dem) => {
          const dims = boundsDimensionsKm(dem.bounds);
          return (
            <Card className="flex flex-col justify-between hover:border-slate-700 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1 pr-2">
                  <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{dem.name}</span>
                  </CardTitle>
                  {dem.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {dem.description}
                    </p>
                  )}
                </div>
                {renderStatusBadge(dem.status)}
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-slate-300">
                <div className="rounded-lg bg-slate-950/60 p-2.5 space-y-1 font-mono text-[11px] text-slate-400 border border-slate-800/80">
                  <div className="flex justify-between">
                    <span>{t("dem.bounds_label")}</span>
                    <span className="text-slate-200">
                      [{dem.bounds.south.toFixed(2)}, {dem.bounds.west.toFixed(2)}] a [
                      {dem.bounds.north.toFixed(2)}, {dem.bounds.east.toFixed(2)}]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("dem.dimensions_label")}</span>
                    <span className="text-slate-200">
                      ~{dims.widthKm.toFixed(1)} km × ~{dims.heightKm.toFixed(1)} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("dem.resolution_label")}</span>
                    <span className="text-slate-200">{dem.resolution_m} m</span>
                  </div>
                  {dem.size_bytes && (
                    <div className="flex justify-between">
                      <span>{t("dem.size_label")}</span>
                      <span className="text-slate-200">
                        {(dem.size_bytes / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                </div>

                {dem.failure_reason && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    {dem.failure_reason}
                  </p>
                )}
              </CardContent>

              <CardFooter className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingDem(dem)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t("dem.edit_action")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(dem.id)}
                  isLoading={deletingDemId === dem.id}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("dem.delete_action")}
                </Button>
              </CardFooter>
            </Card>
          );
        }}
      />

      {isDownloadingModalOpen && (
        <DemDownloadModal
          onClose={() => setIsDownloadingModalOpen(false)}
          onSubmit={handleDownload}
        />
      )}

      {editingDem && (
        <DemEditModal
          dem={editingDem}
          onClose={() => setEditingDem(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}
