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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              {t("profiles.templates_title")} &bull; {profile.technology}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t("profiles.templates_subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Cargando plantillas...</div>
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400 text-sm">
                      {roleLabel}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      {template.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">
                        {t("profiles.module_ref")}
                      </span>
                      <span className="text-slate-200">
                        {template.module_ref ?? (
                          <span className="text-amber-400/90 italic">
                            {pendingText}
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">
                        {t("profiles.antenna_ref")}
                      </span>
                      <span className="text-slate-200">
                        {template.antenna.reference ?? (
                          <span className="text-amber-400/90 italic">
                            {pendingText}
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">
                        {t("profiles.antenna_gain")}
                      </span>
                      <span className="text-slate-200">
                        {template.antenna.gain_dbi !== null &&
                        template.antenna.gain_dbi !== undefined ? (
                          `${template.antenna.gain_dbi} dBi`
                        ) : (
                          <span className="text-amber-400/90 italic">
                            {pendingText}
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">
                        {t("profiles.tx_power")}
                      </span>
                      <span className="text-slate-200">
                        {template.tx_power ? (
                          `${template.tx_power.nominal_dbm} ± ${template.tx_power.tolerance_db} dBm`
                        ) : isEndNode ? (
                          <span className="text-amber-400/90 italic">
                            {pendingText}
                          </span>
                        ) : (
                          <span className="text-slate-500">N/A (Receptor)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            {t("profiles.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
