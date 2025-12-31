import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-border text-foreground hover:bg-secondary hover:border-primary/50",
        accent: "border-transparent bg-accent text-accent-foreground hover:bg-accent/90",
        success: "border-transparent bg-emerald-500/15 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
        gradient: "border-0 bg-gradient-primary text-primary-foreground shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
