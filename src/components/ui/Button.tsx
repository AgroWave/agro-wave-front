import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

/**
 * Reusable interactive button component styled with the institutional light palette.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      disabled,
      isLoading = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#8b1919] focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variantStyles = {
      primary: "bg-[#8b1919] hover:bg-[#a31d1d] text-white border border-[#6e1111] shadow-2xs",
      secondary: "bg-[#eae9e6] hover:bg-[#dedcd7] text-[#0f172a] border border-slate-300 shadow-2xs",
      outline: "border border-slate-300 bg-white text-[#1e293b] hover:bg-[#f3f2ef] shadow-2xs",
      ghost: "text-[#334155] hover:bg-[#eae9e6] hover:text-[#0f172a]",
      destructive: "bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 shadow-2xs",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
