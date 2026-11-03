import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Root Card container element.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-slate-100",
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
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

/**
 * Card title heading.
 */
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-bold tracking-tight text-white", className)}
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
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

/**
 * Primary content body of the card.
 */
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

/**
 * Bottom action area or footer of the card.
 */
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center p-6 pt-0 border-t border-slate-800/60 mt-4", className)} {...props} />
  );
}
