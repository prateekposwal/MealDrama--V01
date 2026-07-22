import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ToastMessage {
  message: string;
  type: 'error' | 'success' | 'info';
  action?: { label: string; onClick: () => void };
}

export const Toast: React.FC<{ message: string; type: ToastMessage['type']; action?: ToastMessage['action']; onClose: () => void }> = ({ message, type, action, onClose }) => {
  const colors = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-gray-800',
  };
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed top-4 left-4 right-4 max-w-lg mx-auto ${colors[type]} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-2 z-[100] animate-in slide-in-from-top-2`}>
      <span className="font-medium text-sm flex-1">{message}</span>
      {action && (
        <button
          onClick={() => { action.onClick(); onClose(); }}
          className="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold active:scale-95 transition-all whitespace-nowrap hover:bg-white/30"
        >
          {action.label}
        </button>
      )}
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
};
