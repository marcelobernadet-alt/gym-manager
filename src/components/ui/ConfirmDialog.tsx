import React from 'react';
import { Modal } from './Modal';

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, message, confirmLabel = 'Confirmar', danger, onConfirm, onCancel }) => (
  <Modal open={open} onClose={onCancel} title={title}>
    <p className="text-sm text-neutral-400 mb-6">{message}</p>
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 rounded-xl bg-[#222222] text-neutral-300 font-semibold text-sm hover:bg-[#2a2a2a] transition-colors"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
          danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  </Modal>
);
