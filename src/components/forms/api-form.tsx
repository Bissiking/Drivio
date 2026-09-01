// src/components/forms/api-form.tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ApiForm({ endpoint, children, submitLabel, className, transform }: { endpoint: string; children: React.ReactNode; submitLabel: string; className?: string; transform?: (data: Record<string, FormDataEntryValue>) => Record<string, unknown> }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const body = transform ? transform(raw) : raw;
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "L'enregistrement a échoué.");
      formRef.current?.reset();
      setMessage({ type: "success", text: "Enregistrement ajouté." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Une erreur est survenue." });
    } finally {
      setPending(false);
    }
  }
  return <form ref={formRef} onSubmit={submit} className={cn("space-y-5", className)}>{children}{message ? <p role="status" className={cn("text-sm", message.type === "error" ? "text-[var(--danger)]" : "text-[var(--accent)]")}>{message.text}</p> : null}<Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Enregistrement…" : submitLabel}</Button></form>;
}
