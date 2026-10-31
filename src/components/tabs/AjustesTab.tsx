'use client';

import React from 'react';
import {
  Sliders,
  Calendar,
  Clock,
  Download,
  Database,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import { CompanySettings, Employee, WeekSchedule, DayInfo } from '../../types';

interface AjustesTabProps {
  settings: CompanySettings;
  schedule: WeekSchedule;
  employees: Employee[];
  days: DayInfo[];
  onUpdateSettings: (settings: CompanySettings) => void;
  onResetDemoData: () => void;
  onExportSchedule: () => void;
}

export function AjustesTab({
  settings,
  onUpdateSettings,
  onResetDemoData,
  onExportSchedule,
}: AjustesTabProps) {
  const handleMinStaffChange = (delta: number) => {
    const newVal = settings.minStaffPerDay + delta;
    if (newVal >= 1 && newVal <= 4) {
      onUpdateSettings({
        ...settings,
        minStaffPerDay: newVal,
      });
    }
  };

  const toggleRotateShifts = () => {
    onUpdateSettings({
      ...settings,
      rotateShifts: !settings.rotateShifts,
    });
  };

  const toggleRotateSundays = () => {
    onUpdateSettings({
      ...settings,
      rotateSundays: !settings.rotateSundays,
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header Contextual */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Painel de Ajustes
          </h1>
          <p className="text-xs text-slate-500">
            Regras de conformidade 5x2 e exportação de dados
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          Operação Ativa
        </span>
      </div>

      {/* Seção 1: Regras da Escala */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Parâmetros da Escala 5x2
          </h2>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-4">
          {/* Regime de Trabalho */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">
                Regime de Trabalho
              </span>
              <span className="text-[11px] text-slate-500">
                5 dias de trabalho para 2 de folga
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
              5x2 CLT
            </span>
          </div>

          {/* Dias de Funcionamento */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">
                Dias de Funcionamento
              </span>
              <span className="text-[11px] text-slate-500">
                Atendimento ininterrupto da filial
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-700">
              7 dias por semana
            </span>
          </div>

          {/* Mínimo de Colaboradores com Stepper */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">
                Mínimo por Dia
              </span>
              <span className="text-[11px] text-slate-500">
                Contingente mínimo de segurança
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleMinStaffChange(-1)}
                disabled={settings.minStaffPerDay <= 1}
                className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 disabled:opacity-40 active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-extrabold text-blue-700">
                {settings.minStaffPerDay}
              </span>
              <button
                type="button"
                onClick={() => handleMinStaffChange(1)}
                disabled={settings.minStaffPerDay >= 4}
                className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 disabled:opacity-40 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Switch 1: Rodízio de Folgas */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">
                Rodízio Semanal de Folgas
              </span>
              <span className="text-[11px] text-slate-500">
                Alternar os dias de descanso a cada semana
              </span>
            </div>

            <button
              type="button"
              onClick={toggleRotateShifts}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.rotateShifts ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  settings.rotateShifts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Switch 2: Rodízio de Domingos */}
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">
                Garantia de Domingos Livres
              </span>
              <span className="text-[11px] text-slate-500">
                Priorizar alternância de domingos entre colaboradores
              </span>
            </div>

            <button
              type="button"
              onClick={toggleRotateSundays}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.rotateSundays ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  settings.rotateSundays ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Seção 2: Exportação e Backup */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Database className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Relatórios e Backup
          </h2>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-3">
          <button
            onClick={onExportSchedule}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Escala em Excel / CSV</span>
          </button>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-slate-700">
                Armazenamento local sincronizado
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Ativo
            </span>
          </div>

          <button
            onClick={onResetDemoData}
            className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restaurar Escala de Demonstração</span>
          </button>
        </div>
      </section>
    </div>
  );
}
