import * as React from "react";
import { z } from "zod";
import { requestPasswordReset } from "../../api/auth";
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

const forgotSchema = z.object({
  email: z.string().email(t("auth.validation.email_invalid")),
});

export interface ForgotPasswordFormProps {
  onNavigateLogin: () => void;
}

/**
 * Form to request a password reset email token.
 * @param props - Navigation handler to return to login.
 * @returns Rendered forgot password form component.
 */
export function ForgotPasswordForm(props: ForgotPasswordFormProps) {
  const { onNavigateLogin } = props;
  const [email, setEmail] = React.useState("");

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = forgotSchema.safeParse({ email });
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
      await requestPasswordReset(email);
    } catch {
      // Intentionally silent or generic to avoid user enumeration (AC-01-06)
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("auth.forgot_password_title")}</CardTitle>
        <CardDescription>{t("auth.forgot_password_subtitle")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {submitted ? (
            <div className="space-y-4">
              <Alert variant="success">{t("auth.reset_request_success")}</Alert>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onNavigateLogin}
              >
                {t("auth.back_to_login")}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">{t("auth.email_label")}</Label>
                <Input
                  id="forgot-email"
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("system.checking") : t("auth.send_reset_link_button")}
              </Button>
            </>
          )}
        </CardContent>
        {!submitted && (
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
