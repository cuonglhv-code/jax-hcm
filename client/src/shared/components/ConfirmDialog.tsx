import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger'
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  };

  const footer = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
      <Button variant={variant} onClick={handleConfirm} loading={isPending}>
        {confirmLabel}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!isPending) onClose(); }} title={title} footer={footer} size="sm">
      <p className="text-text-base text-sm">{message}</p>
    </Modal>
  );
}
