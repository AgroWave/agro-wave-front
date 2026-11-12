import { X } from "lucide-react";
import * as React from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Polarization } from "../../domain/profiles";
import type { AccessNode, EndNode } from "../../domain/scenarios";
import { t } from "../../i18n";

export interface NodeEditModalProps {
  node: AccessNode | EndNode;
  role: "ACCESS_NODE" | "END_NODE";
  onClose: () => void;
  onSave: (nodeId: string, patch: Partial<AccessNode> | Partial<EndNode>) => void;
}

/**
 * Modal dialog for editing deployed Access Node (Gateway) or End Node properties.
 * @param props - Node, role, close handler, and save callback.
 * @returns Rendered modal dialog.
 */
export function NodeEditModal(props: NodeEditModalProps) {
  const { node, role, onClose, onSave } = props;

  const [name, setName] = React.useState(node.name);
  const [lat, setLat] = React.useState(node.lat);
  const [lng, setLng] = React.useState(node.lng);
  const [heightAglM, setHeightAglM] = React.useState(node.height_agl_m);
  const [antennaGainDbi, setAntennaGainDbi] = React.useState(node.antenna_gain_dbi);
  const [polarization, setPolarization] = React.useState<Polarization>(
    (node.polarization as Polarization) || "VERTICAL"
  );
  const [antennaRef, setAntennaRef] = React.useState(node.antenna_ref || "");

  // AccessNode specific
  const [sensitivityDbm, setSensitivityDbm] = React.useState(
    role === "ACCESS_NODE" ? (node as AccessNode).sensitivity_dbm : -137.0
  );

  // EndNode specific
  const [txPowerNominalDbm, setTxPowerNominalDbm] = React.useState(
    role === "END_NODE" ? (node as EndNode).tx_power_nominal_dbm : 20.0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "ACCESS_NODE") {
      onSave(node.id, {
        name: name.trim() || node.name,
        lat: Number(lat),
        lng: Number(lng),
        height_agl_m: Number(heightAglM),
        antenna_ref: antennaRef.trim() || null,
        antenna_gain_dbi: Number(antennaGainDbi),
        polarization,
        sensitivity_dbm: Number(sensitivityDbm),
      } as Partial<AccessNode>);
    } else {
      onSave(node.id, {
        name: name.trim() || node.name,
        lat: Number(lat),
        lng: Number(lng),
        height_agl_m: Number(heightAglM),
        antenna_ref: antennaRef.trim() || null,
        antenna_gain_dbi: Number(antennaGainDbi),
        polarization,
        tx_power_nominal_dbm: Number(txPowerNominalDbm),
      } as Partial<EndNode>);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-none border border-slate-400 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#6e1111] px-6 py-4 bg-[#8b1919] text-white">
          <div>
            <h2 className="text-base font-bold tracking-wide uppercase text-white">
              {role === "ACCESS_NODE" ? "Editar Access Node (Gateway)" : "Editar End Node (Sensor)"}
            </h2>
            <p className="text-xs text-red-100 font-mono">
              ID: {node.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label={t("scenarios.node_name_label")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("scenarios.lat_label")}
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              required
            />
            <Input
              label={t("scenarios.lng_label")}
              type="number"
              step="0.000001"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("scenarios.height_agl_label")}
              type="number"
              step="0.1"
              min="0.5"
              value={heightAglM}
              onChange={(e) => setHeightAglM(Number(e.target.value))}
              required
            />
            <Input
              label={t("scenarios.antenna_gain_label")}
              type="number"
              step="0.1"
              value={antennaGainDbi}
              onChange={(e) => setAntennaGainDbi(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1e293b]">
                {t("scenarios.polarization_label")}
              </label>
              <select
                value={polarization}
                onChange={(e) => setPolarization(e.target.value as Polarization)}
                className="flex h-10 w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#8b1919]"
              >
                <option value="VERTICAL">VERTICAL</option>
                <option value="HORIZONTAL">HORIZONTAL</option>
              </select>
            </div>

            {role === "ACCESS_NODE" ? (
              <Input
                label={t("scenarios.sensitivity_label")}
                type="number"
                step="0.5"
                value={sensitivityDbm}
                onChange={(e) => setSensitivityDbm(Number(e.target.value))}
                required
              />
            ) : (
              <Input
                label={t("scenarios.tx_power_label")}
                type="number"
                step="0.5"
                value={txPowerNominalDbm}
                onChange={(e) => setTxPowerNominalDbm(Number(e.target.value))}
                required
              />
            )}
          </div>

          <Input
            label={t("scenarios.antenna_ref_label")}
            value={antennaRef}
            onChange={(e) => setAntennaRef(e.target.value)}
            placeholder="Ej. Taoglas, Dragino Outdoor, etc."
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("dem.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("dem.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

