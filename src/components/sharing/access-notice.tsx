import Link from "next/link";
export function AccessNotice({ owner, scope, canWrite }: { owner: boolean; scope: string; canWrite: boolean }) {
  if (owner) return null;
  return <p className="rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">Véhicule partagé · {scope === "COMPLETE" ? "Complet" : "Simple : carburant, dépenses et kilomètres"} · <strong className="font-medium text-[var(--text)]">{canWrite ? "Lecture/Modification" : "Lecture seule"}</strong>. {!canWrite ? "Votre accès permet de consulter ce dossier. " : ""}<Link href="/garage" className="text-[var(--accent)] underline underline-offset-4">Voir le partage dans le Garage</Link></p>;
}
