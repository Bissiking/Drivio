"use client";
import { cloneElement, isValidElement, useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return <div><Label htmlFor={id}>{label}</Label>{isValidElement<{ id?: string }>(children) ? cloneElement(children, { id }) : children}</div>;
}
