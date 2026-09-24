import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10',
    error: 'bg-white border-rose-200 text-slate-800 shadow-rose-500/10',
    info: 'bg-white border-blue-200 text-slate-800 shadow-blue-500/10'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-md">
      <div className={`flex items-start space-x-3 p-4 rounded-xl border shadow-xl ${bgColors[toast.type || 'info']}`}>
        <div className="flex-shrink-0 mt-0.5">
          {icons[toast.type || 'info']}
        </div>
        <div className="flex-1 pr-2">
          {toast.title && <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>}
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{toast.message}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
