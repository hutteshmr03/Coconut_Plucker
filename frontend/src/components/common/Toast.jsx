import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-wrap">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle
            : toast.type === 'warning'
            ? AlertTriangle
            : Info;

        return (
          <div key={toast.id} className="toast">
            <Icon size={18} color={toast.type === 'success' ? '#2F7A4D' : '#D8A33D'} />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
