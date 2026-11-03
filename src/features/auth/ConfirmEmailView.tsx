import * as React from "react";
import { confirmEmail } from "../../api/auth";
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
import { t } from "../../i18n";

export interface ConfirmEmailViewProps {
  token: string;
  onNavigateLogin: () => void;
}

/**
 * Account email confirmation view that automatically processes the token on mount.
 * @param props - Component properties containing the confirmation token and navigation callback.
 * @returns Rendered email confirmation view.
 */
export function ConfirmEmailView(props: ConfirmEmailViewProps) {
  const { token, onNavigateLogin } = props;
  const [loading, setLoading] = React.useState(true);

  const [success, setSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function processConfirmation() {
      try {
        await confirmEmail(token);
        if (isMounted) {
          setSuccess(true);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const apiErr = err as { code?: string; detail?: string };
          const code = apiErr.code || "generic";
          setErrorMessage(
            t(`auth.errors.${code}`) || apiErr.detail || t("auth.errors.generic")
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (token) {
      processConfirmation();
    } else {
      setLoading(false);
      setErrorMessage(t("auth.validation.token_required"));
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("auth.confirm_email_title")}</CardTitle>
        {loading && <CardDescription>{t("auth.confirming")}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        )}

        {success && <Alert variant="success">{t("auth.confirm_success")}</Alert>}

        {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}
      </CardContent>
      <CardFooter className="justify-center">
        <Button
          type="button"
          className="w-full"
          onClick={onNavigateLogin}
        >
          {t("auth.login_button")}
        </Button>
      </CardFooter>
    </Card>
  );
}
