'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Coffee,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  AlertCircle,
  Briefcase,
  Users,
  ArrowLeftRight,
} from 'lucide-react';
import { Employee, WeekSchedule, DayInfo, AuthUser, ShiftSwapRequest } from '../../types';
import { formatNameAndSurname, getEmployeeDayHours } from '../../lib/scheduleEngine';

interface FuncionarioDashboardProps {
  allEmployees: Employee[];
  schedule: WeekSchedule;
  days: DayInfo[];
  todayIndex: number;
  todayStr?: string;
  currentUser?: AuthUser | null;
  shiftSwaps?: ShiftSwapRequest[];
  onOpenSolicitarTroca?: () => void;
  onOpenMinhasTrocas?: () => void;
}

export function FuncionarioDashboard({
  allEmployees,
  schedule,
  days,
  todayIndex,
  todayStr,
  currentUser,
  shiftSwaps = [],
  onOpenSolicitarTroca,
  onOpenMinhasTrocas,
}: FuncionarioDashboardProps) {
  // Índice do dia em exibição (começa exatamente em todayIndex)
  const [viewingDayIdx, setViewingDayIdx] = useState<number>(todayIndex);

  const activeEmployees = allEmployees.filter(e => e.status === 'active');
  const isViewingToday = viewingDayIdx === todayIndex;
  const currentDayInfo = days[viewingDayIdx] || days[0];

  // Identifica o colaborador logado para destacar sua visão pessoal
  const loggedEmployee = allEmployees.find(
    e => e.id === currentUser?.id || e.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );
  const currentEmpId = loggedEmployee?.id || currentUser?.id;
  const pendingIncomingCount = shiftSwaps.filter(
    s => s.targetId === currentEmpId && s.status === 'pendente_colega'
  ).length;

  const myShiftStatus = loggedEmployee
    ? schedule.shifts[loggedEmployee.id]?.[viewingDayIdx] || 'T'
    : null;
  const isMyDayOff = myShiftStatus === 'F';

  // Regra de Isolamento: Colaborador visualiza somente as informações da própria equipe
  const userTeam = loggedEmployee?.team;
  const teamEmployees = allEmployees.filter(emp => {
    if (emp.status !== 'active') return false;
    if (currentUser?.role === 'colaborador' && userTeam) {
      return emp.team === userTeam;
    }
    return true;
  });

  // Identifica quem folga, trabalha ou está ausente no dia em exibição
  const offEmployees: Employee[] = [];
  const workingEmployees: Employee[] = [];
  const absentEmployees: Employee[] = [];

  teamEmployees.forEach(emp => {
    const empShifts = schedule.shifts[emp.id] || Array(7).fill('T');
    const status = empShifts[viewingDayIdx];
    if (status === 'F') {
      offEmployees.push(emp);
    } else if (status === 'AUSENTE' || status === 'FERIAS' || status === 'AFASTADO') {
      absentEmployees.push(emp);
    } else if (status === 'T') {
      workingEmployees.push(emp);
    }
  });

  // Próximo dia
  const handleNextDay = () => {
    setViewingDayIdx(prev => (prev + 1) % 7);
  };

  // Voltar para hoje
  const handleBackToToday = () => {
    setViewingDayIdx(todayIndex);
  };

  // Formata o nome completo do dia
  const formatDayTitle = (name: string) => {
    if (name === 'DOM') return 'Domingo';
    if (name === 'SÁB') return 'Sábado';
    return `${name}-feira`;
  };

  // Formata a data completa de forma determinística
  const formatFullDisplayDate = (day: DayInfo) => {
    if (!day || !day.fullDate) return '';
    const parts = day.fullDate.split('-').map(Number);
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const dayNumber = parts[2] || day.dayNumber;
    const monthName = months[(parts[1] || 1) - 1];
    return `${formatDayTitle(day.name)}, ${dayNumber} de ${monthName}`;
  };

  // Se a escala não estiver publicada
  if (!schedule.isPublished) {
    return (
      <div className="w-full p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-900">
          Nenhuma Escala Publicada
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          A escala deste período ainda não foi homologada pelo administrador. Assim que for publicada, os turnos e folgas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Aviso de Equipe quando não houver colaboradores */}
      {allEmployees.length === 0 && currentUser?.role === 'admin' && (
        <section className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border border-blue-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-slate-900">
                Nenhum colaborador cadastrado
              </h2>
              <span className="text-xs text-slate-600">
                Comece convidando os membros da equipe na aba <strong>Ajustes</strong> para organizar o planejamento e as folgas semanais.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Barra de Fuso e Troca de Escala */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Horários de Brasília (BRT)
              </span>
              <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                GMT-3
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Escala oficial padronizada pelo fuso horário de Brasília
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSolicitarTroca && (
            <button
              type="button"
              onClick={onOpenSolicitarTroca}
              className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Solicitar Troca de Escala</span>
            </button>
          )}

          {onOpenMinhasTrocas && (
            <button
              type="button"
              onClick={onOpenMinhasTrocas}
              className="h-9 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs relative"
            >
              <span>Minhas Trocas</span>
              {pendingIncomingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-black">
                  {pendingIncomingCount}
                </span>
              )}
            </button>
          )}
        </div>
      </section>

      {/* Alerta de Troca Pendente para o Colaborador */}
      {pendingIncomingCount > 0 && onOpenMinhasTrocas && (
        <section className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-bold">
              Você possui {pendingIncomingCount} solicitação{pendingIncomingCount > 1 ? 'ões' : ''} de troca de escala aguardando sua resposta.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenMinhasTrocas}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs flex-shrink-0 text-center"
          >
            Ver e Responder
          </button>
        </section>
      )}

      {/* Cabeçalho da Data em Exibição */}
      <section className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isViewingToday
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-200 text-slate-800'
            }`}
          >
            {isViewingToday ? 'Escala de Hoje' : 'Próxima Escala'}
          </span>

          {!isViewingToday && (
            <button
              onClick={handleBackToToday}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para hoje</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-0.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {formatFullDisplayDate(currentDayInfo)}
            </h1>
          </div>
          {currentDayInfo.isHoliday && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Feriado Nacional: {currentDayInfo.holidayName}</span>
            </div>
          )}
        </div>
      </section>

      {/* CARD DE MAIOR DESTAQUE: MINHA ESCALA ATUAL (VISÃO DO COLABORADOR LOGADO) */}
      {loggedEmployee && (
        <section className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {loggedEmployee.avatarUrl ? (
                <img
                  src={loggedEmployee.avatarUrl}
                  alt={loggedEmployee.name}
                  className="w-12 h-12 rounded-full object-cover shadow-xs border-2 border-white ring-2 ring-slate-100 flex-shrink-0"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-full ${loggedEmployee.colorBg} text-white flex items-center justify-center text-sm font-bold shadow-xs flex-shrink-0`}
                >
                  {loggedEmployee.initials}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Minha Escala Atual
                </span>
                <span className="text-base font-extrabold text-slate-900 leading-tight truncate">
                  {formatNameAndSurname(loggedEmployee.name)}
                </span>
                <span className="text-xs text-slate-500 truncate">
                  {loggedEmployee.role} • {loggedEmployee.team || 'Operações de Loja'}
                </span>
              </div>
            </div>

            <span
              className={`px-3 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wide border shadow-2xs flex-shrink-0 ${
                isMyDayOff
                  ? currentDayInfo.isHoliday
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                  : currentDayInfo.isHoliday
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {isMyDayOff
                ? currentDayInfo.isHoliday
                  ? 'Folga no Feriado'
                  : 'Dia de Folga'
                : currentDayInfo.isHoliday
                ? 'Trabalho em Feriado'
                : 'Trabalha Hoje'}
            </span>
          </div>

          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isMyDayOff
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : currentDayInfo.isHoliday
                ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock
                className={`w-4 h-4 flex-shrink-0 ${
                  isMyDayOff
                    ? 'text-slate-500'
                    : currentDayInfo.isHoliday
                    ? 'text-purple-700'
                    : 'text-emerald-700'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold">
                  {isMyDayOff
                    ? currentDayInfo.isHoliday
                      ? `Folga em Feriado Nacional: ${currentDayInfo.holidayName}`
                      : 'Descanso Semanal Remunerado'
                    : currentDayInfo.isHoliday
                    ? `Feriado (${currentDayInfo.holidayName}): ${getEmployeeDayHours(schedule, loggedEmployee, viewingDayIdx)}`
                    : `Horário de Expediente: ${getEmployeeDayHours(schedule, loggedEmployee, viewingDayIdx)}`}
                </span>
                <span className="text-[11px] opacity-75">
                  {isMyDayOff
                    ? currentDayInfo.isHoliday
                      ? 'Folga garantida por lei em feriado nacional'
                      : 'Aproveite seu dia de folga programado na escala de trabalho'
                    : currentDayInfo.isHoliday
                    ? 'Trabalho em feriado: direito a folga compensatória ou adicional de 100%'
                    : 'Turno regular com 1 hora de intervalo para refeição'}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GRID RESPONSIVO: 1 COLUNA NO CELULAR, 2 COLUNAS NO COMPUTADOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* SEÇÃO A: FOLGANDO HOJE (OU NO DIA EM EXIBIÇÃO) */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-red-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                {isViewingToday ? 'Folgando Hoje' : 'Folgando neste Dia'}
              </h2>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
              {offEmployees.length} {offEmployees.length === 1 ? 'colaborador' : 'colaboradores'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {offEmployees.map(emp => (
              <div
                key={emp.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between transition-all hover:border-slate-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Foto ou Iniciais */}
                  <div className="relative flex-shrink-0">
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-12 h-12 rounded-full object-cover shadow-xs border border-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-sm font-bold shadow-xs`}
                      >
                        {emp.initials}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full ring-2 ring-white" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {formatNameAndSurname(emp.name)}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {emp.role}
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex-shrink-0">
                  {currentDayInfo.isHoliday ? 'Folga no Feriado' : 'Folga'}
                </span>
              </div>
            ))}

            {offEmployees.length === 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                Nenhum colaborador de folga neste dia.
              </div>
            )}
          </div>
        </section>

        {/* SEÇÃO B: TRABALHANDO HOJE (OU NO DIA EM EXIBIÇÃO) */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                {isViewingToday ? 'Trabalhando Hoje' : 'Trabalhando neste Dia'}
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {workingEmployees.length} {workingEmployees.length === 1 ? 'colaborador' : 'colaboradores'}
            </span>
          </div>

          {currentDayInfo.isHoliday && workingEmployees.length > 0 && (
            <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs flex items-start gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold">
                  Operação em Feriado Nacional: {currentDayInfo.holidayName}
                </span>
                <span className="text-[11px] text-purple-800 leading-tight mt-0.5">
                  Os colaboradores escalados possuem direito a folga compensatória ou adicional de 100% conforme a legislação trabalhista.
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {workingEmployees.map(emp => (
              <div
                key={emp.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between transition-all hover:border-slate-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Foto ou Iniciais */}
                  <div className="relative flex-shrink-0">
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-12 h-12 rounded-full object-cover shadow-xs border border-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-sm font-bold shadow-xs`}
                      >
                        {emp.initials}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {formatNameAndSurname(emp.name)}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {emp.role}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                    currentDayInfo.isHoliday
                      ? 'bg-purple-50 text-purple-900 border-purple-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    <Clock className={`w-3 h-3 ${currentDayInfo.isHoliday ? 'text-purple-600' : 'text-emerald-600'}`} />
                    <span>{getEmployeeDayHours(schedule, emp, viewingDayIdx)}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {currentDayInfo.isHoliday ? 'Feriado • Horário de Brasília' : 'Horário de Brasília (GMT-3)'}
                  </span>
                </div>
              </div>
            ))}

            {workingEmployees.length === 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                Nenhum colaborador escalado para trabalhar neste dia.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* SEÇÃO C: AUSÊNCIAS JUSTIFICADAS (SE HOUVER) */}
      {absentEmployees.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Ausências Justificadas
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              {absentEmployees.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {absentEmployees.map(emp => (
              <div
                key={emp.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-xs font-bold`}
                      >
                        {emp.initials}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {formatNameAndSurname(emp.name)}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {emp.role}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                  Ausente
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BOTÃO PRINCIPAL: VER PRÓXIMA ESCALA */}
      <section className="pt-2">
        <button
          onClick={handleNextDay}
          className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <span>Ver próxima escala</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>
    </div>
  );
}
