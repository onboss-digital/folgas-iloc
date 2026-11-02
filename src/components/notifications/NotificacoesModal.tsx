'use client';

import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeftRight,
  Calendar,
  CheckCheck,
  ShieldAlert,
} from 'lucide-react';
import { AppNotification, AuthUser, TimezonePreference } from '../../types';
import { formatDateTime } from '../../lib/dateUtils';

interface NotificacoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  notifications: AppNotification[];
  timezonePreference?: TimezonePreference;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onOpenSwapAction?: (notification: AppNotification) => void;
}

export function NotificacoesModal({
  isOpen,
  onClose,
  currentUser,
  notifications,
  timezonePreference = 'brasilia',
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenSwapAction,
}: NotificacoesModalProps) {
  if (!isOpen || !currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Filtra as notificações destinadas a este usuário
  const userNotifications = notifications.filter(n => {
    if (isAdmin) {
      return (
        n.recipientId === currentUser.id ||
        n.recipientId === 'admin' ||
        n.recipientRole === 'admin' ||
        n.recipientRole === 'all'
      );
    }
    return n.recipientId === currentUser.id || n.recipientRole === 'all';
  });

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'swap_requested':
        return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
      case 'swap_accepted':
      case 'swap_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'swap_rejected':
      case 'swap_admin_rejected':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'swap_admin_review':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'schedule_published':
      default:
        return <Calendar className="w-4 h-4 text-blue-600" />;
    }
  };

  const getActionLabel = (type: AppNotification['type']) => {
    switch (type) {
      case 'swap_requested':
        return 'Ver e responder troca';
      case 'swap_admin_review':
        return 'Revisar e decidir troca';
      case 'swap_accepted':
      case 'swap_rejected':
      case 'swap_approved':
      case 'swap_admin_rejected':
        return 'Ver detalhes da troca';
      default:
        return 'Ver escala';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Notificações
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Acompanhe em tempo real suas solicitações de trocas e avisos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Marcar todas como lidas</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div className="p-4 overflow-y-auto flex flex-col gap-2.5 flex-1 divide-y divide-slate-100">
          {userNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 my-auto">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700">
                Nenhuma notificação no momento
              </span>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                Você será avisado aqui assim que receber solicitações de trocas de escala ou atualizações da sua equipe.
              </p>
            </div>
          ) : (
            userNotifications.map(notif => (
              <div
                key={notif.id}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-colors flex flex-col gap-2 ${
                  notif.read ? 'bg-white hover:bg-slate-50/60' : 'bg-blue-50/40 border border-blue-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug mt-1">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {formatDateTime(notif.createdAt, timezonePreference)}
                      </span>
                    </div>
                  </div>

                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => onMarkAsRead(notif.id)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold whitespace-nowrap active:scale-95"
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>

                {/* Botão de Ação Direta se vinculado a uma troca */}
                {notif.relatedSwapId && onOpenSwapAction && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onMarkAsRead(notif.id);
                        onOpenSwapAction(notif);
                        onClose();
                      }}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold active:scale-95 transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <span>{getActionLabel(notif.type)}</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-center">
          <span className="text-[10px] text-slate-400">
            As notificações do sistema permanecem salvas para consulta do histórico.
          </span>
        </div>
      </div>
    </div>
  );
}
