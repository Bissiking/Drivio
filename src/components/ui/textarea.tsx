// src/components/ui/textarea.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-24 w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--quiet)] focus:border-[var(--accent)]", className)} {...props} />;
}
