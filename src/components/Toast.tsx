'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div
        className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 ${
          toast.type === 'success'
            ? 'bg-slate-900 text-white border-slate-800'
            : toast.type === 'warning'
            ? 'bg-amber-900 text-amber-50 border-amber-800'
            : 'bg-blue-900 text-blue-50 border-blue-800'
        }`}
      >
        {toast.type === 'success' && (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        )}
        {toast.type === 'warning' && (
          <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0" />
        )}
        {toast.type === 'info' && (
          <Info className="w-5 h-5 text-blue-300 flex-shrink-0" />
        )}
        <span className="text-xs font-semibold leading-snug">
          {toast.text}
        </span>
      </div>
    </div>
  );
}
