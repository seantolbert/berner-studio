import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "maple" | "oak" | "walnut" | "accent";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral:
    "bg-muted text-ink/80",
  maple:
    "bg-maple-300 text-ink/80",
  oak:
    "bg-oak-600 text-paper",
  walnut:
    "bg-walnut-700 text-paper",
  accent:
    "bg-accent text-paper",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 h-6 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

export default Badge;

