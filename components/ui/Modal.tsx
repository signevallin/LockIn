'use client';
import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

let lockCount = 0;

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
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
        className="relative w-full max-w-md bg-cream rounded-t-2xl shadow-xl outline-none flex flex-col max-h-[85dvh]"
      >
        {title && (
          <div className="px-6 pt-6 pb-2 flex-shrink-0">
            <h2 id="modal-title" className="text-lg font-bold text-earth">{title}</h2>
          </div>
        )}
        <div className="overflow-y-auto px-6 pt-2 pb-4 flex-1 min-h-0" style={{WebkitOverflowScrolling: 'touch'}}>
          {children}
        </div>
        {footer && (
          <div className="px-6 pb-8 pt-3 flex-shrink-0 border-t border-sage/20">
            {footer}
          </div>
        )}
        {!footer && <div className="pb-4 flex-shrink-0" />}
      </div>
    </div>
  );
}
