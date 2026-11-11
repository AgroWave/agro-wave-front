import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Root Card container element styled for light institutional surfaces.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-none border border-slate-300 bg-white shadow-2xs text-[#0f172a]",
        className
      )}
      {...props}
    />
  );
}

/**
 * Card header section containing title and description.
 */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 px-6 py-4 bg-[#eae9e6] border-b border-slate-300 rounded-none",
        className
      )}
      {...props}
    />
  );
}

/**
 * Card title heading.
 */
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-bold tracking-tight text-[#0f172a]", className)}
      {...props}
    />
  );
}

/**
 * Card descriptive subtitle text.
 */
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-[#475569]", className)} {...props} />;
}

/**
 * Primary content body of the card.
 */
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

/**
 * Bottom action area or footer of the card.
 */
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center px-6 py-4 border-t border-slate-300 bg-[#f8f9fb] rounded-none",
        className
      )}
      {...props}
    />
  );
}
