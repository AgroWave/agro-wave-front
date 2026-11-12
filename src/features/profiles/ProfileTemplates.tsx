import { X } from "lucide-react";
import { NodeRole, type LpwanProfile } from "../../domain/profiles";
import { t } from "../../i18n";
import { Button } from "../../components/ui/Button";
import { useProfileTemplates } from "./useProfiles";

export interface ProfileTemplatesProps {
  profile: LpwanProfile;
  onClose: () => void;
}

/**
 * Modal displaying equipment templates (End Node and Access Node) for a profile's technology.
 * @param props - Selected profile and close handler.
 * @returns Rendered template details view.
 */
export function ProfileTemplates(props: ProfileTemplatesProps) {
  const { profile, onClose } = props;
  const { data: templates = [], isLoading } = useProfileTemplates(profile.id);

  const pendingText = t("profiles.pending");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-none border border-slate-400 bg-white p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#6e1111] pb-4 -mx-6 px-6 -mt-6 pt-5 bg-[#8b1919] text-white">
          <div>
            <h2 className="text-base font-bold tracking-wide uppercase text-white">
              {t("profiles.templates_title")} &bull; {profile.technology}
            </h2>
            <p className="text-xs text-red-100 mt-0.5">
              {t("profiles.templates_subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-none text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[#475569] font-medium">Cargando plantillas...</div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => {
              const isEndNode = template.role === NodeRole.END_NODE;
              const roleLabel = isEndNode
                ? t("profiles.end_node_template")
                : t("profiles.access_node_template");

              return (
                <div
                  key={template.id}
                  className="rounded-none border border-slate-300 bg-[#f8f9fb] p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#047857] text-sm">
                      {roleLabel}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0f172a]">
                      {template.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#64748b] block font-medium">
                        {t("profiles.module_ref")}
                      </span>
                      <span className="text-[#0f172a] font-semibold">
                        {template.module_ref ?? (
                          <span className="text-amber-800 font-normal italic">
                            {pendingText}
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748b] block font-medium">
                        {t("profiles.antenna_ref")}
                      </span>
                      <span className="text-[#0f172a] font-semibold">
                        {template.antenna.reference ?? (
                          <span className="text-amber-800 font-normal italic">
                            {pendingText}
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748b] block font-medium">
                        {t("profiles.antenna_gain")}
                      </span>
                      <span className="text-[#0f172a] font-semibold">
                        {template.antenna.gain_dbi !== null &&
                        template.antenna.gain_dbi !== undefined ? (
                          `${template.antenna.gain_dbi} dBi`
                        ) : (
                          <span className="text-amber-800 font-normal italic">
                            {pendingText}
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748b] block font-medium">
                        {t("profiles.tx_power")}
                      </span>
                      <span className="text-[#0f172a] font-semibold">
                        {template.tx_power ? (
                          `${template.tx_power.nominal_dbm} ± ${template.tx_power.tolerance_db} dBm`
                        ) : isEndNode ? (
                          <span className="text-amber-800 font-normal italic">
                            {pendingText}
                          </span>
                        ) : (
                          <span className="text-[#64748b]">N/A (Receptor)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            {t("profiles.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
