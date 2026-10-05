"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
export function ApiActionButton({ endpoint, body, children, variant = "outline", method = "PATCH", confirmation }: { endpoint: string; body?: Record<string, unknown>; children: React.ReactNode; variant?: ButtonProps["variant"]; method?: "PATCH" | "DELETE" | "POST"; confirmation?: string }) {
  const router = useRouter(), [pending, setPending] = useState(false), [error, setError] = useState("");
  async function run() {
    if (confirmation && !window.confirm(confirmation)) return;
    setPending(true); setError("");
    try {
      const response = await fetch(endpoint, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Action impossible.");
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Action impossible."); }
    finally { setPending(false); }
  }
  return <span className="inline-flex flex-col gap-1"><Button type="button" size="sm" variant={variant} disabled={pending} onClick={run}>{pending ? "Patientez…" : children}</Button>{error ? <span role="alert" className="max-w-64 text-xs text-[var(--danger)]">{error}</span> : null}</span>;
}
