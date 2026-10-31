'use client';

import React, { useState, useEffect } from 'react';
import { ActiveTab, Employee, ShiftStatus, WeekSchedule, CompanySettings } from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_SETTINGS,
  INITIAL_WEEK_SCHEDULE,
  getWeekDays,
  calculateDailyCoverage,
} from '../lib/scheduleEngine';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { InicioTab } from '../components/tabs/InicioTab';
import { EscalaTab } from '../components/tabs/EscalaTab';
import { EquipeTab } from '../components/tabs/EquipeTab';
import { AjustesTab } from '../components/tabs/AjustesTab';
import { Toast, ToastMessage } from '../components/Toast';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [settings, setSettings] = useState<CompanySettings>(INITIAL_SETTINGS);
  const [schedule, setSchedule] = useState<WeekSchedule>(INITIAL_WEEK_SCHEDULE);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [todayStr, setTodayStr] = useState<string>('2026-10-29');

  // Calcula a data base da semana de forma deterministica
  const baseDate = new Date(2026, 9, 26 + weekOffset * 7);
  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const dd = String(baseDate.getDate()).padStart(2, '0');
  const startDateStr = `${yyyy}-${mm}-${dd}`;
  const days = getWeekDays(startDateStr, todayStr);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToast({ id, type, text });
    setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr));
    }, 3200);
  };

  // Carrega dados salvos do localStorage no cliente
  useEffect(() => {
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      setTodayStr(`${y}-${m}-${d}`);

      const savedEmployees = localStorage.getItem('iloc_employees');
      if (savedEmployees) setEmployees(JSON.parse(savedEmployees));

      const savedSettings = localStorage.getItem('iloc_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedSchedule = localStorage.getItem('iloc_schedule');
      if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    } catch {
      // Usa dados padrao
    }
  }, []);

  // Salva no localStorage quando os dados principais mudarem
  const persistEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    try {
      localStorage.setItem('iloc_employees', JSON.stringify(newEmployees));
    } catch {}
  };

  const persistSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('iloc_settings', JSON.stringify(newSettings));
    } catch {}
  };

  const persistSchedule = (newSchedule: WeekSchedule) => {
    setSchedule(newSchedule);
    try {
      localStorage.setItem('iloc_schedule', JSON.stringify(newSchedule));
    } catch {}
  };

  // Manipuladores de Escala
  const handleUpdateShift = (employeeId: string, dayIndex: number, newStatus: ShiftStatus) => {
    const currentEmpShifts = schedule.shifts[employeeId] || Array(7).fill('T');
    const updatedEmpShifts = [...currentEmpShifts];
    updatedEmpShifts[dayIndex] = newStatus;

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: {
        ...schedule.shifts,
        [employeeId]: updatedEmpShifts,
      },
    };

    persistSchedule(updatedSchedule);
  };

  const handleSetShifts = (newShifts: Record<string, ShiftStatus[]>) => {
    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: newShifts,
    };
    persistSchedule(updatedSchedule);
    showToast('Escala gerada automaticamente em conformidade 5x2.', 'success');
  };

  const handleSaveSchedule = () => {
    persistSchedule(schedule);
    showToast(`Rascunho da Semana ${schedule.weekNumber} salvo com sucesso.`, 'success');
  };

  const handlePublishSchedule = () => {
    const activeEmps = employees.filter(e => e.status === 'active');
    const coverage = calculateDailyCoverage(schedule.shifts, activeEmps, settings.minStaffPerDay);
    const belowMinDays = coverage.filter(c => c.isBelowMinimum);

    if (belowMinDays.length > 0) {
      const names = belowMinDays.map(d => d.dayName).join(', ');
      showToast(`Atenção: Os dias ${names} estão abaixo do mínimo de ${settings.minStaffPerDay} pessoas.`, 'warning');
      return;
    }

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      isPublished: true,
    };
    persistSchedule(updatedSchedule);
    showToast(`Escala da Semana ${schedule.weekNumber} publicada como oficial.`, 'success');
  };

  // Manipuladores de Colaboradores
  const handleAddEmployee = (data: Omit<Employee, 'id'>) => {
    const newId = `emp_${Date.now()}`;
    const newEmp: Employee = {
      ...data,
      id: newId,
    };
    const updatedEmployees = [...employees, newEmp];
    persistEmployees(updatedEmployees);

    // Inicializa turnos padrão
    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: {
        ...schedule.shifts,
        [newId]: ['T', 'T', 'T', 'T', 'T', 'F', 'F'],
      },
    };
    persistSchedule(updatedSchedule);
    showToast(`Colaborador ${newEmp.name.split(' ')[0]} cadastrado com sucesso.`, 'success');
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const updated = employees.map(e => (e.id === updatedEmp.id ? updatedEmp : e));
    persistEmployees(updated);
    showToast(`Dados de ${updatedEmp.name.split(' ')[0]} atualizados.`, 'success');
  };

  const handleToggleEmployeeStatus = (id: string) => {
    const updated = employees.map(e => {
      if (e.id === id) {
        const nextStatus = e.status === 'active' ? 'inactive' : 'active';
        return { ...e, status: nextStatus as 'active' | 'inactive' };
      }
      return e;
    });
    persistEmployees(updated);
    const emp = employees.find(e => e.id === id);
    const statusLabel = emp?.status === 'active' ? 'inativado' : 'reativado';
    showToast(`Colaborador ${emp?.name.split(' ')[0]} ${statusLabel}.`, 'info');
  };

  // Exportação CSV
  const handleExportSchedule = () => {
    const headers = ['Colaborador', 'Cargo', ...days.map(d => `${d.name} (${d.formattedDate})`)];
    const rows = employees
      .filter(e => e.status === 'active')
      .map(emp => {
        const empShifts = schedule.shifts[emp.id] || Array(7).fill('T');
        const shiftTexts = empShifts.map(s => (s === 'T' ? 'Trabalho' : 'Folga'));
        return [emp.name, emp.role, ...shiftTexts];
      });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `escala_iloc_semana_${schedule.weekNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Planilha da escala exportada com sucesso.', 'success');
  };

  // Restaurar dados padrão de demonstração
  const handleResetDemoData = () => {
    persistEmployees(INITIAL_EMPLOYEES);
    persistSettings(INITIAL_SETTINGS);
    persistSchedule(INITIAL_WEEK_SCHEDULE);
    setWeekOffset(0);
    showToast('Dados de demonstração restaurados com sucesso.', 'info');
  };

  const tabTitles: Record<ActiveTab, string> = {
    inicio: 'Início',
    escala: 'Escala',
    equipe: 'Equipe',
    ajustes: 'Ajustes',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8FF]">
      <Header currentTabTitle={tabTitles[activeTab]} />

      <main className="flex-1 w-full max-w-lg mx-auto pt-20 pb-24 px-4">
        {activeTab === 'inicio' && (
          <InicioTab
            employees={employees}
            schedule={schedule}
            settings={settings}
            days={days}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'escala' && (
          <EscalaTab
            employees={employees}
            schedule={schedule}
            settings={settings}
            days={days}
            weekOffset={weekOffset}
            onChangeWeekOffset={delta => setWeekOffset(prev => prev + delta)}
            onResetWeekOffset={() => setWeekOffset(0)}
            onUpdateShift={handleUpdateShift}
            onSetShifts={handleSetShifts}
            onSaveSchedule={handleSaveSchedule}
            onPublishSchedule={handlePublishSchedule}
          />
        )}

        {activeTab === 'equipe' && (
          <EquipeTab
            employees={employees}
            shifts={schedule.shifts}
            days={days}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onToggleEmployeeStatus={handleToggleEmployeeStatus}
          />
        )}

        {activeTab === 'ajustes' && (
          <AjustesTab
            settings={settings}
            schedule={schedule}
            employees={employees}
            days={days}
            onUpdateSettings={persistSettings}
            onResetDemoData={handleResetDemoData}
            onExportSchedule={handleExportSchedule}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      <Toast toast={toast} />
    </div>
  );
}
