// src/components/forms/api-action-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function ApiActionButton({ endpoint, body, children, variant = "outline" }: { endpoint: string; body?: Record<string, unknown>; children: React.ReactNode; variant?: ButtonProps["variant"] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setPending(true);
    setError("");
    const response = await fetch(endpoint, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) return setError(payload.error ?? "Action impossible.");
    router.refresh();
  }
  return <span className="inline-flex flex-col gap-1"><Button type="button" size="sm" variant={variant} disabled={pending} onClick={run}>{pending ? "Patientez…" : children}</Button>{error ? <span className="max-w-48 text-xs text-[var(--danger)]">{error}</span> : null}</span>;
}
