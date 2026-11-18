import { ApiForm } from "@/components/forms/api-form";
import { ApiActionButton } from "@/components/forms/api-action-button";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { ShareRightsFields } from "./share-rights-fields";
import { sharePermissionLabel, shareScopeLabel } from "@/lib/vehicle-sharing";
import { formatDate } from "@/lib/format";
type Share = { id: string; email: string; scope: string; permission: string; acceptedAt: Date | null; expiresAt: Date };
export function SharePanel({ vehicleId, shares }: { vehicleId: string; shares: Share[] }) {
  return <details className="scroll-mt-6 pt-3" id={`partages-${vehicleId}`}><summary className="cursor-pointer py-2 text-sm font-medium text-[var(--accent)]">Partager ce véhicule{shares.length ? ` · ${shares.length} accès ou invitation${shares.length > 1 ? "s" : ""}` : ""}</summary><div className="space-y-6 pt-4">
    <p className="max-w-prose text-sm leading-6 text-[var(--muted)]">Invitez une personne avec l’adresse e-mail de son compte Kyros. Elle retrouvera l’invitation dans son Garage et devra l’accepter. Simple donne accès au carburant, aux dépenses et aux kilomètres ; Complet ouvre tout le dossier. Vous gardez la gestion des partages.</p>
    <ApiForm endpoint={`/api/vehicles/${vehicleId}/shares`} submitLabel="Inviter cette personne" successMessage="Invitation créée. La personne peut l’accepter depuis son Garage."><div className="grid gap-4 sm:grid-cols-2"><Field label="Adresse e-mail de la personne"><Input name="email" type="email" autoComplete="off" required maxLength={254} /></Field><ShareRightsFields /></div></ApiForm>
    {shares.length ? <div className="divide-y divide-[var(--line-soft)]">{shares.map(share => <article key={share.id} className="space-y-3 py-4"><div><h3 className="break-all text-sm font-medium">{share.email}</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{shareScopeLabel(share.scope)} · {sharePermissionLabel(share.permission)} · {share.acceptedAt ? `Accepté le ${formatDate(share.acceptedAt)}` : share.expiresAt <= new Date() ? "Invitation expirée : invitez à nouveau cette adresse" : `En attente jusqu’au ${formatDate(share.expiresAt)}`}</p></div><details><summary className="cursor-pointer py-2 text-sm text-[var(--accent)]">Modifier les droits</summary><div className="pt-3"><ApiForm endpoint={`/api/vehicles/${vehicleId}/shares/${share.id}`} method="PATCH" resetOnSuccess={false} submitLabel="Enregistrer les droits"><div className="grid gap-4 sm:grid-cols-2"><ShareRightsFields scope={share.scope} permission={share.permission} /></div></ApiForm></div></details><ApiActionButton endpoint={`/api/vehicles/${vehicleId}/shares/${share.id}`} method="DELETE" variant="danger" confirmation={`Retirer l’accès de ${share.email} à ce véhicule ?`}>Retirer l’accès</ApiActionButton></article>)}</div> : <p className="text-sm text-[var(--quiet)]">Aucun autre compte n’a accès à ce véhicule.</p>}
  </div></details>;
}
