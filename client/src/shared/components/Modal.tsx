import React, { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Basic focus trap - focus first input if possible
      const focusableElements = panelRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableElements && focusableElements.length) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-text-base">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${sizes[size]} bg-surface rounded-xl shadow-md flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-center justify-between p-6 border-b border-divider shrink-0">
          <h2 id="modal-title" className="font-display font-bold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:bg-surface-offset hover:text-text-base rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="border-t border-divider p-4 flex justify-end gap-2 shrink-0 bg-surface rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
