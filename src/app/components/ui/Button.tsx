"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-sm focus-ink transition-colors whitespace-nowrap select-none disabled:opacity-50 disabled:pointer-events-none";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-xs",
  md: "h-10 px-4 text-sm rounded-sm",
  lg: "h-11 px-5 text-base rounded-md",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-paper hover:bg-accent/90 active:bg-accent/85",
  secondary:
    "bg-ink text-paper hover:bg-ink/90 active:bg-ink/85",
  ghost:
    "bg-transparent text-ink hover:bg-muted/60 active:bg-muted border border-ink/10",
  link: "bg-transparent text-accent underline-offset-4 hover:underline px-0 h-auto",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", block = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], block && "w-full", className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;

