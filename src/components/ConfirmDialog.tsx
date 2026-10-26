import React, { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onOpenChange, title, description, confirmLabel, busy = false, error, onConfirm,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog
    ref={dialogRef}
    aria-labelledby="confirm-title"
    aria-describedby="confirm-description"
    onClose={() => onOpenChange(false)}
    onCancel={(event) => { if (busy) event.preventDefault(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-white p-0 text-[#171717] shadow-2xl backdrop:bg-black/40"
  >
    <div className="p-6">
      <h2 id="confirm-title" className="text-lg font-semibold">{title}</h2>
      <p id="confirm-description" className="mt-2 text-sm leading-6 text-[#666]">{description}</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</button>
        <button type="button" className="btn-primary bg-red-700" disabled={busy} onClick={() => void onConfirm()}>{confirmLabel}</button>
      </div>
    </div>
  </dialog>;
};
