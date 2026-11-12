import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Edit2,
  GitBranch,
  Play,
  Plus,
  Radio,
  Save,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import type { Polarization } from "../../domain/profiles";
import {
  doesDemCoverArea,
  groupLinksByStar,
  hasValidAntennaHeight,
  hasValidLinkDistance,
  isNodeInsideArea,
  type AccessNode,
  type EndNode,
} from "../../domain/scenarios";
import {
  boundsDimensionsKm,
  hasMinimumDimensions,
  isWithinContinentalColombia,
} from "../../domain/terrain";
import { t } from "../../i18n";
import { useDemMutations, useDems } from "../dem/useDems";
import { useProfiles, useProfileTemplates } from "../profiles/useProfiles";
import { CreateVariantModal } from "./CreateVariantModal";
import { NodeEditModal } from "./NodeEditModal";
import { ScenarioMap } from "./ScenarioMap";
import {
  useScenarioDraftStore,
  type ScenarioEditorStep,
} from "./useScenarioDraftStore";
import {
  useScenario,
  useScenarioMutations,
  useScenarioValidation,
} from "./useScenarios";
import { useSimulationMutations } from "../simulations/useSimulations";

/**
 * Step-by-step scenario editor with Leaflet map, star topology deployment, and Longley-Rice configuration (UC-SC-01..04).
 * @returns Rendered scenario editor page.
 */
export function ScenarioEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const { data: existingScenario, isLoading: isLoadingScenario } = useScenario(id);
  const { data: validationResult } = useScenarioValidation(id);
  const { data: dems = [] } = useDems();
  const { createDem } = useDemMutations();
  const { data: profiles = [] } = useProfiles();
  const {
    createScenario,
    updateScenario,
    duplicateScenario,
    createScenarioVariant,
  } = useScenarioMutations();
  const { createAndRunMutation } = useSimulationMutations();

  const draft = useScenarioDraftStore();
  const { resetDraft, loadFromScenario } = draft;
  const { data: templates = [] } = useProfileTemplates(draft.profileId);

  const [errorBanner, setErrorBanner] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = React.useState(false);
  const [editingNodeData, setEditingNodeData] = React.useState<{
    node: AccessNode | EndNode;
    role: "ACCESS_NODE" | "END_NODE";
  } | null>(null);

  // Forms for adding AccessNode and EndNode+Link
  const [newAnName, setNewAnName] = React.useState("GW-1");
  const [newAnLat, setNewAnLat] = React.useState(4.6);
  const [newAnLng, setNewAnLng] = React.useState(-74.1);
  const [newAnHeight, setNewAnHeight] = React.useState(15.0);
  const newAnAntennaRef = "Dragino Outdoor";
  const [newAnGain, setNewAnGain] = React.useState(5.5);
  const newAnPol: Polarization = "VERTICAL";
  const [newAnSens, setNewAnSens] = React.useState(-137.0);

  const [newEnName, setNewEnName] = React.useState("Sensor-1");
  const [newEnLat, setNewEnLat] = React.useState(4.62);
  const [newEnLng, setNewEnLng] = React.useState(-74.08);
  const [newEnHeight, setNewEnHeight] = React.useState(2.0);
  const [newEnAntennaRef, setNewEnAntennaRef] = React.useState("Taoglas");
  const [newEnGain, setNewEnGain] = React.useState(1.1);
  const [newEnPol, setNewEnPol] = React.useState<Polarization>("VERTICAL");
  const [newEnTxPower, setNewEnTxPower] = React.useState(20.0);
  const [newEnTxTol, setNewEnTxTol] = React.useState(1.5);
  const [newEnTemplateId, setNewEnTemplateId] = React.useState<string>("");
  const [targetAnId, setTargetAnId] = React.useState<string>("");

  React.useEffect(() => {
    if (isNew) {
      resetDraft();
    } else if (existingScenario) {
      loadFromScenario(existingScenario);
    }
  }, [isNew, existingScenario, resetDraft, loadFromScenario]);

  React.useEffect(() => {
    if (draft.accessNodes.length > 0 && !targetAnId) {
      setTargetAnId(draft.accessNodes[0].id);
    }
  }, [draft.accessNodes, targetAnId]);

  const selectedProfile =
    profiles.find((p) => p.id === draft.profileId) || null;

  const coveringDems = React.useMemo(
    () => dems.filter((d) => doesDemCoverArea(d.bounds, draft.bounds)),
    [dems, draft.bounds]
  );

  const selectedDem = dems.find((d) => d.id === draft.demId) || null;

  const stars = React.useMemo(
    () => groupLinksByStar(draft.accessNodes, draft.endNodes, draft.links),
    [draft.accessNodes, draft.endNodes, draft.links]
  );

  // Compute live client-side simulation causes to combine with server validation
  const liveBlockingCauses = React.useMemo(() => {
    const list: string[] = [];
    if (!hasMinimumDimensions(draft.bounds)) {
      list.push(t("scenarios.errors.AreaTooSmall"));
    }
    if (!isWithinContinentalColombia(draft.bounds)) {
      list.push(t("scenarios.errors.AreaOutsideColombia"));
    }
    if (!draft.demId || !selectedDem) {
      list.push("Selecciona o descarga un DEM que cubra el área (RN-26).");
    } else if (selectedDem.status !== "AVAILABLE") {
      list.push(t("scenarios.errors.DemNotAvailable"));
    } else if (!doesDemCoverArea(selectedDem.bounds, draft.bounds)) {
      list.push(t("scenarios.errors.DemDoesNotCoverArea"));
    }
    if (!draft.profileId) {
      list.push("Selecciona un perfil LPWAN para el escenario (RN-15).");
    }
    if (draft.links.length === 0) {
      list.push("Añade al menos un enlace uplink End Node → Access Node.");
    }
    if (!Number.isFinite(draft.propagationParams.ens0) || draft.propagationParams.ens0 <= 0) {
      list.push("El parámetro ens0 (refractividad superficial) es obligatorio.");
    }
    return list;
  }, [draft, selectedDem]);

  const handleSave = async () => {
    setErrorBanner(null);
    setSuccessBanner(null);
    setIsSaving(true);
    try {
      const payload = {
        name: draft.name.trim() || "Escenario sin título",
        description: draft.description.trim() || null,
        bounds: draft.bounds,
        dem_id: draft.demId,
        profile_id: draft.profileId,
        band_code: draft.bandCode || null,
        frequency_mhz: draft.profileId ? Number(draft.frequencyMhz) : null,
        access_nodes: draft.accessNodes,
        end_nodes: draft.endNodes,
        links: draft.links,
        propagation_setup: {
          model_id: "LONGLEY_RICE",
          schema_version: 1,
          parameters: draft.propagationParams,
        },
      };

      if (isNew) {
        const created = await createScenario.mutateAsync(payload);
        setSuccessBanner(t("scenarios.saved_success"));
        navigate(`/scenarios/${created.id}`, { replace: true });
      } else if (id) {
        await updateScenario.mutateAsync({ id, payload });
        setSuccessBanner(t("scenarios.saved_success"));
      }
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      const code = apiErr?.code || "generic";
      setErrorBanner(
        t(`scenarios.errors.${code}`, apiErr?.message || t("scenarios.errors.generic"))
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadDemForArea = async () => {
    setErrorBanner(null);
    try {
      const createdDem = await createDem.mutateAsync({
        name: `DEM - ${draft.name || "Escenario"}`,
        description: "Descargado desde el editor de escenarios",
        bounds: draft.bounds,
      });
      draft.setDemId(createdDem.id);
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      setErrorBanner(apiErr?.message || t("dem.errors.generic"));
    }
  };

  const handleProfileSelect = (newProfId: string) => {
    if (!newProfId) {
      draft.setRadioConfig(null, "", 915.0);
      return;
    }
    const prof = profiles.find((p) => p.id === newProfId);
    if (!prof) return;
    const band = prof.bands[0];
    const code = band?.code || "";
    const freq =
      band && band.min_mhz !== null && band.max_mhz !== null
        ? Number(((band.min_mhz + band.max_mhz) / 2).toFixed(2))
        : 915.0;
    draft.setRadioConfig(prof.id, code, freq);
    setNewAnSens(prof.reference_sensitivity_dbm);
  };

  const handleApplyEndTemplate = (tplId: string) => {
    setNewEnTemplateId(tplId);
    const tpl = templates.find((item) => item.id === tplId);
    if (!tpl) return;
    if (tpl.antenna.reference) setNewEnAntennaRef(tpl.antenna.reference);
    if (tpl.antenna.gain_dbi !== null) setNewEnGain(tpl.antenna.gain_dbi);
    if (tpl.antenna.polarization) setNewEnPol(tpl.antenna.polarization);
    if (tpl.tx_power) {
      setNewEnTxPower(tpl.tx_power.nominal_dbm);
      setNewEnTxTol(tpl.tx_power.tolerance_db);
    }
  };

  const handleAddAccessNode = () => {
    setErrorBanner(null);
    if (!isNodeInsideArea(newAnLat, newAnLng, draft.bounds)) {
      setErrorBanner(t("scenarios.errors.NodeOutsideArea"));
      return;
    }
    if (!hasValidAntennaHeight(newAnHeight)) {
      setErrorBanner(t("scenarios.errors.HeightBelowMinimum"));
      return;
    }
    const newNode: AccessNode = {
      id: crypto.randomUUID(),
      name: newAnName.trim() || `GW-${draft.accessNodes.length + 1}`,
      lat: Number(newAnLat),
      lng: Number(newAnLng),
      height_agl_m: Number(newAnHeight),
      antenna_ref: newAnAntennaRef || null,
      antenna_gain_dbi: Number(newAnGain),
      polarization: newAnPol,
      sensitivity_dbm: Number(newAnSens),
      sensitivity_origin:
        selectedProfile &&
        Number(newAnSens) === selectedProfile.reference_sensitivity_dbm
          ? "REFERENCE_TO_VERIFY"
          : "USER_DEFINED",
    };
    draft.addAccessNode(newNode);
    setTargetAnId(newNode.id);
    setNewAnName(`GW-${draft.accessNodes.length + 2}`);
  };

  const handleAddEndNodeAndLink = () => {
    setErrorBanner(null);
    const an = draft.accessNodes.find((item) => item.id === targetAnId);
    if (!an) {
      setErrorBanner("Primero añade y selecciona un Access Node.");
      return;
    }
    if (!isNodeInsideArea(newEnLat, newEnLng, draft.bounds)) {
      setErrorBanner(t("scenarios.errors.NodeOutsideArea"));
      return;
    }
    if (!hasValidAntennaHeight(newEnHeight)) {
      setErrorBanner(t("scenarios.errors.HeightBelowMinimum"));
      return;
    }
    if (!hasValidLinkDistance(newEnLat, newEnLng, an.lat, an.lng)) {
      setErrorBanner(t("scenarios.errors.LinkTooShort"));
      return;
    }
    const endNode: EndNode = {
      id: crypto.randomUUID(),
      name: newEnName.trim() || `Sensor-${draft.endNodes.length + 1}`,
      lat: Number(newEnLat),
      lng: Number(newEnLng),
      height_agl_m: Number(newEnHeight),
      antenna_ref: newEnAntennaRef || null,
      antenna_gain_dbi: Number(newEnGain),
      polarization: newEnPol,
      tx_power_nominal_dbm: Number(newEnTxPower),
      tx_power_tolerance_db: Number(newEnTxTol),
      source_template_id: newEnTemplateId || null,
    };
    draft.addEndNodeWithLink(endNode, an.id);
    setNewEnName(`Sensor-${draft.endNodes.length + 2}`);
  };

  const handleMoveNode = (
    role: "ACCESS_NODE" | "END_NODE",
    nodeId: string,
    lat: number,
    lng: number
  ) => {
    setErrorBanner(null);
    if (!isNodeInsideArea(lat, lng, draft.bounds)) {
      setErrorBanner(t("scenarios.errors.NodeOutsideArea"));
      return;
    }
    if (role === "ACCESS_NODE") {
      draft.updateAccessNode(nodeId, { lat, lng });
    } else {
      draft.updateEndNode(nodeId, { lat, lng });
    }
  };

  if (!isNew && isLoadingScenario) {
    return (
      <div className="p-8 text-center text-slate-400">
        Cargando escenario...
      </div>
    );
  }

  const dims = boundsDimensionsKm(draft.bounds);
  const steps: Array<{ key: ScenarioEditorStep; label: string }> = [
    { key: "data", label: t("scenarios.step_data") },
    { key: "terrain", label: t("scenarios.step_terrain") },
    { key: "profile", label: t("scenarios.step_profile") },
    { key: "deployment", label: t("scenarios.step_deployment") },
    { key: "propagation", label: t("scenarios.step_propagation") },
  ];

  const isSimulable =
    liveBlockingCauses.length === 0 &&
    (!validationResult || validationResult.simulable);

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/scenarios")}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("scenarios.back_to_list")}
          </Button>
          <h1 className="text-xl font-bold text-slate-100">
            {isNew
              ? t("scenarios.editor_new_title")
              : `${t("scenarios.editor_edit_title")}: ${draft.name}`}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && existingScenario && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const dup = await duplicateScenario.mutateAsync({
                    id: existingScenario.id,
                  });
                  navigate(`/scenarios/${dup.id}`);
                }}
                className="flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                {t("scenarios.duplicate_action")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsVariantModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <GitBranch className="w-4 h-4" />
                {t("scenarios.variant_action")}
              </Button>
            </>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {t("scenarios.save_button")}
          </Button>
        </div>
      </div>

      {/* Banners */}
      {errorBanner && (
        <div className="rounded-none bg-rose-50 border border-rose-300 border-l-4 border-l-rose-700 p-3 text-sm text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}
      {successBanner && (
        <div className="rounded-none bg-emerald-50 border border-emerald-300 border-l-4 border-l-emerald-700 p-3 text-sm text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Stepper Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-300 pb-0">
        {steps.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => draft.setActiveStep(s.key)}
            className={`px-4 py-2.5 rounded-none text-xs transition-colors border-t-2 cursor-pointer ${
              draft.activeStep === s.key
                ? "bg-white text-[#8b1919] font-bold border-t-[#8b1919] border-x border-b-0 border-slate-300 shadow-2xs -mb-px"
                : "bg-[#eae9e6] text-[#0f172a] font-semibold hover:bg-[#dedcd7] border-t-transparent border-x border-b border-slate-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main Split Editor: Left Stepper Panel + Right Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-4">
          {draft.activeStep === "data" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("scenarios.area_section_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label={t("scenarios.name_label")}
                  value={draft.name}
                  onChange={(e) =>
                    draft.setMetadata(e.target.value, draft.description)
                  }
                  required
                />
                <Input
                  label={t("scenarios.description_label")}
                  value={draft.description}
                  onChange={(e) =>
                    draft.setMetadata(draft.name, e.target.value)
                  }
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Input
                    label={t("dem.south_label")}
                    type="number"
                    step="0.01"
                    value={draft.bounds.south}
                    onChange={(e) =>
                      draft.setBounds({
                        ...draft.bounds,
                        south: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    label={t("dem.west_label")}
                    type="number"
                    step="0.01"
                    value={draft.bounds.west}
                    onChange={(e) =>
                      draft.setBounds({
                        ...draft.bounds,
                        west: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    label={t("dem.north_label")}
                    type="number"
                    step="0.01"
                    value={draft.bounds.north}
                    onChange={(e) =>
                      draft.setBounds({
                        ...draft.bounds,
                        north: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    label={t("dem.east_label")}
                    type="number"
                    step="0.01"
                    value={draft.bounds.east}
                    onChange={(e) =>
                      draft.setBounds({
                        ...draft.bounds,
                        east: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="rounded-none bg-[#f8f9fb] p-3 text-xs text-[#1e293b] border border-slate-300 space-y-1">
                  <div className="font-semibold text-[#0f172a]">
                    Dimensiones: ~{dims.widthKm.toFixed(2)} km × ~
                    {dims.heightKm.toFixed(2)} km
                  </div>
                  {!hasMinimumDimensions(draft.bounds) && (
                    <div className="text-rose-600 font-medium">
                      {t("dem.area_warning_too_small")}
                    </div>
                  )}
                  {!isWithinContinentalColombia(draft.bounds) && (
                    <div className="text-rose-600 font-medium">
                      {t("dem.area_warning_outside_colombia")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {draft.activeStep === "terrain" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("scenarios.terrain_section_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1e293b]">
                    {t("scenarios.select_dem_label")}
                  </label>
                  <select
                    value={draft.demId || ""}
                    onChange={(e) => draft.setDemId(e.target.value || null)}
                    className="w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#8b1919] focus:outline-none"
                  >
                    <option value="">-- Sin DEM asignado --</option>
                    {coveringDems.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>

                {coveringDems.length === 0 && (
                  <p className="text-xs text-amber-700 font-medium">
                    {t("scenarios.no_covering_dems")}
                  </p>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDownloadDemForArea}
                  isLoading={createDem.isPending}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t("scenarios.download_dem_for_area")}
                </Button>

                {selectedDem && (
                  <div className="rounded-none bg-[#f8f9fb] p-3 text-xs text-[#1e293b] border border-slate-300 space-y-1">
                    <div className="font-semibold text-[#0f172a]">
                      DEM Seleccionado: {selectedDem.name}
                    </div>
                    <div>Estado: {selectedDem.status}</div>
                    <div>
                      Ventana de recorte (RN-27): [{draft.bounds.south.toFixed(2)},{" "}
                      {draft.bounds.west.toFixed(2)}] a [
                      {draft.bounds.north.toFixed(2)}, {draft.bounds.east.toFixed(2)}]
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {draft.activeStep === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("scenarios.profile_section_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1e293b]">
                    {t("scenarios.select_profile_label")}
                  </label>
                  <select
                    value={draft.profileId || ""}
                    onChange={(e) => handleProfileSelect(e.target.value)}
                    className="w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#8b1919] focus:outline-none"
                  >
                    <option value="">-- Seleccionar Perfil LPWAN --</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.technology} | Sens:{" "}
                        {p.reference_sensitivity_dbm} dBm)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProfile && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#1e293b]">
                        {t("scenarios.select_band_label")}
                      </label>
                      <select
                        value={draft.bandCode}
                        onChange={(e) =>
                          draft.setRadioConfig(
                            draft.profileId,
                            e.target.value,
                            draft.frequencyMhz
                          )
                        }
                        className="w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#8b1919] focus:outline-none"
                      >
                        {selectedProfile.bands.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.code}
                            {b.min_mhz !== null && b.max_mhz !== null
                              ? ` (${b.min_mhz}–${b.max_mhz} MHz)`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label={t("scenarios.frequency_label")}
                      type="number"
                      step="0.01"
                      value={draft.frequencyMhz}
                      onChange={(e) =>
                        draft.setRadioConfig(
                          draft.profileId,
                          draft.bandCode,
                          Number(e.target.value)
                        )
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {draft.activeStep === "deployment" && (
            <div className="space-y-4">
              {/* Add Access Node Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {t("scenarios.add_access_node")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label={t("scenarios.node_name_label")}
                      value={newAnName}
                      onChange={(e) => setNewAnName(e.target.value)}
                    />
                    <Input
                      label={t("scenarios.height_agl_label")}
                      type="number"
                      step="0.5"
                      value={newAnHeight}
                      onChange={(e) => setNewAnHeight(Number(e.target.value))}
                    />
                    <Input
                      label={t("scenarios.lat_label")}
                      type="number"
                      step="0.001"
                      value={newAnLat}
                      onChange={(e) => setNewAnLat(Number(e.target.value))}
                    />
                    <Input
                      label={t("scenarios.lng_label")}
                      type="number"
                      step="0.001"
                      value={newAnLng}
                      onChange={(e) => setNewAnLng(Number(e.target.value))}
                    />
                    <Input
                      label={t("scenarios.antenna_gain_label")}
                      type="number"
                      step="0.1"
                      value={newAnGain}
                      onChange={(e) => setNewAnGain(Number(e.target.value))}
                    />
                    <Input
                      label={t("scenarios.sensitivity_label")}
                      type="number"
                      step="0.5"
                      value={newAnSens}
                      onChange={(e) => setNewAnSens(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddAccessNode}
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {t("scenarios.add_access_node")}
                  </Button>
                </CardContent>
              </Card>

              {/* Add End Node + Link Card */}
              {draft.accessNodes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t("scenarios.add_end_node_link")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {templates.filter((tpl) => tpl.role === "END_NODE").length >
                      0 && (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#1e293b]">
                          {t("scenarios.apply_template_label")}
                        </label>
                        <select
                          value={newEnTemplateId}
                          onChange={(e) => handleApplyEndTemplate(e.target.value)}
                          className="w-full rounded-xs border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-[#0f172a] focus:border-[#8b1919] focus:outline-none"
                        >
                          <option value="">-- Personalizado --</option>
                          {templates
                            .filter((tpl) => tpl.role === "END_NODE")
                            .map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.name} ({tpl.tx_power?.nominal_dbm ?? 20} dBm)
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#1e293b]">
                        {t("scenarios.target_access_node_label")}
                      </label>
                      <select
                        value={targetAnId}
                        onChange={(e) => setTargetAnId(e.target.value)}
                        className="w-full rounded-xs border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-[#0f172a] focus:border-[#8b1919] focus:outline-none"
                      >
                        {draft.accessNodes.map((an) => (
                          <option key={an.id} value={an.id}>
                            {an.name} ({an.lat.toFixed(3)}, {an.lng.toFixed(3)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label={t("scenarios.node_name_label")}
                        value={newEnName}
                        onChange={(e) => setNewEnName(e.target.value)}
                      />
                      <Input
                        label={t("scenarios.height_agl_label")}
                        type="number"
                        step="0.5"
                        value={newEnHeight}
                        onChange={(e) => setNewEnHeight(Number(e.target.value))}
                      />
                      <Input
                        label={t("scenarios.lat_label")}
                        type="number"
                        step="0.001"
                        value={newEnLat}
                        onChange={(e) => setNewEnLat(Number(e.target.value))}
                      />
                      <Input
                        label={t("scenarios.lng_label")}
                        type="number"
                        step="0.001"
                        value={newEnLng}
                        onChange={(e) => setNewEnLng(Number(e.target.value))}
                      />
                      <Input
                        label={t("scenarios.antenna_gain_label")}
                        type="number"
                        step="0.1"
                        value={newEnGain}
                        onChange={(e) => setNewEnGain(Number(e.target.value))}
                      />
                      <Input
                        label={t("scenarios.tx_power_label")}
                        type="number"
                        step="0.5"
                        value={newEnTxPower}
                        onChange={(e) =>
                          setNewEnTxPower(Number(e.target.value))
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddEndNodeAndLink}
                      className="w-full flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      {t("scenarios.add_end_node_link")}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Stars Tree View (AC-12) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {t("scenarios.deployment_section_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stars.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      {t("scenarios.no_stars_yet")}
                    </p>
                  ) : (
                    stars.map((star) => (
                      <div
                        key={star.accessNode.id}
                        className="rounded-none border border-slate-300 bg-white p-3 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-[#8b1919]" />
                            <span>{star.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingNodeData({
                                  node: star.accessNode,
                                  role: "ACCESS_NODE",
                                })
                              }
                              className="text-slate-500 hover:text-[#0f172a] text-xs flex items-center gap-1 cursor-pointer"
                              title="Editar Gateway"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                draft.removeAccessNode(star.accessNode.id)
                              }
                              className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1 cursor-pointer"
                              title="Eliminar Gateway"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {star.items.length === 0 ? (
                          <p className="text-[11px] text-amber-700">
                            Sin End Nodes conectados (añade al menos 1 enlace para
                            evitar nodo huérfano RN-18).
                          </p>
                        ) : (
                          <div className="space-y-1.5 pl-2 border-l-2 border-slate-300">
                            {star.items.map((item) => (
                              <div
                                key={item.link.id}
                                className="flex items-center justify-between text-xs text-[#1e293b] bg-[#f8f9fb] px-2.5 py-1.5 rounded-none border border-slate-300"
                              >
                                <div>
                                  <span className="font-semibold text-[#0f172a]">
                                    {item.endNode.name}
                                  </span>{" "}
                                  → {star.accessNode.name}{" "}
                                  <span className="text-slate-500 font-mono text-[11px]">
                                    ({item.distanceKm.toFixed(2)} km ·{" "}
                                    {item.endNode.tx_power_nominal_dbm} dBm)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingNodeData({
                                        node: item.endNode,
                                        role: "END_NODE",
                                      })
                                    }
                                    className="text-slate-500 hover:text-[#0f172a] cursor-pointer"
                                    title="Editar Nodo"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      draft.removeEndNode(item.endNode.id)
                                    }
                                    className="text-rose-600 hover:text-rose-800 cursor-pointer"
                                    title="Eliminar Nodo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {draft.activeStep === "propagation" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("scenarios.propagation_section_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  label={t("scenarios.ens0_label")}
                  type="number"
                  step="1"
                  value={draft.propagationParams.ens0}
                  onChange={(e) =>
                    draft.setPropagationParams({ ens0: Number(e.target.value) })
                  }
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t("scenarios.eps_label")}
                    type="number"
                    step="0.5"
                    value={draft.propagationParams.eps}
                    onChange={(e) =>
                      draft.setPropagationParams({
                        eps: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    label={t("scenarios.sgm_label")}
                    type="number"
                    step="0.001"
                    value={draft.propagationParams.sgm}
                    onChange={(e) =>
                      draft.setPropagationParams({
                        sgm: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    label={t("scenarios.klim_label")}
                    type="number"
                    step="1"
                    value={draft.propagationParams.klim}
                    onChange={(e) =>
                      draft.setPropagationParams({
                        klim: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    label={t("scenarios.mdvar_label")}
                    type="number"
                    step="1"
                    value={draft.propagationParams.mdvar}
                    onChange={(e) =>
                      draft.setPropagationParams({
                        mdvar: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    label={t("scenarios.qc_label")}
                    type="number"
                    step="1"
                    value={draft.propagationParams.qc}
                    onChange={(e) =>
                      draft.setPropagationParams({ qc: Number(e.target.value) })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Interactive Leaflet Map + Simulation Readiness Bar */}
        <div className="lg:col-span-7 space-y-4">
          <div className="h-[460px] border border-slate-300 rounded-none overflow-hidden shadow-2xs">
            <ScenarioMap
              bounds={draft.bounds}
              accessNodes={draft.accessNodes}
              endNodes={draft.endNodes}
              links={draft.links}
              selectedNodeId={draft.selectedNodeId}
              onSelectNode={(nodeId) => draft.setSelectedNodeId(nodeId)}
              onMoveNode={handleMoveNode}
            />
          </div>

          {/* Simulation Readiness Bar (RN-31, AC-16) */}
          <Card>
            <CardContent className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                {isSimulable ? (
                  <div className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t("scenarios.simulate_ready")}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{t("scenarios.simulate_blocked_title")}</span>
                    </div>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                      {liveBlockingCauses.map((cause, idx) => (
                        <li key={idx}>{cause}</li>
                      ))}
                      {validationResult &&
                        !validationResult.simulable &&
                        validationResult.causes.map((c) => (
                          <li key={c.code}>
                            {t(`scenarios.errors.${c.code}`, c.message)}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="primary"
                disabled={!isSimulable || createAndRunMutation.isPending}
                onClick={async () => {
                  if (!existingScenario) return;
                  try {
                    const sim = await createAndRunMutation.mutateAsync({
                      scenario_id: existingScenario.id,
                      name: `Simulación - ${draft.name || existingScenario.name}`,
                      description: draft.description || existingScenario.description,
                    });
                    navigate(`/simulations/${sim.id}`);
                  } catch (err) {
                    const apiErr = err as { message?: string };
                    setErrorBanner(
                      apiErr.message || "Error al iniciar simulación.",
                    );
                  }
                }}
                className="flex items-center gap-2 shrink-0"
              >
                <Play className="w-4 h-4" />
                {createAndRunMutation.isPending
                  ? "Iniciando..."
                  : t("scenarios.simulate_button")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {isVariantModalOpen && existingScenario && (
        <CreateVariantModal
          scenario={existingScenario}
          profiles={profiles}
          onClose={() => setIsVariantModalOpen(false)}
          onSubmit={async (payload) => {
            const variant = await createScenarioVariant.mutateAsync({
              id: existingScenario.id,
              payload,
            });
            navigate(`/scenarios/${variant.id}`);
          }}
        />
      )}

      {editingNodeData && (
        <NodeEditModal
          node={editingNodeData.node}
          role={editingNodeData.role}
          onClose={() => setEditingNodeData(null)}
          onSave={(nodeId, patch) => {
            if (editingNodeData.role === "ACCESS_NODE") {
              draft.updateAccessNode(nodeId, patch);
            } else {
              draft.updateEndNode(nodeId, patch);
            }
          }}
        />
      )}
    </div>
  );
}

