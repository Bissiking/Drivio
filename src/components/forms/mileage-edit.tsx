import { ApiForm } from "./api-form";
import { ApiActionButton } from "./api-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export function MileageEdit({ id, mileage, date, comment }: { id: string; mileage: number; date: string; comment: string | null }) {
  return <details className="min-w-60"><summary className="cursor-pointer py-2 text-sm text-[var(--accent)]">Modifier le relevé</summary><div className="space-y-4 py-4"><ApiForm endpoint={`/api/mileage/${id}`} method="PATCH" resetOnSuccess={false} submitLabel="Enregistrer"><div><Label htmlFor={`${id}-mileage`}>Kilométrage</Label><Input id={`${id}-mileage`} name="mileage" type="number" min="0" defaultValue={mileage} required /></div><div><Label htmlFor={`${id}-date`}>Date</Label><Input id={`${id}-date`} name="date" type="date" defaultValue={date} required /></div><div><Label htmlFor={`${id}-comment`}>Commentaire</Label><Textarea id={`${id}-comment`} name="comment" defaultValue={comment ?? ""} /></div><label className="flex items-start gap-2 text-xs text-[var(--muted)]"><input type="checkbox" name="allowCorrection" value="true" />Confirmer une correction qui contredit les relevés voisins</label></ApiForm><ApiActionButton endpoint={`/api/mileage/${id}`} method="DELETE" variant="danger" confirmation="Supprimer ce relevé ? Les distances seront recalculées. Les pleins liés seront conservés et dissociés du relevé.">Supprimer</ApiActionButton></div></details>;
}
