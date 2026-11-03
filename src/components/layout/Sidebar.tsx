import { Activity, Map, Mountain, Radio } from "lucide-react";
import { NavLink } from "react-router";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";

export interface SidebarProps {
  className?: string;
}

/**
 * Main application sidebar navigation menu.
 * @param props - Layout customization classes.
 * @returns Rendered sidebar component.
 */
export function Sidebar(props: SidebarProps) {
  const { className } = props;
  const navItems = [
    { to: "/simulations", label: t("nav.simulations"), icon: Activity },
    { to: "/scenarios", label: t("nav.scenarios"), icon: Map },
    { to: "/dem", label: t("nav.dem"), icon: Mountain },
    { to: "/profiles", label: t("nav.profiles"), icon: Radio },
  ];

  return (
    <aside
      className={cn(
        "w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col shrink-0",
        className
      )}
    >
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-sm">
          W
        </div>
        <span className="font-bold text-lg tracking-wide text-white">
          AGRO<span className="text-emerald-400">WAVE</span>
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center font-mono">
        AGROWAVE LPWAN &bull; FABDEM
      </div>
    </aside>
  );
}
