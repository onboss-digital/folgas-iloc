'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowLeftRight,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  User,
  Users,
} from 'lucide-react';
import { Employee, WeekSchedule, DayInfo, AuthUser, ShiftSwapRequest } from '../../types';
import { formatNameAndSurname, getEmployeeDayHours } from '../../lib/scheduleEngine';
import { getNowIsoBrasilia } from '../../lib/dateUtils';

interface SolicitarTrocaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  allEmployees: Employee[];
  schedule: WeekSchedule;
  days: DayInfo[];
  existingSwaps: ShiftSwapRequest[];
  onSubmitSwap: (swap: ShiftSwapRequest) => Promise<void>;
}

export function SolicitarTrocaModal({
  isOpen,
  onClose,
  currentUser,
  allEmployees,
  schedule,
  days,
  existingSwaps,
  onSubmitSwap,
}: SolicitarTrocaModalProps) {
  const [selectedMyDayIdx, setSelectedMyDayIdx] = useState<number>(0);
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>('');
  const [selectedTargetDayIdx, setSelectedTargetDayIdx] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen || !currentUser) return null;

  // Identifica o colaborador logado
  const currentEmp = allEmployees.find(
    e => e.id === currentUser.id || e.email?.toLowerCase() === currentUser.email?.toLowerCase()
  );

  if (!currentEmp) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">Perfil não vinculado</h2>
          <p className="text-xs text-slate-500">
            Seu usuário precisa estar cadastrado como colaborador ativo da equipe para solicitar trocas de escala.
          </p>
          <button
            onClick={onClose}
            className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // Regra de Negócio: Somente colaboradores da MESMA equipe
  const userTeam = currentEmp.team || 'Operações de Loja';
  const teamColleagues = allEmployees.filter(
    e => e.id !== currentEmp.id && e.status === 'active' && (e.team || 'Operações de Loja') === userTeam
  );

  const targetEmp = teamColleagues.find(e => e.id === targetEmployeeId);

  // Escala atual do solicitante
  const myShifts = schedule.shifts[currentEmp.id] || Array(7).fill('T');
  const myCustomHours = schedule.customHours?.[currentEmp.id] || Array(7).fill(undefined);
  const mySelectedDay = days[selectedMyDayIdx] || days[0];
  const mySelectedShift = myShifts[selectedMyDayIdx] || 'T';
  const mySelectedHours = getEmployeeDayHours(schedule, currentEmp, selectedMyDayIdx);

  // Escala atual do colega selecionado
  const targetShifts = targetEmp ? schedule.shifts[targetEmp.id] || Array(7).fill('T') : [];
  const targetSelectedDay = days[selectedTargetDayIdx] || days[0];
  const targetSelectedShift = targetShifts[selectedTargetDayIdx] || 'T';
  const targetSelectedHours = targetEmp
    ? getEmployeeDayHours(schedule, targetEmp, selectedTargetDayIdx)
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!targetEmp) {
      setErrorMessage('Selecione um colega da mesma equipe para a troca.');
      return;
    }

    // Validação: não permitir troca com a mesma pessoa
    if (targetEmp.id === currentEmp.id) {
      setErrorMessage('Você não pode solicitar troca com você mesmo.');
      return;
    }

    // Validação: verificar conflito de solicitações ativas
    const hasActiveConflict = existingSwaps.some(
      s =>
        (s.status === 'pendente_colega' || s.status === 'pendente_admin') &&
        s.weekId === schedule.weekId &&
        ((s.requesterId === currentEmp.id && s.requesterDayIndex === selectedMyDayIdx) ||
          (s.targetId === currentEmp.id && s.targetDayIndex === selectedMyDayIdx) ||
          (s.requesterId === targetEmp.id && s.requesterDayIndex === selectedTargetDayIdx) ||
          (s.targetId === targetEmp.id && s.targetDayIndex === selectedTargetDayIdx))
    );

    if (hasActiveConflict) {
      setErrorMessage(
        'Já existe uma solicitação de troca pendente envolvendo um dos colaboradores para os dias selecionados.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const newSwap: ShiftSwapRequest = {
        id: `swap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        weekId: schedule.weekId,
        requesterId: currentEmp.id,
        requesterName: currentEmp.name,
        requesterTeam: userTeam,
        targetId: targetEmp.id,
        targetName: targetEmp.name,
        targetTeam: userTeam,
        requesterDayIndex: selectedMyDayIdx,
        requesterDayDate: mySelectedDay.fullDate,
        requesterOriginalShift: mySelectedShift,
        requesterOriginalHours: mySelectedHours,
        targetDayIndex: selectedTargetDayIdx,
        targetDayDate: targetSelectedDay.fullDate,
        targetOriginalShift: targetSelectedShift,
        targetOriginalHours: targetSelectedHours,
        reason: reason.trim() || undefined,
        status: 'pendente_colega',
        createdAt: getNowIsoBrasilia(),
      };

      await onSubmitSwap(newSwap);
      onClose();
    } catch {
      setErrorMessage('Ocorreu uma falha ao enviar a solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh] overflow-hidden">
        {/* Topo do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Solicitar Troca de Escala
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                  BRT
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Equipe: {userTeam} • Horário Local
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

        {/* Corpo com formulário */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5 text-left">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PASSO 1: Selecionar o seu turno/dia que deseja trocar */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                1
              </span>
              Seu turno que deseja trocar:
            </label>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const shift = myShifts[idx] || 'T';
                const isSelected = selectedMyDayIdx === idx;
                const hours = getEmployeeDayHours(schedule, currentEmp, idx);

                return (
                  <button
                    key={day.fullDate}
                    type="button"
                    onClick={() => setSelectedMyDayIdx(idx)}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-700 text-white shadow-xs scale-[1.02]'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {day.name}
                    </span>
                    <span className="text-xs font-black my-0.5">
                      {day.dayNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : shift === 'T'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {shift === 'T' ? 'Trabalho' : 'Folga'}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-700">
              <span className="font-semibold">
                Você selecionou: {mySelectedDay.name}-feira ({mySelectedDay.formattedDate})
              </span>
              <span className="font-bold text-blue-700">
                {mySelectedShift === 'T' ? `Trabalho (${mySelectedHours})` : 'Dia de Folga'}
              </span>
            </div>
          </div>

          {/* PASSO 2: Selecionar o colega da mesma equipe */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                2
              </span>
              Colega da mesma equipe para a troca:
            </label>

            {teamColleagues.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Nenhum outro colaborador ativo cadastrado na sua equipe ({userTeam}).</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-0.5">
                {teamColleagues.map(colleague => {
                  const isSelected = targetEmployeeId === colleague.id;
                  return (
                    <button
                      key={colleague.id}
                      type="button"
                      onClick={() => {
                        setTargetEmployeeId(colleague.id);
                        setSelectedTargetDayIdx(selectedMyDayIdx);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full ${colleague.colorBg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}
                      >
                        {colleague.initials}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {formatNameAndSurname(colleague.name)}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {colleague.role}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* PASSO 3: Visualizar a escala do colega e escolher o dia dele */}
          {targetEmp && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  3
                </span>
                Escala de {formatNameAndSurname(targetEmp.name)} (proposta de retorno):
              </label>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const shift = targetShifts[idx] || 'T';
                  const isSelected = selectedTargetDayIdx === idx;
                  const hours = getEmployeeDayHours(schedule, targetEmp, idx);

                  return (
                    <button
                      key={day.fullDate}
                      type="button"
                      onClick={() => setSelectedTargetDayIdx(idx)}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {day.name}
                      </span>
                      <span className="text-xs font-black my-0.5">
                        {day.dayNumber}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : shift === 'T'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {shift === 'T' ? 'Trabalho' : 'Folga'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-700">
                <span className="font-semibold">
                  Turno do colega selecionado: {targetSelectedDay.name}-feira ({targetSelectedDay.formattedDate})
                </span>
                <span className="font-bold text-emerald-800">
                  {targetSelectedShift === 'T' ? `Trabalho (${targetSelectedHours})` : 'Dia de Folga'}
                </span>
              </div>
            </div>
          )}

          {/* Comparativo Visual da Troca Proposta */}
          {targetEmp && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                Resumo da Proposta de Troca
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-blue-200 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Você ({formatNameAndSurname(currentEmp.name)})
                  </span>
                  <span className="font-bold text-slate-900">
                    Cede: {mySelectedDay.name} ({mySelectedDay.formattedDate}) • {mySelectedShift === 'T' ? mySelectedHours : 'Folga'}
                  </span>
                  <span className="text-emerald-800 font-bold">
                    Recebe: {targetSelectedDay.name} ({targetSelectedDay.formattedDate}) • {targetSelectedShift === 'T' ? targetSelectedHours : 'Folga'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-blue-200 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Colega ({formatNameAndSurname(targetEmp.name)})
                  </span>
                  <span className="font-bold text-slate-900">
                    Cede: {targetSelectedDay.name} ({targetSelectedDay.formattedDate}) • {targetSelectedShift === 'T' ? targetSelectedHours : 'Folga'}
                  </span>
                  <span className="text-blue-700 font-bold">
                    Recebe: {mySelectedDay.name} ({mySelectedDay.formattedDate}) • {mySelectedShift === 'T' ? mySelectedHours : 'Folga'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Horários calculados de acordo com o Horário Local da sua equipe.
              </span>
            </div>
          )}

          {/* PASSO 4: Motivo / Observação */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800">
              Observação ou Motivo (opcional):
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Compromisso pessoal, consulta médica, necessidade de turno..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
            Fluxo oficial: 1. O colega recebe a solicitação e avalia o aceite • 2. Após o aceite, o administrador analisa e valida • 3. A escala é atualizada em definitivo.
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !targetEmp}
              className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitação de Troca'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
