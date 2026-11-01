'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, AlertCircle } from 'lucide-react';
import { WeekSchedule } from '../../types';
import { buildPublicScheduleUrl } from '../../lib/scheduleEngine';

interface LinkEscalaCardProps {
  schedule: WeekSchedule;
  onCopySuccess?: () => void;
}

export function LinkEscalaCard({ schedule, onCopySuccess }: LinkEscalaCardProps) {
  const [copied, setCopied] = useState(false);

  const isPublishedAndActive = schedule.isPublished && schedule.isPublicShareEnabled;

  const shareUrl = buildPublicScheduleUrl(schedule);

  const handleCopyLink = () => {
    if (!isPublishedAndActive) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!isPublishedAndActive) return;
    const text = encodeURIComponent(
      `Escala de Trabalho - Escalas iLoc:\nConfira os dias e turnos de trabalho atualizados no link oficial:\n${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (!isPublishedAndActive) {
    return (
      <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200/60">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800">
            Link da escala
          </span>
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
            O link da escala estará disponível após a publicação pelo administrador.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-3">
      {/* Topo do Card */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Link da escala
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Oficial Publicada
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Link exclusivo gerado e publicado pelo administrador
            </span>
          </div>
        </div>
      </div>

      {/* Campo de Leitura com Botao Copiar Link e Botão WhatsApp */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-2xl flex-1">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-slate-700 px-2.5 flex-1 focus:outline-none select-all truncate font-mono"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copiado' : 'Copiar link'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="h-11 sm:h-auto sm:py-2.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 active:scale-[0.99] text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Compartilhar no WhatsApp</span>
        </button>
      </div>
    </section>
  );
}
