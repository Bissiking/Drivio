"use client";
import { NOTIFICATION_TYPES, NOTIFICATION_LABELS } from "@/lib/notification-types";
import { useState } from "react";
import { ApiForm } from "./api-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
type Settings = { enabled: boolean; maintenance: boolean; warranty: boolean; inspection: boolean; insurance: boolean; warningDays: number; warningKm: number; hasToken: boolean; enabledTypes: string[] };
export function NotificationForm({ settings }: { settings: Settings }) {
  const [sending, setSending] = useState(false), [result, setResult] = useState("");
  async function send() {
    setSending(true); setResult("");
    try { const response = await fetch("/api/notifications/send", { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Envoi impossible."); setResult(`${data.sent} notification(s) envoyée(s), ${data.skipped} déjà traitée(s), ${data.failed} échec(s).`); }
    catch (error) { setResult(error instanceof Error ? error.message : "Envoi impossible."); }
    finally { setSending(false); }
  }
  return <div className="space-y-6"><ApiForm endpoint="/api/notifications/settings" resetOnSuccess={false} transform={raw => {
      const enabledTypes = NOTIFICATION_TYPES.filter(type => raw[type] === "true");
      return { ...raw, enabledTypes, maintenance: enabledTypes.some(t => t.startsWith("maintenance")), warranty: enabledTypes.some(t => t.startsWith("warranty")), inspection: enabledTypes.some(t => t.startsWith("inspection")), insurance: enabledTypes.includes("insurance") };
    }} submitLabel="Enregistrer les notifications"><div className="space-y-3"><label className="flex items-start gap-3 text-sm"><input type="checkbox" name="enabled" value="true" defaultChecked={settings.enabled} className="mt-1 size-4 accent-[var(--accent)]" />Activer Gotify</label>{NOTIFICATION_TYPES.map(name => <label key={name} className="flex items-start gap-3 text-sm"><input type="checkbox" name={name} value="true" defaultChecked={settings.enabledTypes.includes(name)} className="mt-1 size-4 accent-[var(--accent)]" />{NOTIFICATION_LABELS[name]}</label>)}</div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="notify-days">Prévenir avant (jours)</Label><Input id="notify-days" name="warningDays" type="number" min="1" max="365" defaultValue={settings.warningDays} required /></div><div><Label htmlFor="notify-km">Prévenir avant (km)</Label><Input id="notify-km" name="warningKm" type="number" min="1" max="50000" defaultValue={settings.warningKm} required /></div></div><div><Label htmlFor="notify-token">Token d’application Gotify</Label><Input id="notify-token" name="token" type="password" autoComplete="new-password" placeholder={settings.hasToken ? "Token enregistré · laisser vide pour le conserver" : "Token de votre application Gotify"} /><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Le token est chiffré sur le serveur et n’est jamais renvoyé au navigateur. Serveur : notify.mhemery.fr.</p></div><label className="flex items-start gap-3 text-sm text-[var(--muted)]"><input type="checkbox" name="clearToken" value="true" className="mt-1 size-4" />Supprimer le token enregistré (désactivez aussi Gotify)</label></ApiForm><div className="border-t border-[var(--line-soft)] pt-5"><Button type="button" variant="outline" disabled={sending || !settings.enabled || !settings.hasToken} onClick={send}>{sending ? "Envoi…" : "Envoyer les alertes dues"}</Button>{result ? <p role="status" className="mt-3 text-sm">{result}</p> : null}</div></div>;
}
