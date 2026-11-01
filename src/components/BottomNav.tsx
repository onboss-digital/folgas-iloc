'use client';

import React from 'react';
import { LayoutDashboard, CalendarDays, Settings } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  isAdmin?: boolean;
}

export function BottomNav({ activeTab, onChangeTab, isAdmin = false }: BottomNavProps) {
  const allTabs: { id: ActiveTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    {
      id: 'inicio',
      label: 'Início',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'escala',
      label: isAdmin ? 'Gerenciar' : 'Escala',
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      id: 'ajustes',
      label: 'Ajustes',
      icon: <Settings className="w-5 h-5" />,
      adminOnly: true,
    },
  ];

  const visibleTabs = isAdmin ? allTabs : allTabs.filter(t => !t.adminOnly);
  const gridColsClass = isAdmin ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-40 pb-safe bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(15,23,42,0.04)]">
      <div className={`h-16 max-w-lg mx-auto px-4 grid ${gridColsClass} items-center justify-items-center`}>
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-12 py-1 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-all ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[11px] leading-none tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
