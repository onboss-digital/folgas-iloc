'use client';

import React from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  ArrowRight,
  Clock,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { Employee, WeekSchedule, CompanySettings, DayInfo, ActiveTab } from '../../types';
import { calculateDailyCoverage } from '../../lib/scheduleEngine';

interface InicioTabProps {
  employees: Employee[];
  schedule: WeekSchedule;
  settings: CompanySettings;
  days: DayInfo[];
  onNavigateTab: (tab: ActiveTab) => void;
}

export function InicioTab({
  employees,
  schedule,
  settings,
  days,
  onNavigateTab,
}: InicioTabProps) {
  // Encontra o dia atual (ou o primeiro dia por padrão)
  const todayIndex = days.findIndex(d => d.isToday) !== -1 ? days.findIndex(d => d.isToday) : 3; // quinta-feira default
  const todayInfo = days[todayIndex] || days[0];

  const activeEmployees = employees.filter(e => e.status === 'active');
  const coverageList = calculateDailyCoverage(schedule.shifts, activeEmployees, settings.minStaffPerDay);

  // Colaboradores trabalhando vs folga hoje
  const workingToday: Employee[] = [];
  const offToday: Employee[] = [];

  activeEmployees.forEach(emp => {
    const empShifts = schedule.shifts[emp.id];
    const status = empShifts ? empShifts[todayIndex] : 'T';
    if (status === 'T') {
      workingToday.push(emp);
    } else {
      offToday.push(emp);
    }
  });

  // Dias com alertas na semana
  const alertDays = coverageList.filter(c => c.isBelowMinimum);

  // Colaboradores de folga no fim de semana
  const weekendOffSaturday: Employee[] = [];
  const weekendOffSunday: Employee[] = [];
  activeEmployees.forEach(emp => {
    const empShifts = schedule.shifts[emp.id];
    if (empShifts) {
      if (empShifts[5] === 'F') weekendOffSaturday.push(emp);
      if (empShifts[6] === 'F') weekendOffSunday.push(emp);
    }
  });

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Saudação e Contexto Operacional */}
      <section className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Painel da Operação
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {todayInfo.name}, {todayInfo.dayNumber} de Outubro de 2026
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Regime 5x2 Ativo</span>
        </div>
      </section>

      {/* Alerta Geral da Semana se houver */}
      {alertDays.length > 0 && (
        <section className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col flex-1">
            <span className="text-xs font-bold text-amber-900">
              Atenção: Contingente abaixo do mínimo em {alertDays.length} {alertDays.length === 1 ? 'dia' : 'dias'}
            </span>
            <p className="text-xs text-amber-800 mt-0.5 leading-snug">
              Os dias {alertDays.map(d => d.dayName).join(', ')} estão com menos de {settings.minStaffPerDay} colaboradores escalados.
            </p>
            <button
              onClick={() => onNavigateTab('escala')}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              <span>Ajustar escala agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* Hero Card: Resumo de Hoje */}
      <section className="w-full rounded-2xl bg-white p-4 border border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Presença de Hoje
            </h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
              workingToday.length >= settings.minStaffPerDay
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {workingToday.length >= settings.minStaffPerDay ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Mínimo seguro atingido</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span>Abaixo do mínimo</span>
              </>
            )}
          </span>
        </div>

        {/* Indicadores em Cards Rápidos */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
            <span className="text-[11px] font-medium text-slate-500 uppercase">
              Equipe Ativa
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5">
              0{activeEmployees.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center">
            <span className="text-[11px] font-medium text-emerald-700 uppercase">
              Trabalhando
            </span>
            <span className="text-xl font-bold text-emerald-700 mt-0.5">
              0{workingToday.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center text-center">
            <span className="text-[11px] font-medium text-red-700 uppercase">
              De Folga
            </span>
            <span className="text-xl font-bold text-red-700 mt-0.5">
              0{offToday.length}
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('escala')}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <span>Abrir Grade Semanal da Escala</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Lista: Quem está trabalhando hoje */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Trabalhando Hoje ({workingToday.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">08:00 às 17:00</span>
        </div>

        <div className="flex flex-col gap-2">
          {workingToday.map(emp => (
            <div
              key={emp.id}
              className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs`}
                >
                  {emp.initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {emp.name}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate">
                    {emp.role}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex-shrink-0">
                Ativo
              </span>
            </div>
          ))}

          {workingToday.length === 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
              Nenhum colaborador escalado para hoje.
            </div>
          )}
        </div>
      </section>

      {/* Lista: Quem está de folga hoje */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Coffee className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              De Folga Hoje ({offToday.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Descanso 5x2</span>
        </div>

        <div className="flex flex-col gap-2">
          {offToday.map(emp => (
            <div
              key={emp.id}
              className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between opacity-95"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
                  {emp.initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {emp.name}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate">
                    {emp.role}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-semibold flex-shrink-0">
                Folga
              </span>
            </div>
          ))}

          {offToday.length === 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
              Todos os colaboradores estão escalados para trabalhar hoje.
            </div>
          )}
        </div>
      </section>

      {/* Card de Próximas Folgas no Fim de Semana */}
      <section className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Folgas do Fim de Semana
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-blue-600">
            Semana {schedule.weekNumber}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase">
              Sábado
            </span>
            <span className="text-xs font-semibold text-slate-900">
              {weekendOffSaturday.length > 0
                ? weekendOffSaturday.map(e => e.name.split(' ')[0]).join(', ')
                : 'Nenhum'}
            </span>
            <span className="text-[10px] text-slate-500">
              {weekendOffSaturday.length} de folga
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
            <span className="text-[11px] font-bold text-red-700 uppercase">
              Domingo
            </span>
            <span className="text-xs font-semibold text-slate-900">
              {weekendOffSunday.length > 0
                ? weekendOffSunday.map(e => e.name.split(' ')[0]).join(', ')
                : 'Nenhum'}
            </span>
            <span className="text-[10px] text-slate-500">
              {weekendOffSunday.length} de folga
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
