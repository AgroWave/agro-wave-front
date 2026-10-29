import * as React from "react";
import { z } from "zod";
import { registerUser } from "../../api/auth";
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

const registerSchema = z
  .object({
    name: z.string().min(2, t("auth.validation.name_min")),
    email: z.string().email(t("auth.validation.email_invalid")),
    password: z.string().min(8, t("auth.validation.password_min")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("auth.validation.passwords_mismatch"),
    path: ["confirmPassword"],
  });

export interface RegisterFormProps {
  onNavigateLogin: () => void;
}

/**
 * User registration form enforcing strong passwords and email confirmation notice.
 * @param props - Navigation callback to return to login.
 * @returns Rendered registration form component.
 */
export function RegisterForm(props: RegisterFormProps) {
  const { onNavigateLogin } = props;
  const [name, setName] = React.useState("");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
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
      await registerUser({ name, email, password });
      setSuccessMessage(t("auth.register_success"));
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
        <CardTitle>{t("auth.register_title")}</CardTitle>
        <CardDescription>{t("auth.register_subtitle")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {serverError && <Alert variant="destructive">{serverError}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          {!successMessage && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">{t("auth.name_label")}</Label>
                <Input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.name_placeholder")}
                  error={Boolean(errors.name)}
                />
                {errors.name && (
                  <p className="text-xs text-rose-400 font-medium">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">{t("auth.email_label")}</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email_placeholder")}
                  error={Boolean(errors.email)}
                />
                {errors.email && (
                  <p className="text-xs text-rose-400 font-medium">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">{t("auth.password_label")}</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password_placeholder")}
                  error={Boolean(errors.password)}
                />
                {errors.password && (
                  <p className="text-xs text-rose-400 font-medium">{errors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm-password">{t("auth.confirm_password_label")}</Label>
                <Input
                  id="reg-confirm-password"
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
                {loading ? t("system.checking") : t("auth.register_button")}
              </Button>
            </>
          )}

          {successMessage && (
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={onNavigateLogin}
            >
              {t("auth.back_to_login")}
            </Button>
          )}
        </CardContent>
        {!successMessage && (
          <CardFooter className="justify-center">
            <p className="text-sm text-slate-400">
              {t("auth.have_account")}{" "}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
              >
                {t("auth.login_button")}
              </button>
            </p>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
