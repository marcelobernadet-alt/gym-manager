import React from 'react';
import { X } from 'lucide-react';

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ open, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div
        className={`bg-[#141414] border border-neutral-800 rounded-t-3xl sm:rounded-3xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto text-white shadow-2xl`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 sticky top-0 bg-[#141414]">
          <h3 className="font-bold text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#222222] text-neutral-400 hover:text-white hover:bg-[#333333] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
