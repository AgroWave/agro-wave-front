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
    default: "bg-slate-800/80 border-slate-700 text-slate-200",
    destructive: "bg-rose-950/60 border-rose-800/80 text-rose-200",
    success: "bg-emerald-950/60 border-emerald-800/80 text-emerald-200",
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-xl border p-4 text-sm font-medium shadow-sm transition-all",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
