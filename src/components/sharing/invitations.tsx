import { Panel } from "@/components/layout/panel";
import { ApiActionButton } from "@/components/forms/api-action-button";
import { sharePermissionLabel, shareScopeLabel } from "@/lib/vehicle-sharing";
import { formatDate } from "@/lib/format";
type Invitation = { id: string; scope: string; permission: string; expiresAt: Date; vehicle: { brand: string; model: string } };
export function Invitations({ invitations }: { invitations: Invitation[] }) {
  if (!invitations.length) return null;
  return <Panel title="Invitations à partager un véhicule" description="Accepter ajoute le véhicule à votre Garage, sans recopier ses données."><div className="divide-y divide-[var(--line-soft)] px-5">{invitations.map(i => <article key={i.id} className="space-y-4 py-5"><div><h2 className="font-medium">{i.vehicle.brand} {i.vehicle.model}</h2><p className="mt-1 text-sm text-[var(--muted)]">{shareScopeLabel(i.scope)} · {sharePermissionLabel(i.permission)}</p><p className="mt-1 text-xs text-[var(--quiet)]">Invitation valable jusqu’au {formatDate(i.expiresAt)}</p></div><div className="flex flex-wrap gap-3"><ApiActionButton endpoint={`/api/shares/${i.id}`} method="POST">Accepter le partage</ApiActionButton><ApiActionButton endpoint={`/api/shares/${i.id}`} method="DELETE" variant="ghost">Refuser</ApiActionButton></div></article>)}</div></Panel>;
}
