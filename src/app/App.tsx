import * as React from "react";
import { logoutUser } from "../api/auth";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { ConfirmEmailView } from "../features/auth/ConfirmEmailView";
import { ForgotPasswordForm } from "../features/auth/ForgotPasswordForm";
import { LoginForm } from "../features/auth/LoginForm";
import { RegisterForm } from "../features/auth/RegisterForm";
import { ResetPasswordForm } from "../features/auth/ResetPasswordForm";
import { useAuthStore } from "../features/auth/useAuthStore";
import { ApiStatus } from "../features/system/ApiStatus";

/**
 * Root application component managing authentication routing and session views.
 * @returns The main application JSX layout.
 */
export function App() {
  const [currentPath, setCurrentPath] = React.useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/login"
  );
  const { token, user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const navigate = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", path);
    }
    setCurrentPath(path);
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogout = async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch {
        // Clear local credentials even if network fails
      }
    }
    clearAuth();
    navigate("/login");
  };

  // Authenticated Dashboard View
  if (isAuthenticated && user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-sm">
              W
            </div>
            <span className="font-bold text-lg tracking-wide text-white">
              AGRO<span className="text-emerald-400">WAVE</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-xs">
              <div className="font-semibold text-slate-200">{user.name}</div>
              <div className="text-slate-400">{user.email} &bull; <span className="text-emerald-400 font-mono">{user.role}</span></div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </header>

        <section className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              Bienvenido a AGROWAVE
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Plataforma de predicción de cobertura y balance de enlace para redes LPWAN sobre FABDEM en Colombia.
            </p>
            <ApiStatus />
          </div>
        </section>
      </main>
    );
  }

  // Authentication Flows
  if (currentPath === "/register") {
    return (
      <AuthLayout>
        <RegisterForm onNavigateLogin={() => navigate("/login")} />
      </AuthLayout>
    );
  }

  if (currentPath === "/forgot-password") {
    return (
      <AuthLayout>
        <ForgotPasswordForm onNavigateLogin={() => navigate("/login")} />
      </AuthLayout>
    );
  }

  if (currentPath.startsWith("/reset-password/")) {
    const resetToken = currentPath.replace("/reset-password/", "");
    return (
      <AuthLayout>
        <ResetPasswordForm
          token={resetToken}
          onNavigateLogin={() => navigate("/login")}
        />
      </AuthLayout>
    );
  }

  if (currentPath.startsWith("/confirm-email/")) {
    const confirmToken = currentPath.replace("/confirm-email/", "");
    return (
      <AuthLayout>
        <ConfirmEmailView
          token={confirmToken}
          onNavigateLogin={() => navigate("/login")}
        />
      </AuthLayout>
    );
  }

  // Default: /login
  return (
    <AuthLayout>
      <LoginForm
        onSuccess={(authToken, authUser) => {
          setAuth(authToken, authUser);
          navigate("/");
        }}
        onNavigateRegister={() => navigate("/register")}
        onNavigateForgotPassword={() => navigate("/forgot-password")}
      />
    </AuthLayout>
  );
}
