import { Activity, Map, Mountain, Radio } from "lucide-react";
import { NavLink } from "react-router";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";

export interface SidebarProps {
  className?: string;
}

/**
 * Main application sidebar navigation menu with institutional accent bars.
 * @param props - Layout customization classes.
 * @returns Rendered sidebar component.
 */
export function Sidebar(props: SidebarProps) {
  const { className } = props;
  const navItems = [
    {
      to: "/simulations",
      label: t("nav.simulations"),
      icon: Activity,
      tag: "RF",
      borderAccent: "border-l-4 border-l-[#2563eb]",
      iconColor: "text-[#2563eb]",
      activeClasses: "bg-blue-50/90 text-[#1d4ed8] border-y border-r border-blue-200 font-bold ring-1 ring-blue-500/25",
      inactiveClasses: "bg-white text-[#0f172a] hover:bg-blue-50/40 border-y border-r border-slate-200 font-semibold",
      tagClasses: "bg-blue-100 text-[#1d4ed8] border-blue-200",
    },
    {
      to: "/scenarios",
      label: t("nav.scenarios"),
      icon: Map,
      tag: "MAP",
      borderAccent: "border-l-4 border-l-[#d97706]",
      iconColor: "text-[#d97706]",
      activeClasses: "bg-amber-50/90 text-[#92400e] border-y border-r border-amber-200 font-bold ring-1 ring-amber-500/25",
      inactiveClasses: "bg-white text-[#0f172a] hover:bg-amber-50/40 border-y border-r border-slate-200 font-semibold",
      tagClasses: "bg-amber-100 text-[#92400e] border-amber-200",
    },
    {
      to: "/dem",
      label: t("nav.dem"),
      icon: Mountain,
      tag: "GEO",
      borderAccent: "border-l-4 border-l-[#059669]",
      iconColor: "text-[#059669]",
      activeClasses: "bg-emerald-50/90 text-[#065f46] border-y border-r border-emerald-200 font-bold ring-1 ring-emerald-500/25",
      inactiveClasses: "bg-white text-[#0f172a] hover:bg-emerald-50/40 border-y border-r border-slate-200 font-semibold",
      tagClasses: "bg-emerald-100 text-[#065f46] border-emerald-200",
    },
    {
      to: "/profiles",
      label: t("nav.profiles"),
      icon: Radio,
      tag: "PHY",
      borderAccent: "border-l-4 border-l-[#dc2626]",
      iconColor: "text-[#dc2626]",
      activeClasses: "bg-rose-50/90 text-[#9f1239] border-y border-r border-rose-200 font-bold ring-1 ring-rose-500/25",
      inactiveClasses: "bg-white text-[#0f172a] hover:bg-rose-50/40 border-y border-r border-slate-200 font-semibold",
      tagClasses: "bg-rose-100 text-[#9f1239] border-rose-200",
    },
  ];

  return (
    <aside
      className={cn(
        "w-64 border-r border-slate-300 bg-[#fbfcfd] flex flex-col shrink-0 shadow-2xs sticky top-0 h-screen z-20 overflow-y-auto",
        className
      )}
    >
      <div className="h-16 px-5 border-b border-[#6e1111] bg-[#7a1414] flex items-center">
        <div>
          <span className="font-extrabold text-base tracking-wider text-white block leading-tight">
            AGROWAVE
          </span>
          <span className="text-[10px] text-amber-200 uppercase tracking-widest font-semibold block">
            Simulador LPWAN
          </span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="rounded-none bg-[#f1f5f9] border border-slate-300 p-3 text-center shadow-2xs">
          <div className="text-xs font-bold text-[#0f172a] uppercase tracking-wide">
            Módulos de Simulación
          </div>
          <div className="text-[11px] text-[#475569] font-medium mt-0.5">
            Cobertura rural sobre FABDEM
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-none text-sm transition-all shadow-2xs",
                  item.borderAccent,
                  isActive ? item.activeClasses : item.inactiveClasses
                )
              }
            >
              <Icon className={cn("w-4 h-4 shrink-0", item.iconColor)} />
              <span className="leading-none">{item.label}</span>
              <span
                className={cn(
                  "ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-none border",
                  item.tagClasses
                )}
              >
                {item.tag}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-300 bg-[#f8f9fb] text-[11px] text-[#475569] text-center font-mono">
        AGROWAVE LPWAN &bull; FABDEM
      </div>
    </aside>
  );
}
