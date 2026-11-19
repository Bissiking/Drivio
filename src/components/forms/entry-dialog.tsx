"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EntryDialog({ open, title, onClose, busy = false, children }: { open: boolean; title: string; onClose: () => void; busy?: boolean; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null), heading = useRef<HTMLHeadingElement>(null), titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (open && element) {
      const priorOverflow = document.body.style.overflow;
      if (!element.open) element.showModal();
      document.body.style.overflow = "hidden";
      element.scrollTop = 0; heading.current?.focus();
      return () => { document.body.style.overflow = priorOverflow; };
    }
    if (!open && element?.open) element.close();
  }, [open, title]);
  return <dialog ref={dialog} aria-labelledby={titleId} onClose={onClose} onCancel={event => { if (busy) event.preventDefault(); }} onClick={event => { if (!busy && event.target === event.currentTarget) dialog.current?.close(); }} className="entry-dialog">
    <header className="entry-dialog-header"><h2 ref={heading} tabIndex={-1} id={titleId}>{title}</h2><Button type="button" variant="ghost" disabled={busy} aria-label="Fermer le formulaire" onClick={() => dialog.current?.close()}><X className="size-5" /></Button></header>
    <div className="entry-dialog-body">{children}</div>
  </dialog>;
}
