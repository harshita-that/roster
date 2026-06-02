import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, icon, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap";
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
      ghost: "hover:bg-muted text-foreground focus:ring-muted",
      outline: "border border-border bg-background text-foreground hover:bg-muted focus:ring-primary",
    };
    const sizes = {
      sm: "text-xs px-3 py-1.5 h-8",
      md: "text-sm px-4 py-2 h-9",
      lg: "text-sm px-5 py-2.5 h-10",
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function IconButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition", className)}
      {...props}
    >
      {children}
    </button>
  );
}
