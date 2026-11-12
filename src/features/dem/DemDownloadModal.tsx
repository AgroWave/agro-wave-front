import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import {
  boundsDimensionsKm,
  createDemSchema,
  hasMinimumDimensions,
  isWithinContinentalColombia,
  type CreateDemFormData,
} from "../../domain/terrain";
import { t } from "../../i18n";

export interface DemDownloadModalProps {
  onClose: () => void;
  onSubmit: (data: CreateDemFormData) => Promise<void>;
}

/**
 * Modal dialog for requesting a new FABDEM dataset download with live coordinate feedback (AC-03-13).
 * @param props - Dialog controls and submit callback.
 * @returns Modal component.
 */
export function DemDownloadModal(props: DemDownloadModalProps) {
  const { onClose, onSubmit } = props;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateDemFormData>({
    resolver: zodResolver(createDemSchema),
    defaultValues: {
      name: "",
      description: "",
      south: 4.85,
      west: -74.05,
      north: 4.95,
      east: -73.95,
    },
  });

  const south = watch("south");
  const west = watch("west");
  const north = watch("north");
  const east = watch("east");

  const liveDimensions = React.useMemo(() => {
    if (
      typeof south === "number" &&
      !isNaN(south) &&
      typeof west === "number" &&
      !isNaN(west) &&
      typeof north === "number" &&
      !isNaN(north) &&
      typeof east === "number" &&
      !isNaN(east) &&
      south < north &&
      west < east
    ) {
      const bounds = { south, west, north, east };
      const dims = boundsDimensionsKm(bounds);
      const isInside = isWithinContinentalColombia(bounds);
      const isMin = hasMinimumDimensions(bounds);
      return { ...dims, isInside, isMin };
    }
    return null;
  }, [south, west, north, east]);

  const onFormSubmit = async (data: CreateDemFormData) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj?.code || "generic";
      const translated = t(`dem.errors.${code}`);
      setServerError(
        translated !== `dem.errors.${code}`
          ? translated
          : errorObj.message || t("dem.errors.generic")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-none border border-slate-400 bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-300 pb-4">
          <h2 className="text-base font-bold text-[#0f172a] uppercase tracking-wide">
            {t("dem.download_modal_title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xs p-1 text-slate-500 hover:bg-slate-100 hover:text-[#0f172a] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {serverError && <Alert variant="destructive">{serverError}</Alert>}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("dem.name_label")}</Label>
            <Input
              id="name"
              {...register("name")}
              error={Boolean(errors.name)}
              placeholder={t("dem.name_placeholder")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">{t("dem.description_label")}</Label>
            <Input
              id="description"
              {...register("description")}
              error={Boolean(errors.description)}
              placeholder={t("dem.description_placeholder")}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
            )}
          </div>

          <div className="rounded-none border border-slate-300 bg-[#f8f9fb] p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
              {t("dem.bounds_label")}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="south">{t("dem.south_label")}</Label>
                <Input
                  id="south"
                  type="number"
                  step="any"
                  {...register("south", { valueAsNumber: true })}
                  error={Boolean(errors.south)}
                />
              </div>

              <div>
                <Label htmlFor="north">{t("dem.north_label")}</Label>
                <Input
                  id="north"
                  type="number"
                  step="any"
                  {...register("north", { valueAsNumber: true })}
                  error={Boolean(errors.north)}
                />
              </div>

              <div>
                <Label htmlFor="west">{t("dem.west_label")}</Label>
                <Input
                  id="west"
                  type="number"
                  step="any"
                  {...register("west", { valueAsNumber: true })}
                  error={Boolean(errors.west)}
                />
              </div>

              <div>
                <Label htmlFor="east">{t("dem.east_label")}</Label>
                <Input
                  id="east"
                  type="number"
                  step="any"
                  {...register("east", { valueAsNumber: true })}
                  error={Boolean(errors.east)}
                />
              </div>
            </div>

            {errors.south && (
              <p className="text-xs text-rose-400">{errors.south.message}</p>
            )}
            {errors.west && (
              <p className="text-xs text-rose-400">{errors.west.message}</p>
            )}

            {/* Live dimension calculations */}
            {liveDimensions && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>{t("dem.estimated_dimensions")}</span>
                  <span className="font-mono text-slate-200">
                    ~{liveDimensions.widthKm.toFixed(2)} km × ~
                    {liveDimensions.heightKm.toFixed(2)} km
                  </span>
                </div>
                {!liveDimensions.isMin && (
                  <p className="text-amber-400">
                    ⚠️ {t("dem.area_warning_too_small")}
                  </p>
                )}
                {!liveDimensions.isInside && (
                  <p className="text-rose-400">
                    ⚠️ {t("dem.area_warning_outside_colombia")}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              {t("dem.cancel")}
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {t("dem.start_download")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
