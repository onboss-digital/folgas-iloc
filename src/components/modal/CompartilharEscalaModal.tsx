'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldAlert,
  Send,
  MessageCircle,
} from 'lucide-react';
import { WeekSchedule } from '../../types';
import { buildPublicScheduleUrl } from '../../lib/scheduleEngine';

interface CompartilharEscalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: WeekSchedule;
  isAdmin?: boolean;
  onTogglePublicShare: (enabled: boolean) => void;
  onCopySuccess: () => void;
}

export function CompartilharEscalaModal({
  isOpen,
  onClose,
  schedule,
  isAdmin = false,
  onTogglePublicShare,
  onCopySuccess,
}: CompartilharEscalaModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isPublishedAndActive = schedule.isPublished && schedule.isPublicShareEnabled;

  // Identificador exclusivo do link público (token prioritário ou weekId)
  const tokenParam = schedule.shareToken || schedule.weekId;

  // URL pública completa e auditável
  const shareUrl = typeof window !== 'undefined'
    ? (tokenParam
        ? `${window.location.origin}/escala-publica?token=${encodeURIComponent(tokenParam)}`
        : `${window.location.origin}/escala-publica`)
    : (tokenParam
        ? `http://localhost:3000/escala-publica?token=${encodeURIComponent(tokenParam)}`
        : 'http://localhost:3000/escala-publica');

  const handleCopyLink = () => {
    if (!isPublishedAndActive) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onCopySuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!isPublishedAndActive) return;
    const text = encodeURIComponent(
      `Escala de Trabalho - Escalas iLoc:\nConfira os dias e turnos de trabalho atualizados no link:\n${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleOpenPreview = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-slate-900">
                Link da escala
              </h2>
              <span className="text-[11px] text-slate-500">
                Oficial Publicada
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Administrador: Controle de Ativação / Revogação do Link */}
        {isAdmin ? (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">
                Link Público Ativo
              </span>
              <span className="text-[11px] text-slate-500">
                {schedule.isPublicShareEnabled
                  ? 'Qualquer pessoa com o link pode consultar'
                  : 'Acesso público desativado / revogado'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onTogglePublicShare(!schedule.isPublicShareEnabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                schedule.isPublicShareEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  schedule.isPublicShareEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ) : (
          /* Colaborador: Informativo de Origem Administrativa */
          <div className="px-3 py-2 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-blue-900 text-[11px] font-medium flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>Link oficial gerado e publicado pelo administrador.</span>
          </div>
        )}

        {isPublishedAndActive ? (
          <>
            {/* Campo com Link para Copiar */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Link de Acesso Direto
              </label>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-transparent text-xs text-slate-700 px-2.5 flex-1 focus:outline-none select-all truncate font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar link'}</span>
                </button>
              </div>
            </div>

            {/* Ações Principais: WhatsApp e Visualizar */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleShareWhatsApp}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartilhar no WhatsApp</span>
              </button>

              <button
                onClick={handleOpenPreview}
                className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                <span>Visualizar Página Pública</span>
              </button>
            </div>
          </>
        ) : (
          /* Mensagem Solicitada quando não há escala publicada ou link revogado */
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">
              O link da escala estará disponível após a publicação pelo administrador.
            </p>
          </div>
        )}

        <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100">
          A página pública exibe apenas os turnos operacionais, sem dados confidenciais ou administrativos.
        </div>
      </div>
    </div>
  );
}
