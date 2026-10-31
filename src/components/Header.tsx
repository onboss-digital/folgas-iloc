'use client';

import React from 'react';
import { Bell, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentTabTitle: string;
}

export function Header({ currentTabTitle }: HeaderProps) {
  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
            iLoc
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-slate-900 truncate">
                Folgas iLoc
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold uppercase tracking-wider">
                Admin
              </span>
            </div>
            <span className="text-xs text-slate-500 truncate">
              Filial Central • {currentTabTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>5x2 CLT</span>
          </div>
        </div>
      </div>
    </header>
  );
}
