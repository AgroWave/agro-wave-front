import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/**
 * Standard styled text input field supporting error states.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
          error
            ? "border-rose-500 focus:ring-rose-500"
            : "border-slate-700 hover:border-slate-600",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
