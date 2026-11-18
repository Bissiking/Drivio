"use client";
import { Field } from "@/components/forms/field";
import { Select } from "@/components/ui/select";
export function ShareRightsFields({ scope = "SIMPLE", permission = "READ" }: { scope?: string; permission?: string }) {
  return <><Field label="Périmètre"><Select name="scope" defaultValue={scope}><option value="SIMPLE">Simple</option><option value="COMPLETE">Complet</option></Select></Field><Field label="Droits"><Select name="permission" defaultValue={permission}><option value="READ">Lecture</option><option value="WRITE">Lecture/Modification</option></Select></Field></>;
}
