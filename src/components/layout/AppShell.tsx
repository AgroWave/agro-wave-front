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
 * Main application shell containing sidebar navigation, institutional header, and main viewport.
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
    <div className="min-h-screen bg-[#f4f6fa] text-slate-100 flex flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-[#6e1111] bg-[#8b1919] px-6 flex items-center justify-between shrink-0 shadow-md">
          <div>
            <div className="text-sm font-bold tracking-wide text-white uppercase">
              AGROWAVE &bull; Simulador LPWAN Colombia
            </div>
            <div className="text-[11px] text-red-100/90">
              Modelado de Propagación Longley-Rice sobre Terreno FABDEM
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right text-xs">
                <div className="font-semibold text-white">{user.name}</div>
                <div className="text-red-100/90">
                  {user.email} &bull;{" "}
                  <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded-xs font-mono text-[10px] font-bold">
                    {user.role}
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
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
