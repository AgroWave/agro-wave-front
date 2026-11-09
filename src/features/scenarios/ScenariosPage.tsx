import {
  Copy,
  Edit3,
  GitBranch,
  MapPin,
  Plus,
  Radio,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/layout/PageHeader";
import { ResourceList } from "../../components/layout/ResourceList";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import type { Scenario } from "../../domain/scenarios";
import { boundsDimensionsKm } from "../../domain/terrain";
import { t } from "../../i18n";
import { useProfiles } from "../profiles/useProfiles";
import { CreateVariantModal } from "./CreateVariantModal";
import { useScenarioMutations, useScenarios } from "./useScenarios";

/**
 * Catalog page listing all user scenarios with search, technology filter, duplicate, create variant, and delete (UC-SC-05, AC-04-04).
 * @returns Rendered scenarios catalog view.
 */
export function ScenariosPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [techFilter, setTechFilter] = React.useState<string>("");
  const [variantSource, setVariantSource] = React.useState<Scenario | null>(
    null
  );
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { data: scenarios = [], isLoading } = useScenarios();
  const { data: profiles = [] } = useProfiles();
  const { duplicateScenario, createScenarioVariant, deleteScenario } =
    useScenarioMutations();

  const filteredScenarios = React.useMemo(() => {
    return scenarios.filter((sc) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesName = sc.name.toLowerCase().includes(q);
        const matchesDesc = (sc.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      if (techFilter) {
        if (sc.radio_config?.technology !== techFilter) return false;
      }
      return true;
    });
  }, [scenarios, searchQuery, techFilter]);

  const handleDuplicate = async (scenario: Scenario) => {
    await duplicateScenario.mutateAsync({
      id: scenario.id,
      name: `${scenario.name} (Copia)`,
    });
  };

  const handleCreateVariant = async (payload: {
    target_profile_id: string;
    band_code: string;
    frequency_mhz: number;
    name: string;
  }) => {
    if (!variantSource) return;
    await createScenarioVariant.mutateAsync({
      id: variantSource.id,
      payload,
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("scenarios.delete_confirm"))) {
      setDeletingId(id);
      try {
        await deleteScenario.mutateAsync(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("scenarios.title")}
        subtitle={t("scenarios.subtitle")}
      />

      <ResourceList<Scenario>
        items={filteredScenarios}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("scenarios.search_placeholder")}
        filtersSlot={
          <select
            aria-label="Filtro de tecnología"
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">{t("scenarios.filter_all")}</option>
            <option value="LORAWAN">LoRaWAN</option>
            <option value="NB_IOT">NB-IoT</option>
            <option value="LTE_M">LTE-M</option>
          </select>
        }
        actionSlot={
          <Button
            variant="primary"
            onClick={() => navigate("/scenarios/new")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("scenarios.new_button")}
          </Button>
        }
        keyExtractor={(sc) => sc.id}
        renderItem={(scenario) => {
          const dims = boundsDimensionsKm(scenario.bounds);
          const totalNodes =
            scenario.access_nodes.length + scenario.end_nodes.length;
          return (
            <Card className="flex flex-col justify-between hover:border-slate-700 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1 pr-2">
                  <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{scenario.name}</span>
                  </CardTitle>
                  {scenario.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {scenario.description}
                    </p>
                  )}
                </div>

                {scenario.radio_config ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <Radio className="w-3 h-3" />
                    {scenario.radio_config.technology} ·{" "}
                    {scenario.radio_config.frequency_mhz} MHz
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-800 text-slate-400 border-slate-700">
                    {t("scenarios.no_profile_badge")}
                  </span>
                )}
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-slate-300">
                <div className="rounded-lg bg-slate-950/60 p-2.5 space-y-1 font-mono text-[11px] text-slate-400 border border-slate-800/80">
                  <div className="flex justify-between">
                    <span>{t("dem.dimensions_label")}</span>
                    <span className="text-slate-200">
                      ~{dims.widthKm.toFixed(1)} km × ~{dims.heightKm.toFixed(1)}{" "}
                      km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Despliegue:</span>
                    <span className="text-slate-200">
                      {totalNodes} {t("scenarios.nodes_count")} ·{" "}
                      {scenario.links.length} {t("scenarios.links_count")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("scenarios.comparison_group")}</span>
                    <span className="text-slate-300">
                      {scenario.comparison_group_id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-800/80 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/scenarios/${scenario.id}`)}
                  className="text-xs flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {t("scenarios.open_action")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(scenario)}
                  className="text-xs flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {t("scenarios.duplicate_action")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVariantSource(scenario)}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  {t("scenarios.variant_action")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(scenario.id)}
                  isLoading={deletingId === scenario.id}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("scenarios.delete_action")}
                </Button>
              </CardFooter>
            </Card>
          );
        }}
      />

      {variantSource && (
        <CreateVariantModal
          scenario={variantSource}
          profiles={profiles}
          onClose={() => setVariantSource(null)}
          onSubmit={handleCreateVariant}
        />
      )}
    </div>
  );
}

