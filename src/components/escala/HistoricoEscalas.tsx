'use client';

import React, { useState } from 'react';
import {
  History,
  ChevronLeft,
  ChevronRight,
  Check,
  X as IconX,
  Clock,
  Calendar,
  Briefcase,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Employee, DayInfo, WeekSchedule } from '../../types';
import {
  getWeekDays,
  getWeekDateRange,
  formatNameAndSurname,
  INITIAL_SCHEDULE_HISTORY,
} from '../../lib/scheduleEngine';
import { getWeekDisplayHeader } from './GerenciarEscalasTab';

interface HistoricoEscalasProps {
  employees: Employee[];
  todayStr: string;
  currentSchedule: WeekSchedule;
  scheduleHistory?: Record<string, WeekSchedule>;
  selectedTeam?: string;
  defaultEmployeeId?: string;
}

export function HistoricoEscalas({
  employees,
  todayStr,
  currentSchedule,
  scheduleHistory = INITIAL_SCHEDULE_HISTORY,
  selectedTeam,
  defaultEmployeeId,
}: HistoricoEscalasProps) {
  // Colaboradores filtrados pelo time (se houver time selecionado)
  const teamEmployees = selectedTeam
    ? employees.filter(e => e.status === 'active' && e.team === selectedTeam)
    : employees.filter(e => e.status === 'active');

  const defaultEmpId =
    defaultEmployeeId && employees.some(e => e.id === defaultEmployeeId)
      ? defaultEmployeeId
      : teamEmployees[0]?.id || employees[0]?.id || 'thiago';

  const [selectedEmpId, setSelectedEmpId] = useState<string>(defaultEmpId);

  // Sincroniza se defaultEmployeeId for alterado externamente
  React.useEffect(() => {
    if (defaultEmployeeId && employees.some(e => e.id === defaultEmployeeId)) {
      setSelectedEmpId(defaultEmployeeId);
    }
  }, [defaultEmployeeId, employees]);

  // Offset de semanas para o histórico (0 = semana atual, -1 = semana anterior, etc.)
  const [historyWeekOffset, setHistoryWeekOffset] = useState<number>(0);

  // Colaborador atualmente consultado
  const currentEmp =
    employees.find(e => e.id === selectedEmpId) ||
    teamEmployees[0] ||
    employees[0];

  // Informações da semana consultada
  const weekInfo = getWeekDateRange(historyWeekOffset);
  const weekDays = getWeekDays(weekInfo.startDateStr, todayStr);
  const weekHeader = getWeekDisplayHeader(weekDays);

  // Recupera a escala correspondente do histórico ou a atual
  let weekSchedule: WeekSchedule | undefined;
  if (historyWeekOffset === 0) {
    weekSchedule = currentSchedule;
  } else if (scheduleHistory[weekInfo.weekId]) {
    weekSchedule = scheduleHistory[weekInfo.weekId];
  }

  const isPublished = !!weekSchedule?.isPublished;
  const empShifts = isPublished && weekSchedule?.shifts[currentEmp?.id]
    ? weekSchedule.shifts[currentEmp.id]
    : null;

  // Cálculos do resumo do período
  let diasTrabalhados = 0;
  let diasFolga = 0;

  if (isPublished && empShifts) {
    weekDays.forEach((day, idx) => {
      const status = empShifts[idx];
      const isPastOrToday = day.fullDate <= todayStr;

      if (status === 'T') {
        // Regra: Não considerar escala futura como dia efetivamente trabalhado
        if (isPastOrToday) {
          diasTrabalhados++;
        }
      } else if (status === 'F') {
        diasFolga++;
      }
    });
  }

  const formatDayName = (shortName: string) => {
    const map: Record<string, string> = {
      SEG: 'Segunda',
      TER: 'Terça',
      QUA: 'Quarta',
      QUI: 'Quinta',
      SEX: 'Sexta',
      SÁB: 'Sábado',
      DOM: 'Domingo',
    };
    return map[shortName] || shortName;
  };

  return (
    <section className="flex flex-col gap-3.5 pt-2 border-t border-slate-200/80">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-2xs">
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Meu histórico de escalas
            </h2>
            <span className="text-[11px] text-slate-500">
              Consulte seus dias trabalhados e folgas anteriores
            </span>
          </div>
        </div>

        {/* Seletor rápido de colaborador para consulta individual */}
        <div className="flex items-center">
          <select
            value={selectedEmpId}
            onChange={e => setSelectedEmpId(e.target.value)}
            className="h-8 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {teamEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {formatNameAndSurname(emp.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Caixa de Navegação Semanal */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        {/* Controles de Navegação entre Semanas */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setHistoryWeekOffset(prev => prev - 1)}
            aria-label="Semana anterior"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all border border-slate-200/60"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">
                {weekHeader.monthTitle}
              </span>
              {historyWeekOffset === 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Atual
                </span>
              )}
              {isPublished ? (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Publicada
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                  Sem registro
                </span>
              )}
            </div>
            <span className="text-[11px] text-blue-700 font-semibold mt-0.5">
              {weekHeader.weekSubtitle}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {historyWeekOffset !== 0 && (
              <button
                onClick={() => setHistoryWeekOffset(0)}
                title="Voltar para a semana atual"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-50 active:scale-95 transition-all text-[11px] font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setHistoryWeekOffset(prev => prev + 1)}
              aria-label="Próxima semana"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all border border-slate-200/60"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumo do Período */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-emerald-800">
              {isPublished ? diasTrabalhados : 0}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">
              Trabalhados
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200/80 flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-slate-800">
              {isPublished ? diasFolga : 0}
            </span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
              Folgas
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-blue-900 truncate">
              {isPublished ? 'Homologada' : 'Pendente'}
            </span>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">
              Situação
            </span>
          </div>
        </div>

        {/* Tabela Semanal de Dias */}
        <div className="flex flex-col divide-y divide-slate-100 pt-1">
          {weekDays.map((day, idx) => {
            const status = empShifts ? empShifts[idx] : null;
            const isPastOrToday = day.fullDate <= todayStr;
            const isFuture = day.fullDate > todayStr;

            return (
              <div
                key={day.fullDate}
                className={`py-2 px-1 flex items-center justify-between transition-colors ${
                  day.isToday ? 'bg-blue-50/40 rounded-xl' : ''
                }`}
              >
                {/* Informação do Dia */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                      day.isToday
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {day.name}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {formatDayName(day.name)}, {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                          Hoje
                        </span>
                      )}
                      {day.isHoliday && (
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[9px] font-bold">
                          {day.holidayName}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">
                      {isPublished
                        ? status === 'T'
                          ? day.isHoliday
                            ? `Turno em Feriado (${day.holidayName})`
                            : `Turno: ${currentEmp?.workHours || '08:00 às 17:00'}`
                          : day.isHoliday
                          ? `Folga em Feriado (${day.holidayName})`
                          : 'Dia de descanso'
                        : 'Sem escala'}
                    </span>
                  </div>
                </div>

                {/* Indicador Visual do Status */}
                <div className="flex-shrink-0">
                  {!isPublished || !status ? (
                    /* Badge — (Sem registro ou sem escala publicada) */
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold">
                      <span className="text-sm leading-none font-bold">—</span>
                      <span>Sem registro</span>
                    </span>
                  ) : status === 'F' ? (
                    /* Badge ✕ Folga */
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                      <IconX className="w-3.5 h-3.5 text-slate-600" />
                      <span>Folga</span>
                    </span>
                  ) : isFuture ? (
                    /* Badge Programado (Dia futuro escalado) */
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Programado</span>
                    </span>
                  ) : (
                    /* Badge ✓ Trabalhou (Passado ou hoje) */
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Trabalhou</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda Informativa */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Trabalhou
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Folga
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Hoje
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-400 font-bold">—</span>
            Sem registro
          </span>
        </div>
      </div>
    </section>
  );
}
