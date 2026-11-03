import * as React from "react";
import { Outlet } from "react-router";
import { logoutUser } from "../../api/auth";
import { useAuthStore } from "../../features/auth/useAuthStore";
import { t } from "../../i18n";
import { Button } from "../ui/Button";
import { Sidebar } from "./Sidebar";

export interface AppShellProps {
  children?: React.ReactNode;
}

/**
 * Main application shell containing sidebar navigation, user session bar, and main viewport.
 * @param props - Layout children or nested route outlet.
 * @returns Rendered application frame.
 */
export function AppShell(props: AppShellProps) {
  const { children } = props;
  const { user, token, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch {
        // Clear local credentials even if network fails
      }
    }
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Predicción LPWAN FABDEM Colombia
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right text-xs">
                <div className="font-semibold text-slate-200">{user.name}</div>
                <div className="text-slate-400">
                  {user.email} &bull;{" "}
                  <span className="text-emerald-400 font-mono">{user.role}</span>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              {t("auth.logout_button")}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
