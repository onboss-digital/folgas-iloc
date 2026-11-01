'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  Send,
  History,
  Ban,
  MessageSquare,
} from 'lucide-react';
import { ShiftSwapRequest, AuthUser, Employee } from '../../types';
import { formatNameAndSurname } from '../../lib/scheduleEngine';
import { formatDateTimeBrasilia, formatDateSimpleBrasilia, getNowIsoBrasilia } from '../../lib/dateUtils';

interface MinhasTrocasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  employees: Employee[];
  swaps: ShiftSwapRequest[];
  onRespondSwap: (swapId: string, accept: boolean, reason?: string) => Promise<void>;
  onCancelSwap: (swapId: string) => Promise<void>;
}

export function MinhasTrocasModal({
  isOpen,
  onClose,
  currentUser,
  employees,
  swaps,
  onRespondSwap,
  onCancelSwap,
}: MinhasTrocasModalProps) {
  const [activeTab, setActiveTab] = useState<'recebidas' | 'enviadas' | 'historico'>('recebidas');
  const [rejectingSwapId, setRejectingSwapId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen || !currentUser) return null;

  // Identifica o colaborador logado
  const currentEmp = employees.find(
    e => e.id === currentUser.id || e.email?.toLowerCase() === currentUser.email?.toLowerCase()
  );
  const myId = currentEmp?.id || currentUser.id;

  // Filtragem
  const recebidas = swaps.filter(s => s.targetId === myId);
  const recebidasPendentes = recebidas.filter(s => s.status === 'pendente_colega');
  const enviadas = swaps.filter(s => s.requesterId === myId);
  const historico = swaps.filter(s => s.requesterId === myId || s.targetId === myId);

  const getStatusBadge = (status: ShiftSwapRequest['status']) => {
    switch (status) {
      case 'pendente_colega':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Aguardando Colega
          </span>
        );
      case 'pendente_admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            Aguardando Gestor
          </span>
        );
      case 'aprovada':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Aprovada e Aplicada
          </span>
        );
      case 'recusada_colega':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 text-[11px] font-bold inline-flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            Recusada pelo Colega
          </span>
        );
      case 'recusada_admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 text-[11px] font-bold inline-flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            Recusada pelo Gestor
          </span>
        );
      case 'cancelada':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold inline-flex items-center gap-1">
            <Ban className="w-3 h-3 text-slate-400" />
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  const handleAccept = async (swapId: string) => {
    setIsProcessing(true);
    try {
      await onRespondSwap(swapId, true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async (swapId: string) => {
    setIsProcessing(true);
    try {
      await onRespondSwap(swapId, false, rejectionReason.trim());
      setRejectingSwapId(null);
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (swapId: string) => {
    setIsProcessing(true);
    try {
      await onCancelSwap(swapId);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh] overflow-hidden">
        {/* Topo do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Minhas Solicitações de Troca
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                  BRT
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Acompanhamento e respostas de trocas de turnos em Horário de Brasília
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas */}
        <div className="px-4 sm:px-5 pt-3 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('recebidas')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'recebidas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Recebidas</span>
            {recebidasPendentes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-black">
                {recebidasPendentes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enviadas')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'enviadas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviadas ({enviadas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'historico'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico ({historico.length})</span>
          </button>
        </div>

        {/* Lista de Solicitações */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3">
          {/* ABA RECEBIDAS */}
          {activeTab === 'recebidas' && (
            <>
              {recebidas.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <Inbox className="w-8 h-8 text-slate-300" />
                  <span>Você não possui solicitações de troca recebidas.</span>
                </div>
              ) : (
                recebidas.map(swap => {
                  const isPending = swap.status === 'pendente_colega';
                  const isRejecting = rejectingSwapId === swap.id;

                  return (
                    <div
                      key={swap.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            {formatNameAndSurname(swap.requesterName)}
                          </span>
                          <span className="text-[11px] text-slate-400">• {swap.requesterTeam}</span>
                        </div>
                        {getStatusBadge(swap.status)}
                      </div>

                      {/* Detalhes da Troca */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            O colega cede a você:
                          </span>
                          <span className="font-bold text-slate-900">
                            Data: {formatDateSimpleBrasilia(swap.requesterDayDate)}
                          </span>
                          <span className="text-emerald-800 font-bold">
                            Turno: {swap.requesterOriginalShift === 'T' ? swap.requesterOriginalHours : 'Dia de Folga'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Em troca do seu turno:
                          </span>
                          <span className="font-bold text-slate-900">
                            Data: {formatDateSimpleBrasilia(swap.targetDayDate)}
                          </span>
                          <span className="text-blue-700 font-bold">
                            Turno: {swap.targetOriginalShift === 'T' ? swap.targetOriginalHours : 'Dia de Folga'}
                          </span>
                        </div>
                      </div>

                      {swap.reason && (
                        <div className="text-xs text-slate-600 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>Motivo informado: &quot;{swap.reason}&quot;</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Solicitado em: {formatDateTimeBrasilia(swap.createdAt)}</span>
                        <span>Semana: {swap.weekId}</span>
                      </div>

                      {/* Ações de Aceite / Recusa */}
                      {isPending && !isRejecting && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setRejectingSwapId(swap.id)}
                            disabled={isProcessing}
                            className="h-9 px-3 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all"
                          >
                            Recusar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccept(swap.id)}
                            disabled={isProcessing}
                            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aceitar e Enviar ao Gestor</span>
                          </button>
                        </div>
                      )}

                      {/* Formulário de Motivo de Recusa */}
                      {isRejecting && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex flex-col gap-2 mt-1">
                          <label className="text-xs font-bold text-red-900">
                            Motivo da recusa (opcional):
                          </label>
                          <input
                            type="text"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Ex: Indisponibilidade na data solicitada..."
                            className="w-full h-9 px-3 bg-white border border-red-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                          />
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingSwapId(null);
                                setRejectionReason('');
                              }}
                              className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600"
                            >
                              Voltar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmReject(swap.id)}
                              disabled={isProcessing}
                              className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                            >
                              Confirmar Recusa
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ABA ENVIADAS */}
          {activeTab === 'enviadas' && (
            <>
              {enviadas.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <Send className="w-8 h-8 text-slate-300" />
                  <span>Você ainda não enviou solicitações de troca.</span>
                </div>
              ) : (
                enviadas.map(swap => {
                  const canCancel = swap.status === 'pendente_colega' || swap.status === 'pendente_admin';

                  return (
                    <div
                      key={swap.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Para:</span>
                          <span className="text-xs font-black text-slate-900">
                            {formatNameAndSurname(swap.targetName)}
                          </span>
                        </div>
                        {getStatusBadge(swap.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Seu turno oferecido:
                          </span>
                          <span className="font-bold text-slate-900">
                            Data: {formatDateSimpleBrasilia(swap.requesterDayDate)}
                          </span>
                          <span className="text-blue-700 font-bold">
                            {swap.requesterOriginalShift === 'T' ? swap.requesterOriginalHours : 'Dia de Folga'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Turno solicitado ao colega:
                          </span>
                          <span className="font-bold text-slate-900">
                            Data: {formatDateSimpleBrasilia(swap.targetDayDate)}
                          </span>
                          <span className="text-emerald-800 font-bold">
                            {swap.targetOriginalShift === 'T' ? swap.targetOriginalHours : 'Dia de Folga'}
                          </span>
                        </div>
                      </div>

                      {swap.rejectionReason && (
                        <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-100 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>Motivo da recusa: &quot;{swap.rejectionReason}&quot;</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Enviado em: {formatDateTimeBrasilia(swap.createdAt)}</span>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancel(swap.id)}
                            disabled={isProcessing}
                            className="text-slate-500 hover:text-red-600 font-bold text-xs hover:underline"
                          >
                            Cancelar Solicitação
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ABA HISTÓRICO */}
          {activeTab === 'historico' && (
            <>
              {historico.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <History className="w-8 h-8 text-slate-300" />
                  <span>Nenhuma troca registrada no histórico.</span>
                </div>
              ) : (
                historico.map(swap => (
                  <div
                    key={swap.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {formatNameAndSurname(swap.requesterName)} ⇄ {formatNameAndSurname(swap.targetName)}
                      </span>
                      {getStatusBadge(swap.status)}
                    </div>
                    <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{formatDateSimpleBrasilia(swap.requesterDayDate)} ({swap.requesterOriginalShift === 'T' ? swap.requesterOriginalHours : 'Folga'})</span>
                      <span>⇄</span>
                      <span>{formatDateSimpleBrasilia(swap.targetDayDate)} ({swap.targetOriginalShift === 'T' ? swap.targetOriginalHours : 'Folga'})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1 flex items-center justify-between">
                      <span>Criada: {formatDateTimeBrasilia(swap.createdAt)}</span>
                      {swap.adminDecidedAt && (
                        <span>Decisão Gestor: {formatDateTimeBrasilia(swap.adminDecidedAt)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
