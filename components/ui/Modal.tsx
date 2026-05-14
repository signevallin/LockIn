'use client';
import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

let lockCount = 0;

export function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    lockCount++;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      lockCount--;
      if (lockCount === 0) document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        className="absolute inset-0 bg-black/40 cursor-default"
        onClick={onClose}
        aria-label="Stäng"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className="relative w-full max-w-md bg-cream rounded-t-2xl p-6 shadow-xl max-h-[85vh] overflow-y-auto outline-none"
      >
        {title && <h2 id="modal-title" className="text-lg font-bold text-earth mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
