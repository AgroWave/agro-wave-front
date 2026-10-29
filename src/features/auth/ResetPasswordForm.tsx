import * as React from "react";
import { z } from "zod";
import { resetPassword } from "../../api/auth";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { t } from "../../i18n";

const resetSchema = z
  .object({
    newPassword: z.string().min(8, t("auth.validation.password_min")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t("auth.validation.passwords_mismatch"),
    path: ["confirmPassword"],
  });

export interface ResetPasswordFormProps {
  token: string;
  onNavigateLogin: () => void;
}

/**
 * Form to establish a new account password from a valid reset token.
 * @param props - Component properties containing the reset token and navigation handler.
 * @returns Rendered reset password form component.
 */
export function ResetPasswordForm(props: ResetPasswordFormProps) {
  const { token, onNavigateLogin } = props;
  const [newPassword, setNewPassword] = React.useState("");

  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const result = resetSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, new_password: newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { code?: string; detail?: string };
      const code = apiErr.code || "generic";
      const message = t(`auth.errors.${code}`) || apiErr.detail || t("auth.errors.generic");
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("auth.reset_password_title")}</CardTitle>
        <CardDescription>{t("auth.reset_password_subtitle")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {serverError && <Alert variant="destructive">{serverError}</Alert>}
          {success ? (
            <div className="space-y-4">
              <Alert variant="success">{t("auth.reset_success")}</Alert>
              <Button
                type="button"
                className="w-full"
                onClick={onNavigateLogin}
              >
                {t("auth.back_to_login")}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="reset-new-password">{t("auth.new_password_label")}</Label>
                <Input
                  id="reset-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("auth.password_placeholder")}
                  error={Boolean(errors.newPassword)}
                />
                {errors.newPassword && (
                  <p className="text-xs text-rose-400 font-medium">{errors.newPassword}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reset-confirm-password">{t("auth.confirm_password_label")}</Label>
                <Input
                  id="reset-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("auth.password_placeholder")}
                  error={Boolean(errors.confirmPassword)}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-400 font-medium">{errors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("system.checking") : t("auth.reset_password_button")}
              </Button>
            </>
          )}
        </CardContent>
        {!success && (
          <CardFooter className="justify-center">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {t("auth.back_to_login")}
            </button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
