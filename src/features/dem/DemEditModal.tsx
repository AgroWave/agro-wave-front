import { X } from "lucide-react";
import * as React from "react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import type { Dem } from "../../domain/terrain";
import { t } from "../../i18n";

export interface DemEditModalProps {
  dem: Dem;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string | null }) => Promise<void>;
}

/**
 * Modal dialog for editing an existing DEM's name and description.
 * @param props - Target DEM entity, close handler, and submit handler.
 * @returns Edit modal dialog.
 */
export function DemEditModal(props: DemEditModalProps) {
  const { dem, onClose, onSubmit } = props;
  const [name, setName] = React.useState(dem.name);
  const [description, setDescription] = React.useState(dem.description ?? "");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setServerError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
      });
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
      <div className="w-full max-w-md rounded-none border border-slate-400 bg-white p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-300 pb-4">
          <h2 className="text-base font-bold text-[#0f172a] uppercase tracking-wide">
            {t("dem.edit_modal_title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xs p-1 text-slate-500 hover:bg-slate-100 hover:text-[#0f172a] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">{t("dem.name_label")}</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">{t("dem.description_label")}</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              {t("dem.cancel")}
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {t("dem.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
