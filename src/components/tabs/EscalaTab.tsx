'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Save,
  Send,
  CalendarDays,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { Employee, ShiftStatus, WeekSchedule, CompanySettings, DayInfo } from '../../types';
import {
  calculateDailyCoverage,
  calculateEmployeeSummary,
  generateAutomaticSchedule,
} from '../../lib/scheduleEngine';

interface EscalaTabProps {
  employees: Employee[];
  schedule: WeekSchedule;
  settings: CompanySettings;
  days: DayInfo[];
  weekOffset: number;
  onChangeWeekOffset: (delta: number) => void;
  onResetWeekOffset: () => void;
  onUpdateShift: (employeeId: string, dayIndex: number, newStatus: ShiftStatus) => void;
  onSetShifts: (shifts: Record<string, ShiftStatus[]>) => void;
  onSaveSchedule: () => void;
  onPublishSchedule: () => void;
}

export function EscalaTab({
  employees,
  schedule,
  settings,
  days,
  weekOffset,
  onChangeWeekOffset,
  onResetWeekOffset,
  onUpdateShift,
  onSetShifts,
  onSaveSchedule,
  onPublishSchedule,
}: EscalaTabProps) {
  const activeEmployees = employees.filter(e => e.status === 'active');
  const coverageList = calculateDailyCoverage(schedule.shifts, activeEmployees, settings.minStaffPerDay);
  const hasAlert = coverageList.some(c => c.isBelowMinimum);

  const handleAutoGenerate = () => {
    const autoShifts = generateAutomaticSchedule(employees, weekOffset);
    onSetShifts(autoShifts);
  };

  const handleToggleShift = (employeeId: string, dayIndex: number) => {
    const empShifts = schedule.shifts[employeeId] || Array(7).fill('T');
    const currentStatus = empShifts[dayIndex] || 'T';
    const nextStatus: ShiftStatus = currentStatus === 'T' ? 'F' : 'T';
    onUpdateShift(employeeId, dayIndex, nextStatus);
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header Contextual */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Administrar Escala
          </h1>
          <p className="text-xs text-slate-500">
            Regime 5x2 • Mínimo {settings.minStaffPerDay} por dia
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Modo Gestor</span>
        </div>
      </div>

      {/* Seletor de Semana e Botão de Geração Automática */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onChangeWeekOffset(-1)}
            aria-label="Semana anterior"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-900">
                Semana {schedule.weekNumber}
              </span>
              {schedule.isPublished && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Publicada
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 mt-0.5">
              {days[0]?.formattedDate} a {days[6]?.formattedDate}
            </span>
          </div>

          <button
            onClick={() => onChangeWeekOffset(1)}
            aria-label="Próxima semana"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {weekOffset !== 0 && (
            <button
              onClick={onResetWeekOffset}
              className="px-3 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hoje</span>
            </button>
          )}

          <button
            onClick={handleAutoGenerate}
            className="flex-1 h-10 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 active:scale-[0.99] text-blue-700 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Gerar Escala Automática 5x2</span>
          </button>
        </div>
      </div>

      {/* Painel de Cobertura Diária (Termômetro) */}
      <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Cobertura Diária da Semana
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Mínimo: {settings.minStaffPerDay} / dia
          </span>
        </div>

        {/* 7 Dias Termômetro */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {coverageList.map(c => {
            const isAlert = c.isBelowMinimum;
            return (
              <div
                key={c.dayIndex}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                  isAlert
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-slate-50 border border-slate-100'
                }`}
              >
                <span
                  className={`text-[10px] font-bold ${
                    isAlert ? 'text-red-700' : 'text-slate-500'
                  }`}
                >
                  {c.dayName}
                </span>
                <span
                  className={`text-base font-extrabold my-0.5 ${
                    isAlert ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {c.workingCount}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase ${
                    isAlert ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {isAlert ? 'Alerta' : 'OK'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Banner Dinâmico de Alerta */}
        {hasAlert && (
          <div className="mt-1 flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">
              Equipe insuficiente em um ou mais dias. Toque nos botões abaixo para alternar folgas e atingir o mínimo de {settings.minStaffPerDay} pessoas.
            </p>
          </div>
        )}
      </div>

      {/* Grade Interativa dos Colaboradores */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Escala por Colaborador
          </h2>
          <span className="text-[11px] text-slate-500">
            Toque no dia para alternar (T / F)
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {activeEmployees.map(emp => {
            const empShifts = schedule.shifts[emp.id] || Array(7).fill('T');
            const summary = calculateEmployeeSummary(empShifts);

            return (
              <div
                key={emp.id}
                className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-2.5"
              >
                {/* Linha do Colaborador e Resumo 5x2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
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

                  <div
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                      summary.isCompliant
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span>
                      {summary.workCount} Trab • {summary.offCount} Folgas
                    </span>
                  </div>
                </div>

                {/* 7 Botões de Dias Clicáveis */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => {
                    const status = empShifts[idx] || 'T';
                    const isWork = status === 'T';

                    return (
                      <button
                        key={idx}
                        onClick={() => handleToggleShift(emp.id, idx)}
                        type="button"
                        className={`h-11 rounded-xl font-bold flex flex-col items-center justify-center transition-all active:scale-90 shadow-xs ${
                          isWork
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        <span className="text-[10px] opacity-90 leading-none">
                          {day.name}
                        </span>
                        <span className="text-xs leading-tight mt-0.5">
                          {status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ações da Escala */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          onClick={onPublishSchedule}
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Publicar Escala Oficial</span>
        </button>

        <button
          onClick={onSaveSchedule}
          className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.99] text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <Save className="w-4 h-4 text-slate-500" />
          <span>Salvar Rascunho</span>
        </button>
      </div>
    </div>
  );
}
