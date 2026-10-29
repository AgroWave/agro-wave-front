import * as React from "react";

export interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Centered layout wrapper for authentication pages with AGROWAVE branding.
 * @param props - Layout component properties.
 * @returns Rendered authentication layout structure.
 */
export function AuthLayout(props: AuthLayoutProps) {
  const { children } = props;
  return (

    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-radial from-slate-900 via-slate-950 to-black">
      <div className="w-full max-w-md flex flex-col items-center mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xl shadow-lg shadow-emerald-500/10">
            W
          </div>
          <span className="text-2xl font-extrabold tracking-wider text-white">
            AGRO<span className="text-emerald-400">WAVE</span>
          </span>
        </div>
        <p className="text-xs text-slate-400 text-center uppercase tracking-widest font-semibold">
          Simulador LPWAN FABDEM Colombia
        </p>
      </div>

      <div className="w-full max-w-md">{children}</div>

      <div className="mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} AGROWAVE. Todos los derechos reservados.
      </div>
    </div>
  );
}
