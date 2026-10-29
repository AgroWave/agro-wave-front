import * as React from "react";
import { z } from "zod";
import { loginUser, type AuthUser } from "../../api/auth";
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

const loginSchema = z.object({
  email: z.string().email(t("auth.validation.email_invalid")),
  password: z.string().min(1, t("auth.validation.password_min")),
});

export interface LoginFormProps {
  onSuccess: (token: string, user: AuthUser) => void;
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
}

/**
 * Authentication login form with Zod schema validation and error feedback.
 * @param props - Component handlers for success and navigation.
 * @returns Rendered login form component.
 */
export function LoginForm(props: LoginFormProps) {
  const { onSuccess, onNavigateRegister, onNavigateForgotPassword } = props;
  const [email, setEmail] = React.useState("");

  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
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
      const data = await loginUser({ email, password });
      onSuccess(data.access_token, data.user);
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
        <CardTitle>{t("auth.login_title")}</CardTitle>
        <CardDescription>{t("auth.login_subtitle")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {serverError && <Alert variant="destructive">{serverError}</Alert>}

          <div className="space-y-1.5">
            <Label htmlFor="login-email">{t("auth.email_label")}</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email_placeholder")}
              error={Boolean(errors.email)}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-xs text-rose-400 font-medium">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">{t("auth.password_label")}</Label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
              >
                {t("auth.forgot_password_link")}
              </button>
            </div>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password_placeholder")}
              error={Boolean(errors.password)}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-xs text-rose-400 font-medium">{errors.password}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("system.checking") : t("auth.login_button")}
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-slate-400">
            {t("auth.no_account")}{" "}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              {t("auth.register_button")}
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
