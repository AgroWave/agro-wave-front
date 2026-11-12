import * as React from "react";

export interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Centered layout wrapper for authentication pages with institutional header and light palette.
 * @param props - Layout component properties.
 * @returns Rendered authentication layout structure.
 */
export function AuthLayout(props: AuthLayoutProps) {
  const { children } = props;
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f4f6fa]">
      <header className="w-full bg-[#8b1919] border-b border-[#6e1111] py-4 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xl font-extrabold tracking-wider text-white leading-tight">
                AGROWAVE
              </div>
              <div className="text-xs text-red-100 uppercase tracking-widest font-semibold">
                Simulador LPWAN FABDEM Colombia
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold text-white/90 hidden sm:block">
            Plataforma de Planificación de Radioenlaces Rurales
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md mb-4 rounded-none bg-white border border-slate-300 border-l-4 border-l-[#8b1919] px-4 py-3 text-center shadow-2xs">
          <div className="text-sm font-black text-[#0f172a] uppercase tracking-wide">
            Acceso a la Plataforma AGROWAVE
          </div>
          <div className="text-xs text-[#475569] font-medium mt-0.5">
            Modelado LoRaWAN, NB-IoT y LTE-M sobre terreno digital FABDEM
          </div>
        </div>

        <div className="w-full max-w-md">{children}</div>

        <div className="mt-8 text-center text-xs text-[#475569] font-medium">
          &copy; {new Date().getFullYear()} AGROWAVE. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
