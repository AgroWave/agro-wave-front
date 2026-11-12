import { X } from "lucide-react";
import * as React from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { LpwanProfile } from "../../domain/profiles";
import type { Scenario } from "../../domain/scenarios";
import { t } from "../../i18n";

/**
 * Props for CreateVariantModal.
 */
export interface CreateVariantModalProps {
  scenario: Scenario;
  profiles: LpwanProfile[];
  onClose: () => void;
  onSubmit: (data: {
    target_profile_id: string;
    band_code: string;
    frequency_mhz: number;
    name: string;
  }) => Promise<void>;
}

/**
 * Modal dialog for creating a technology variant of an existing scenario (UC-SC-04, RN-29, AC-14).
 * @param props - Base scenario, available LPWAN profiles, and submit callback.
 * @returns Rendered modal dialog.
 */
export function CreateVariantModal(props: CreateVariantModalProps) {
  const { scenario, profiles, onClose, onSubmit } = props;
  const defaultProfile = profiles[0] || null;
  const defaultBand = defaultProfile?.bands[0] || null;
  const defaultFreq =
    defaultBand && defaultBand.min_mhz !== null && defaultBand.max_mhz !== null
      ? Number(((defaultBand.min_mhz + defaultBand.max_mhz) / 2).toFixed(2))
      : 915.0;

  const [targetProfileId, setTargetProfileId] = React.useState(
    defaultProfile?.id || ""
  );
  const [bandCode, setBandCode] = React.useState(defaultBand?.code || "");
  const [frequencyMhz, setFrequencyMhz] = React.useState(defaultFreq);
  const [name, setName] = React.useState(
    defaultProfile
      ? `${scenario.name} (${defaultProfile.name})`
      : `${scenario.name} (Variante)`
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedProfile = profiles.find((p) => p.id === targetProfileId) || null;

  const handleProfileChange = (newProfileId: string) => {
    setTargetProfileId(newProfileId);
    const prof = profiles.find((p) => p.id === newProfileId);
    if (prof) {
      setName(`${scenario.name} (${prof.name})`);
      const b = prof.bands[0];
      if (b) {
        setBandCode(b.code);
        if (b.min_mhz !== null && b.max_mhz !== null) {
          setFrequencyMhz(Number(((b.min_mhz + b.max_mhz) / 2).toFixed(2)));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        target_profile_id: targetProfileId,
        band_code: bandCode,
        frequency_mhz: Number(frequencyMhz),
        name,
      });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      const code = apiErr?.code || "generic";
      setErrorMessage(
        t(`scenarios.errors.${code}`, apiErr?.message || t("scenarios.errors.generic"))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-none border border-slate-400 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#6e1111] px-6 py-4 bg-[#8b1919] text-white">
          <div>
            <h2 className="text-base font-bold tracking-wide uppercase text-white">
              {t("scenarios.variant_modal_title")}
            </h2>
            <p className="text-xs text-red-100">
              {t("scenarios.variant_modal_subtitle")}
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
          {errorMessage && (
            <div className="rounded-none bg-rose-50 border border-rose-300 border-l-4 border-l-rose-700 p-3 text-xs text-rose-900">
              {errorMessage}
            </div>
          )}

          <Input
            label={t("scenarios.name_label")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1e293b]">
              {t("scenarios.variant_target_profile")}
            </label>
            <select
              value={targetProfileId}
              onChange={(e) => handleProfileChange(e.target.value)}
              className="w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#8b1919] focus:outline-none"
              required
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.technology} | {p.reference_sensitivity_dbm} dBm)
                </option>
              ))}
            </select>
          </div>

          {selectedProfile && selectedProfile.bands.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1e293b]">
                  {t("scenarios.select_band_label")}
                </label>
                <select
                  value={bandCode}
                  onChange={(e) => setBandCode(e.target.value)}
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
                value={frequencyMhz}
                onChange={(e) => setFrequencyMhz(Number(e.target.value))}
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("dem.cancel")}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t("scenarios.variant_create_button")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

