"use client";

export function TireRecordLink({ recordId }: { recordId: string }) {
  const target = `tire-record-${recordId}`;
  return <a href={`#${target}`} onClick={() => {
    const details = document.getElementById(target);
    if (details instanceof HTMLDetailsElement) details.open = true;
  }} className="mt-2 inline-block py-1 text-xs text-[var(--accent)]">Voir ou modifier ce montage</a>;
}
