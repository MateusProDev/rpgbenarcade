import React, { useEffect } from 'react';

interface ModalProps {
  open:     boolean;
  onClose:  () => void;
  title?:   string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-castle-stone border border-castle-gold rounded-lg shadow-2xl max-w-lg w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-parchment-100 font-medieval text-xl">{title}</h2>
            <button onClick={onClose} className="text-parchment-400 hover:text-parchment-100 text-2xl leading-none">×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
