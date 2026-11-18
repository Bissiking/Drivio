"use client";
import { useState } from "react";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, LABELS } from "@/lib/constants";
import { EXPENSE_SUBTYPES } from "@/lib/taxonomy";
export function ExpenseTypeFields({ category = "CARBURANT", subcategory = "", linked = false }: { category?: string; subcategory?: string | null; linked?: boolean }) {
  const [parent, setParent] = useState(category), [child, setChild] = useState(subcategory ?? "");
  return <><Field label="Type de dépense"><Select name="category" value={parent} onChange={e => { setParent(e.target.value); setChild(""); }}>{(linked ? ["ENTRETIEN"] : EXPENSE_CATEGORIES).map(item => <option key={item} value={item}>{LABELS[item]}</option>)}</Select></Field><Field label="Sous-type"><Select name="subcategory" value={child} onChange={e => setChild(e.target.value)}><option value="">Non précisé</option>{EXPENSE_SUBTYPES[parent]?.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select></Field></>;
}
