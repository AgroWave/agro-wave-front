import * as React from "react";
import { cn } from "../../lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success";
}

/**
 * Visual notification banner displaying information, errors, or successes.
 */
export function Alert({ className, variant = "default", ...props }: AlertProps) {
  const variantStyles = {
    default: "bg-[#f8f9fb] border-slate-300 border-l-4 border-l-slate-600 text-[#1e293b]",
    destructive: "bg-rose-50 border-rose-300 border-l-4 border-l-rose-700 text-rose-900",
    success: "bg-emerald-50 border-emerald-300 border-l-4 border-l-emerald-700 text-emerald-900",
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-none border p-4 text-sm font-medium shadow-2xs transition-all",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
