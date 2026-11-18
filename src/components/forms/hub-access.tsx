"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";

export function HubAccess({ expiresAt }: { expiresAt: string | null }) {
  const [expiry, setExpiry] = useState(expiresAt), [token, setToken] = useState("");
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  async function change(method: "POST" | "DELETE") {
    setPending(true); setMessage(""); setToken("");
    try {
      const response = await fetch("/api/preferences/hub", { method, signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message ?? "La modification a échoué.");
      setExpiry(data.expiresAt ?? null); setToken(data.token ?? "");
      setMessage(method === "POST" ? "Nouvel accès créé. L’ancien jeton est révoqué." : "Accès révoqué.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Le service est indisponible."); }
    finally { setPending(false); }
  }
  return <div className="space-y-4">
    <p className="max-w-prose text-sm leading-6 text-[var(--muted)]">LUMA peut lire vos véhicules, échéances et indicateurs avec un jeton personnel. Cet accès expire après 90 jours et ne permet aucune modification. Conservez le jeton uniquement dans la configuration serveur du Hub.</p>
    <p className="text-sm">{expiry ? `Expiration de l’accès : ${formatDate(new Date(expiry))}` : "Aucun accès Hub actif."}</p>
    <div className="flex flex-wrap gap-3"><Button type="button" disabled={pending} onClick={() => void change("POST")}>{pending ? "Modification…" : expiry ? "Remplacer le jeton" : "Créer un jeton LUMA"}</Button>{expiry ? <Button type="button" variant="danger" disabled={pending} onClick={() => void change("DELETE")}>Révoquer l’accès</Button> : null}</div>
    {token ? <label className="block text-sm">Jeton affiché une seule fois<Input className="mt-2 font-mono" value={token} readOnly onFocus={event => event.currentTarget.select()} /><span className="mt-2 block text-xs text-[var(--muted)]">Copiez-le maintenant. Il ne sera plus affiché après avoir quitté cette page.</span></label> : null}
    {message ? <p role="status" className="text-sm">{message}</p> : null}
  </div>;
}
