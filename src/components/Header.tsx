'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut,
  User,
  ChevronDown,
  Edit3,
  LayoutDashboard,
  CalendarDays,
  Settings,
} from 'lucide-react';
import { AuthUser, ActiveTab } from '../types';

interface HeaderProps {
  currentTabTitle: string;
  onOpenShareModal?: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  employeeAvatarUrl?: string;
  activeTab?: ActiveTab;
  onChangeTab?: (tab: ActiveTab) => void;
}

export function Header({
  currentTabTitle,
  currentUser,
  onLogout,
  onOpenProfile,
  employeeAvatarUrl,
  activeTab,
  onChangeTab,
}: HeaderProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Tabs de navegação desktop
  const desktopTabs: { id: ActiveTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    {
      id: 'inicio',
      label: 'Início',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'escala',
      label: isAdmin ? 'Gerenciar Escalas' : 'Escala do Time',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'ajustes',
      label: 'Ajustes',
      icon: <Settings className="w-4 h-4" />,
      adminOnly: true,
    },
  ];

  const visibleDesktopTabs = isAdmin ? desktopTabs : desktopTabs.filter(t => !t.adminOnly);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Iniciais do nome
  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'IL';

  const userPhoto = employeeAvatarUrl || currentUser?.avatarUrl;
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Usuário';

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Identificação da Marca e Página */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0">
            iLoc
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-base text-slate-900 tracking-tight truncate">
                Escalas iLoc
              </span>
              {currentUser && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'Colaborador'}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 truncate">
              {currentUser
                ? `${currentUser.name} • ${currentTabTitle}`
                : `Filial Central • ${currentTabTitle}`}
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DESKTOP NO TOPO (CENTRO) */}
        {currentUser && onChangeTab && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            {visibleDesktopTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Menu do Perfil: Apenas no clique */}
        {currentUser && (
          <div
            ref={menuRef}
            className="relative flex items-center flex-shrink-0"
          >
            <button
              type="button"
              onClick={() => setIsMenuOpen(prev => !prev)}
              aria-label="Menu de perfil do usuário"
              className="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs group"
            >
              {/* Foto ou Iniciais */}
              <div className="relative">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-2xs">
                    {initials}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>

              {/* Nome e Indicador */}
              <div className="hidden sm:flex flex-col text-left pr-1">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {firstName}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-600 transition-colors">
                  Meu Perfil
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isMenuOpen ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>

            {/* Menu Dropdown Flutuante */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-slate-200 p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50 flex flex-col gap-1">
                {/* Cabecalho do Menu */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">
                      {currentUser.email}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-1" />

                {/* Opcao: Editar Perfil */}
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 active:scale-95 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-blue-600" />
                      <span>Editar perfil</span>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      Acessar
                    </span>
                  </button>
                )}

                {/* Opcao: Sair da Plataforma */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 active:scale-95 flex items-center gap-2 transition-all"
                  >
                    <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-600" />
                    <span>Sair da conta</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
