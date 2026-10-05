// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-95",
        secondary: "bg-[var(--surface-soft)] text-[var(--text)] hover:bg-[var(--surface-raised)]",
        outline: "border border-[var(--line)] text-[var(--text)] hover:bg-[var(--surface-soft)]",
        danger: "bg-[var(--danger)]/12 text-[var(--danger)] hover:bg-[var(--danger)]/20",
        ghost: "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]",
      },
      size: { default: "h-10", sm: "h-8 rounded-lg px-3 text-xs", lg: "h-12 px-5" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
