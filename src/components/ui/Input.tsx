import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
}

/**
 * Standard styled text input field supporting error states and optional label/helperText.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, label, helperText, id, placeholder, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const inputElement = (
      <input
        id={inputId}
        type={type}
        ref={ref}
        placeholder={placeholder || (typeof label === "string" ? label : undefined)}
        className={cn(
          "flex h-10 w-full rounded-xs border border-slate-300 bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#64748b] shadow-2xs transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[#8b1919] focus:border-transparent",
          error
            ? "border-rose-500 focus:ring-rose-500"
            : "border-slate-300 hover:border-slate-400",
          className
        )}
        {...props}
      />
    );

    if (!label && !helperText) {
      return inputElement;
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#1e293b]">
            {label}
          </label>
        )}
        {inputElement}
        {helperText && (
          <p className={cn("text-xs", error ? "text-rose-600 font-medium" : "text-[#475569]")}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
