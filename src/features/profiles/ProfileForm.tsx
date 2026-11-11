import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X } from "lucide-react";
import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import {
  profileSchema,
  Technology,
  type LpwanProfile,
  type ProfileFormData,
} from "../../domain/profiles";
import { t } from "../../i18n";

export interface ProfileFormProps {
  initialProfile?: LpwanProfile | null;
  onClose: () => void;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  title?: string;
}

/**
 * Modal form for creating or editing custom LPWAN profiles with zod validation (AC-02-12).
 * @param props - Form configuration, initial values, and submission callbacks.
 * @returns Rendered profile form.
 */
export function ProfileForm(props: ProfileFormProps) {
  const { initialProfile, onClose, onSubmit, title } = props;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const defaultValues: ProfileFormData = {
    name: initialProfile?.name ?? "",
    technology: initialProfile?.technology ?? Technology.LORAWAN,
    reference_sensitivity_dbm: initialProfile?.reference_sensitivity_dbm ?? -130,
    spreading_factor: initialProfile?.spreading_factor ?? (initialProfile ? null : 7),
    bands: initialProfile?.bands.map((b) => ({
      code: b.code,
      min_mhz: b.min_mhz ?? undefined,
      max_mhz: b.max_mhz ?? undefined,
    })) ?? [
      {
        code: "902-928",
        min_mhz: 902,
        max_mhz: 928,
      },
    ],
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const selectedTechnology = watch("technology");

  // When technology changes, adjust spreading_factor default
  React.useEffect(() => {
    if (selectedTechnology === Technology.LORAWAN) {
      if (initialProfile?.technology === Technology.LORAWAN && initialProfile.spreading_factor) {
        setValue("spreading_factor", initialProfile.spreading_factor);
      } else {
        setValue("spreading_factor", 7);
      }
    } else {
      setValue("spreading_factor", null);
    }
  }, [selectedTechnology, setValue, initialProfile]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "bands",
  });

  const onFormSubmit = async (data: ProfileFormData) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      const code = apiErr.code;
      const message =
        code && t(`profiles.errors.${code}`) !== `profiles.errors.${code}`
          ? t(`profiles.errors.${code}`)
          : apiErr.message || t("profiles.errors.generic");
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-none border border-slate-400 bg-white p-6 shadow-2xl space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-[#6e1111] pb-4 -mx-6 px-6 -mt-6 pt-5 bg-[#8b1919] text-white">
          <h2 className="text-base font-bold tracking-wide uppercase text-white">
            {title ?? (initialProfile ? t("profiles.edit_title") : t("profiles.create_title"))}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-none text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {serverError && <Alert variant="destructive">{serverError}</Alert>}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("profiles.name_label")}</Label>
            <Input
              id="name"
              {...register("name")}
              error={Boolean(errors.name)}
              placeholder="e.g. LoRaWAN 915 MHz Campo"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="technology">{t("profiles.technology_label")}</Label>
              <select
                id="technology"
                disabled={Boolean(initialProfile)}
                {...register("technology")}
                className="flex h-10 w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#8b1919]"
              >
                <option value={Technology.LORAWAN}>LoRaWAN</option>
                <option value={Technology.NB_IOT}>NB-IoT</option>
                <option value={Technology.LTE_M}>LTE-M</option>
              </select>
            </div>

            <div>
              <Label htmlFor="reference_sensitivity_dbm">
                {t("profiles.reference_sensitivity_label")}
              </Label>
              <Input
                id="reference_sensitivity_dbm"
                type="number"
                step="any"
                {...register("reference_sensitivity_dbm", { valueAsNumber: true })}
                error={Boolean(errors.reference_sensitivity_dbm)}
              />
              {errors.reference_sensitivity_dbm && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.reference_sensitivity_dbm.message}
                </p>
              )}
            </div>
          </div>

          {/* Spreading Factor (RN-07: visible and mandatory only for LoRaWAN) */}
          {selectedTechnology === Technology.LORAWAN && (
            <div>
              <Label htmlFor="spreading_factor">
                {t("profiles.spreading_factor_label")}
              </Label>
              <select
                id="spreading_factor"
                {...register("spreading_factor", { valueAsNumber: true })}
                className="flex h-10 w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#8b1919]"
              >
                {[7, 8, 9, 10, 11, 12].map((sf) => (
                  <option key={sf} value={sf}>
                    SF{sf}
                  </option>
                ))}
              </select>
              {errors.spreading_factor && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.spreading_factor.message}
                </p>
              )}
            </div>
          )}

          {/* Bands list */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label>{t("profiles.bands_section_title")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ code: "", min_mhz: null, max_mhz: null })}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t("profiles.add_band_button")}
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 rounded-none border border-slate-300 bg-[#f8f9fb] p-2"
                >
                  <div className="flex-1">
                    <Input
                      {...register(`bands.${index}.code`)}
                      placeholder={t("profiles.band_code_label")}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="any"
                      {...register(`bands.${index}.min_mhz`, { valueAsNumber: true })}
                      placeholder="Min MHz"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="any"
                      {...register(`bands.${index}.max_mhz`, { valueAsNumber: true })}
                      placeholder="Max MHz"
                      className="h-8 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 text-slate-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {errors.bands && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.bands.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-300">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("profiles.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : t("profiles.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
