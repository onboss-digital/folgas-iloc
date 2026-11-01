'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Sparkles,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
  X,
  AlertCircle,
  Save,
  Send,
  SlidersHorizontal,
  UserPlus,
  Trash2,
  PlusCircle,
  CalendarPlus,
  Share2,
} from 'lucide-react';
import {
  Employee,
  WeekSchedule,
  ShiftStatus,
  DayInfo,
  CompanySettings,
  AuthUser,
} from '../../types';
import {
  formatNameAndSurname,
  getEmployeeDayHours,
  calculateEmployeeSummary,
  calculateDailyCoverage,
  generateAutomaticSchedule,
} from '../../lib/scheduleEngine';

interface GerenciarEscalasTabProps {
  employees: Employee[];
  schedule: WeekSchedule;
  settings: CompanySettings;
  days: DayInfo[];
  weekOffset: number;
  onChangeWeekOffset: (delta: number) => void;
  onResetWeekOffset: () => void;
  onSaveDraft: (schedule: WeekSchedule) => void;
  onPublishSchedule: (schedule: WeekSchedule) => void;
  onCopyPreviousWeek: () => void;
  currentUser?: AuthUser | null;
  onPreviewAsColaborador?: () => void;
  onAddEmployee?: (employee: Omit<Employee, 'id'>) => void;
  onUpdateEmployee?: (employee: Employee) => void;
  onDeleteEmployee?: (id: string) => void;
  isScheduleCreated?: boolean;
  onCreateSchedule?: () => void;
  onNavigateToAjustes?: () => void;
}

interface QuickDayEditor {
  employeeId: string;
  dayIndex: number;
  status: ShiftStatus;
  entryTime: string;
  exitTime: string;
  applyToAllWorkDays?: boolean;
}

const COMMON_SHIFTS = [
  { label: '08h às 17h', entry: '08:00', exit: '17:00' },
  { label: '09h às 18h', entry: '09:00', exit: '18:00' },
  { label: '10h às 19h', entry: '10:00', exit: '19:00' },
  { label: '12h às 21h', entry: '12:00', exit: '21:00' },
  { label: '07h às 16h', entry: '07:00', exit: '16:00' },
];

export function getWeekDisplayHeader(days: DayInfo[]) {
  if (!days || days.length < 7) {
    return {
      monthTitle: 'Mês Atual',
      weekSubtitle: 'Semana de Planejamento',
      periodText: '',
    };
  }

  const startDay = days[0];
  const endDay = days[6];

  const startParts = startDay.fullDate.split('-').map(Number);
  const endParts = endDay.fullDate.split('-').map(Number);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const startMonth = months[startParts[1] - 1];
  const endMonth = months[endParts[1] - 1];
  const year = endParts[0];

  let monthTitle = '';
  if (startParts[1] === endParts[1]) {
    monthTitle = `${endMonth} de ${year}`;
  } else {
    monthTitle = `${startMonth} / ${endMonth} de ${year}`;
  }

  // Identifica a semana do mês
  const endDayNum = endParts[2];
  const weekOrdinal = Math.ceil(endDayNum / 7);
  const ordinalNames = ['1ª', '2ª', '3ª', '4ª', '5ª'];
  const ordinalText = ordinalNames[weekOrdinal - 1] || `${weekOrdinal}ª`;

  const weekSubtitle = `${ordinalText} semana (${startDay.formattedDate} a ${endDay.formattedDate})`;

  return {
    monthTitle,
    weekSubtitle,
    periodText: `${startDay.formattedDate} a ${endDay.formattedDate}`,
  };
}

export function GerenciarEscalasTab({
  employees,
  schedule,
  settings,
  days,
  weekOffset,
  onChangeWeekOffset,
  onResetWeekOffset,
  onSaveDraft,
  onPublishSchedule,
  onCopyPreviousWeek,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  isScheduleCreated,
  onCreateSchedule,
  onNavigateToAjustes,
}: GerenciarEscalasTabProps) {
  // Informações formatadas do mês e semana
  const weekHeader = getWeekDisplayHeader(days);

  // Equipes distintas
  const distinctTeams = Array.from(
    new Set(employees.map(e => e.team).filter(Boolean))
  ) as string[];

  // Filtro por equipe ou 'Todas'
  const [selectedTeam, setSelectedTeam] = useState<string>('todas');

  // Colaboradores ativos filtrados
  const filteredEmployees = employees.filter(emp => {
    if (emp.status !== 'active') return false;
    if (selectedTeam === 'todas') return true;
    return emp.team === selectedTeam;
  });

  // Editor rápido da célula do dia
  const [quickEditor, setQuickEditor] = useState<QuickDayEditor | null>(null);

  // Editor da semana inteira do colaborador
  const [editingEmployeeWeek, setEditingEmployeeWeek] = useState<Employee | null>(null);
  const [weekEditorShifts, setWeekEditorShifts] = useState<ShiftStatus[]>([]);
  const [weekEditorCustomHours, setWeekEditorCustomHours] = useState<(string | undefined)[]>([]);

  // Modal de conferência pré-publicação
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);

  // Estados do Modal de Cadastro / Edição de Colaborador
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployeeData, setEditingEmployeeData] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empTeam, setEmpTeam] = useState('Operações de Loja');
  const [empStartTime, setEmpStartTime] = useState('08:00');
  const [empEndTime, setEmpEndTime] = useState('17:00');

  // Confirmação de exclusão de colaborador
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Feriados na semana
  const weekHolidays = days.filter(d => d.isHoliday);

  // Cálculo da cobertura
  const dailyCoverage = calculateDailyCoverage(
    schedule.shifts,
    filteredEmployees,
    settings.minStaffPerDay
  );

  // Dias com cobertura abaixo do mínimo
  const belowCoverageDays = dailyCoverage.filter(c => c.isBelowMinimum);

  // Abertura do modal de adicionar colaborador
  const handleOpenAddEmployee = () => {
    setEditingEmployeeData(null);
    setEmpName('');
    setEmpRole('');
    setEmpTeam(selectedTeam !== 'todas' ? selectedTeam : 'Operações de Loja');
    setEmpStartTime('08:00');
    setEmpEndTime('17:00');
    setIsEmployeeModalOpen(true);
  };

  // Abertura do modal de editar dados cadastrais do colaborador
  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployeeData(emp);
    setEmpName(formatNameAndSurname(emp.name));
    setEmpRole(emp.role);
    setEmpTeam(emp.team || 'Operações de Loja');

    let start = '08:00';
    let end = '17:00';
    const sourceHours = emp.workHours || '08:00 às 17:00';
    if (sourceHours.includes('às')) {
      const parts = sourceHours.split('às').map(p => p.trim());
      if (parts[0]) start = parts[0];
      if (parts[1]) end = parts[1];
    }
    setEmpStartTime(start);
    setEmpEndTime(end);
    setIsEmployeeModalOpen(true);
  };

  // Salvar cadastro ou edição de colaborador
  const handleSaveEmployeeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empRole.trim()) return;

    const workHoursFormatted = `${empStartTime} às ${empEndTime}`;
    const cleanName = formatNameAndSurname(empName.trim());
    const cleanRole = empRole.trim();
    const cleanTeam = empTeam.trim() || 'Operações de Loja';

    if (editingEmployeeData) {
      if (onUpdateEmployee) {
        onUpdateEmployee({
          ...editingEmployeeData,
          name: cleanName,
          role: cleanRole,
          team: cleanTeam,
          workHours: workHoursFormatted,
        });
      }
    } else {
      if (onAddEmployee) {
        const initials = cleanName
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-indigo-600'];
        const colorBg = colors[employees.length % colors.length];

        onAddEmployee({
          name: cleanName,
          role: cleanRole,
          team: cleanTeam,
          workHours: workHoursFormatted,
          status: 'active',
          initials,
          colorBg,
          admissionDate: new Date().toISOString().split('T')[0],
          preferredDaysOff: [5, 6],
        });
      }
    }

    setIsEmployeeModalOpen(false);
  };

  // Abertura do editor rápido de dia
  const handleOpenQuickEditor = (emp: Employee, dayIdx: number) => {
    const currentStatus: ShiftStatus =
      schedule.shifts[emp.id]?.[dayIdx] || 'T';

    const currentCustom = schedule.customHours?.[emp.id]?.[dayIdx];
    let entry = '08:00';
    let exit = '17:00';

    const sourceHours = currentCustom || emp.workHours || '08:00 às 17:00';
    if (sourceHours.includes('às')) {
      const parts = sourceHours.split('às').map(p => p.trim());
      if (parts[0]) entry = parts[0];
      if (parts[1]) exit = parts[1];
    }

    setQuickEditor({
      employeeId: emp.id,
      dayIndex: dayIdx,
      status: currentStatus,
      entryTime: entry,
      exitTime: exit,
    });
  };

  // Aplicação da alteração rápida
  const handleSaveQuickEditor = (
    newStatus: ShiftStatus,
    entry?: string,
    exit?: string,
    applyToAll?: boolean
  ) => {
    if (!quickEditor) return;

    const { employeeId, dayIndex } = quickEditor;
    const finalEntry = entry || quickEditor.entryTime;
    const finalExit = exit || quickEditor.exitTime;
    const hoursFormatted = `${finalEntry} às ${finalExit}`;

    const currentShifts = [
      ...(schedule.shifts[employeeId] || Array(7).fill('T')),
    ];
    currentShifts[dayIndex] = newStatus;

    const currentCustom = [
      ...(schedule.customHours?.[employeeId] || Array(7).fill(undefined)),
    ];

    if (newStatus === 'T') {
      currentCustom[dayIndex] = hoursFormatted;
    } else {
      currentCustom[dayIndex] = undefined;
    }

    const shouldApplyAll = applyToAll !== undefined ? applyToAll : quickEditor.applyToAllWorkDays;
    if (shouldApplyAll && newStatus === 'T') {
      for (let i = 0; i < 7; i++) {
        if (currentShifts[i] === 'T') {
          currentCustom[i] = hoursFormatted;
        }
      }
    }

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: {
        ...schedule.shifts,
        [employeeId]: currentShifts,
      },
      customHours: {
        ...(schedule.customHours || {}),
        [employeeId]: currentCustom,
      },
    };

    onSaveDraft(updatedSchedule);
    setQuickEditor(null);
  };

  // Alternância rápida direta (Trabalho <-> Folga)
  const handleQuickToggleShift = (e: React.MouseEvent, emp: Employee, dayIdx: number) => {
    e.stopPropagation();
    const currentStatus = schedule.shifts[emp.id]?.[dayIdx] || 'T';
    const nextStatus: ShiftStatus = currentStatus === 'T' ? 'F' : 'T';

    const currentShifts = [
      ...(schedule.shifts[emp.id] || Array(7).fill('T')),
    ];
    currentShifts[dayIdx] = nextStatus;

    const currentCustom = [
      ...(schedule.customHours?.[emp.id] || Array(7).fill(undefined)),
    ];
    if (nextStatus === 'T') {
      currentCustom[dayIdx] = emp.workHours || '08:00 às 17:00';
    } else {
      currentCustom[dayIdx] = undefined;
    }

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: {
        ...schedule.shifts,
        [emp.id]: currentShifts,
      },
      customHours: {
        ...(schedule.customHours || {}),
        [emp.id]: currentCustom,
      },
    };

    onSaveDraft(updatedSchedule);
  };

  // Copiar programação de um dia para o próximo
  const handleCopyDayToNext = (sourceDayIdx: number) => {
    if (sourceDayIdx >= 6) return;
    const targetDayIdx = sourceDayIdx + 1;

    const updatedShifts = { ...schedule.shifts };
    const updatedCustom = { ...(schedule.customHours || {}) };

    filteredEmployees.forEach(emp => {
      const empShifts = [...(updatedShifts[emp.id] || Array(7).fill('T'))];
      const empCustom = [...(updatedCustom[emp.id] || Array(7).fill(undefined))];

      empShifts[targetDayIdx] = empShifts[sourceDayIdx];
      empCustom[targetDayIdx] = empCustom[sourceDayIdx];

      updatedShifts[emp.id] = empShifts;
      updatedCustom[emp.id] = empCustom;
    });

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: updatedShifts,
      customHours: updatedCustom,
    };

    onSaveDraft(updatedSchedule);
  };

  // Abertura do editor semanal completo do colaborador
  const handleOpenEmployeeWeekEditor = (emp: Employee) => {
    const currentShifts = [
      ...(schedule.shifts[emp.id] || Array(7).fill('T')),
    ];
    const currentCustom = [
      ...(schedule.customHours?.[emp.id] || Array(7).fill(undefined)),
    ];

    setEditingEmployeeWeek(emp);
    setWeekEditorShifts(currentShifts);
    setWeekEditorCustomHours(currentCustom);
  };

  // Salvar alterações da semana do colaborador
  const handleSaveEmployeeWeek = () => {
    if (!editingEmployeeWeek) return;

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: {
        ...schedule.shifts,
        [editingEmployeeWeek.id]: weekEditorShifts,
      },
      customHours: {
        ...(schedule.customHours || {}),
        [editingEmployeeWeek.id]: weekEditorCustomHours,
      },
    };

    onSaveDraft(updatedSchedule);
    setEditingEmployeeWeek(null);
  };

  // Aplicar atalhos 5x2 ou 6x1 na semana do colaborador
  const handleApplyPresetToWeek = (preset: '5x2_sab_dom' | '5x2_dom_seg' | '6x1_dom') => {
    if (!editingEmployeeWeek) return;
    const habitual = editingEmployeeWeek.workHours || '08:00 às 17:00';

    let newShifts: ShiftStatus[] = Array(7).fill('T');
    let newHours: (string | undefined)[] = Array(7).fill(habitual);

    if (preset === '5x2_sab_dom') {
      newShifts[5] = 'F';
      newShifts[6] = 'F';
      newHours[5] = undefined;
      newHours[6] = undefined;
    } else if (preset === '5x2_dom_seg') {
      newShifts[0] = 'F';
      newShifts[6] = 'F';
      newHours[0] = undefined;
      newHours[6] = undefined;
    } else if (preset === '6x1_dom') {
      newShifts[6] = 'F';
      newHours[6] = undefined;
    }

    setWeekEditorShifts(newShifts);
    setWeekEditorCustomHours(newHours);
  };

  // Preencher escala 5x2 automática balanceada
  const handleGenerateAutomatic = () => {
    const autoShifts = generateAutomaticSchedule(employees, weekOffset);
    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: {
        ...schedule.shifts,
        ...autoShifts,
      },
    };
    onSaveDraft(updatedSchedule);
  };

  const targetQuickEmp = quickEditor
    ? employees.find(e => e.id === quickEditor.employeeId)
    : null;

  // SE A ESCALA DESTA SEMANA AINDA NÃO FOI CRIADA
  if (!isScheduleCreated) {
    const activeStaff = employees.filter(e => e.status === 'active');
    return (
      <div className="flex flex-col gap-4 pb-10">
        {/* Barra Superior com Navegador de Semanas */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Gerenciar Escalas
              </span>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Planejamento Semanal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1 rounded-2xl">
              <button
                onClick={() => onChangeWeekOffset(-1)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700 transition-all active:scale-90 shadow-2xs"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col px-3 text-center min-w-[170px]">
                <span className="text-xs font-black text-slate-900 leading-tight">
                  {weekHeader.monthTitle}
                </span>
                <span className="text-[11px] text-blue-700 font-bold leading-tight mt-0.5">
                  {weekHeader.weekSubtitle}
                </span>
              </div>
              <button
                onClick={() => onChangeWeekOffset(1)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700 transition-all active:scale-90 shadow-2xs"
                title="Próxima semana"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {weekOffset !== 0 && (
              <button
                onClick={onResetWeekOffset}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline px-1.5"
              >
                Semana atual
              </button>
            )}
          </div>
        </section>

        {/* Card Principal: Criar Escala da Semana */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-xs flex flex-col items-center text-center gap-5">
          {activeStaff.length === 0 ? (
            <div className="flex flex-col items-center gap-3 max-w-md py-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Nenhum colaborador cadastrado ainda
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Para criar a escala da semana, cadastre primeiro os membros da sua equipe na área de <strong>Ajustes → Convidar colaborador</strong>.
              </p>
              <p className="text-[11px] text-slate-400">
                Ao cadastrá-los em Ajustes, ao clicar em <strong>Criar escala</strong> o sistema buscará automaticamente todos os colaboradores da equipe para a montagem semanal.
              </p>
              {onNavigateToAjustes && (
                <button
                  type="button"
                  onClick={onNavigateToAjustes}
                  className="mt-2 h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ir para Ajustes e Convidar Colaborador</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 max-w-xl py-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <CalendarPlus className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold inline-block mx-auto">
                  {weekHeader.monthTitle} • {weekHeader.weekSubtitle}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
                  Criar Escala da Semana
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Clique no botão abaixo para carregar automaticamente os <strong>{activeStaff.length} colaboradores cadastrados em Ajustes</strong> e organizar as folgas e horários da semana.
                </p>
              </div>

              {/* Lista dos Colaboradores que Serão Carregados Automaticamente */}
              <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Colaboradores que serão carregados:
                  </span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                    {activeStaff.length} cadastrados
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pt-1">
                  {activeStaff.map(emp => (
                    <div
                      key={emp.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center gap-2.5 shadow-2xs"
                    >
                      <div className={`w-8 h-8 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {emp.initials}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {formatNameAndSurname(emp.name)}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                          <span className="truncate">{emp.team || 'Operações'}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-800 font-bold whitespace-nowrap">{emp.workHours || '08:00 às 17:00'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de Criação */}
              <div className="flex items-center justify-center pt-2">
                {onCreateSchedule && (
                  <button
                    type="button"
                    onClick={onCreateSchedule}
                    className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Criar Escala da Semana</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* ==============================================================
          1. BARRA SUPERIOR CONSOLIDADA: NAVEGAÇÃO, FILTROS E AÇÕES
          ============================================================== */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        {/* Linha 1: Título, Navegação da Semana e Status */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Quadro de Escalas
                </h1>
                {schedule.isPublished ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Publicada
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Rascunho
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Clique nos dias para definir as folgas e horários da equipe com 1 clique
              </span>
            </div>
          </div>

          {/* Navegador de Semanas */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1 rounded-2xl">
              <button
                onClick={() => onChangeWeekOffset(-1)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700 transition-all active:scale-90 shadow-2xs"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col px-3 text-center min-w-[170px]">
                <span className="text-xs font-black text-slate-900 leading-tight">
                  {weekHeader.monthTitle}
                </span>
                <span className="text-[11px] text-blue-700 font-bold leading-tight mt-0.5">
                  {weekHeader.weekSubtitle}
                </span>
              </div>
              <button
                onClick={() => onChangeWeekOffset(1)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700 transition-all active:scale-90 shadow-2xs"
                title="Próxima semana"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {weekOffset !== 0 && (
              <button
                onClick={onResetWeekOffset}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline px-1.5"
              >
                Semana atual
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Filtro de Equipe + Botões Principais */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Seletor de Equipes */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 flex-shrink-0 pr-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Equipe:
            </span>
            <button
              onClick={() => setSelectedTeam('todas')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                selectedTeam === 'todas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({employees.filter(e => e.status === 'active').length})
            </button>
            {distinctTeams.map(team => {
              const isSelected = selectedTeam === team;
              const count = employees.filter(e => e.status === 'active' && e.team === team).length;
              return (
                <button
                  key={team}
                  onClick={() => setSelectedTeam(team)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {team} ({count})
                </button>
              );
            })}
          </div>

          {/* Botões de Ação do Administrador */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSaveDraft(schedule)}
              className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-slate-600" />
              <span>Salvar Rascunho</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>Publicar Escala</span>
            </button>
          </div>
        </div>
      </section>

      {/* ==============================================================
          2. QUADRO VISUAL DE PLANEJAMENTO DA EQUIPE (A GRADE)
          ============================================================== */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Nenhum colaborador encontrado para a equipe selecionada
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Não há colaboradores ativos na equipe &quot;{selectedTeam}&quot;. Alterne o filtro para ver os demais membros.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedTeam('todas')}
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
              >
                Ver Todas as Equipes
              </button>
              {onNavigateToAjustes && (
                <button
                  type="button"
                  onClick={onNavigateToAjustes}
                  className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold transition-all"
                >
                  Ir para Ajustes
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 w-56">
                    Colaborador
                  </th>

                  {days.map((day) => (
                    <th
                      key={day.fullDate}
                      className={`py-2 px-1 text-center ${
                        day.isHoliday
                          ? 'bg-purple-50/70 border-x border-purple-200 text-purple-950 rounded-t-xl'
                          : day.isWeekend
                          ? 'bg-blue-50/30 text-blue-900'
                          : 'text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center py-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          {day.name}
                        </span>
                        <span className="text-sm font-black text-slate-900">
                          {day.dayNumber}
                        </span>
                        {day.isHoliday && (
                          <span className="text-[8px] font-black uppercase text-purple-700 bg-purple-200/80 px-1 rounded mt-0.5 whitespace-nowrap">
                            Feriado
                          </span>
                        )}
                      </div>
                    </th>
                  ))}

                  <th className="py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 w-28">
                    Resumo
                  </th>

                  <th className="py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 w-28">
                    Ajustar
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                  const empShifts = schedule.shifts[emp.id] || Array(7).fill('T');
                  const summary = calculateEmployeeSummary(empShifts);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Coluna 1: Colaborador */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs`}
                          >
                            {emp.initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {formatNameAndSurname(emp.name)}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {emp.role} {emp.team ? `• ${emp.team}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Colunas 2 a 8: Os 7 Dias da Semana */}
                      {days.map((day, dayIdx) => {
                        const status = empShifts[dayIdx] || 'T';
                        const dayHours = getEmployeeDayHours(schedule, emp, dayIdx);

                        return (
                          <td key={day.fullDate} className="p-1 text-center">
                            {/* Bloco Interativo do Dia: 1 clique altera entre Trabalho e Folga */}
                            <div
                              onClick={(e) => handleQuickToggleShift(e, emp, dayIdx)}
                              className={`group relative w-full min-h-[58px] p-2 rounded-2xl border text-center flex flex-col items-center justify-center cursor-pointer select-none transition-all active:scale-95 shadow-2xs ${
                                status === 'F'
                                  ? 'bg-rose-50 hover:bg-rose-100/90 border-rose-200/90 text-rose-700 hover:ring-2 hover:ring-rose-300'
                                  : status === 'AUSENTE'
                                  ? 'bg-amber-50 hover:bg-amber-100/90 border-amber-200 text-amber-800'
                                  : day.isHoliday
                                  ? 'bg-purple-50/80 hover:bg-purple-100/90 border-purple-200 text-purple-950'
                                  : 'bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-200/90 text-emerald-950 hover:ring-2 hover:ring-emerald-300'
                              }`}
                              title={
                                status === 'F'
                                  ? 'Folga definida (clique para mudar para Trabalho)'
                                  : 'Trabalho definido (clique para mudar para Folga)'
                              }
                            >
                              {/* Botão sutil para ajustar horário específico deste dia */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenQuickEditor(emp, dayIdx);
                                }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-2xs flex items-center justify-center"
                                title="Ajustar horário específico deste dia"
                              >
                                <Clock className="w-2.5 h-2.5" />
                              </button>

                              {/* Conteúdo Visual da Célula */}
                              {status === 'F' ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-black text-rose-700 uppercase tracking-wide">
                                    Folga
                                  </span>
                                  <span className="text-[9px] font-semibold text-rose-500">
                                    {day.isHoliday ? 'Feriado' : 'Descanso'}
                                  </span>
                                </div>
                              ) : status === 'AUSENTE' ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-black text-amber-700">
                                    Ausente
                                  </span>
                                  <span className="text-[9px] font-semibold text-amber-600">
                                    Atestado
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-black uppercase text-emerald-700 tracking-tight">
                                      Trab.
                                    </span>
                                    {day.isHoliday && (
                                      <span className="text-[7px] font-black uppercase text-purple-700 bg-purple-200/80 px-1 rounded">
                                        Fer.
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs font-black text-slate-900 whitespace-nowrap mt-0.5">
                                    {dayHours.replace('às', '–')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Coluna 9: Resumo Semanal */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-black text-slate-800">
                            {summary.workCount} Dias • {summary.offCount} Folgas
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {summary.workCount * 8}h sem.
                          </span>
                        </div>
                      </td>

                      {/* Coluna 10: Ajustar Horários */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEmployeeWeekEditor(emp)}
                          className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          title="Ajustar horários da semana deste colaborador"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                          <span>Ajustar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Rodapé com Total em Trabalho */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/70">
                  <td className="py-3 px-3 text-xs font-bold text-slate-700">
                    Total em Trabalho
                  </td>
                  {dailyCoverage.map((cov, idx) => (
                    <td key={idx} className="p-1 text-center">
                      <span className="text-[11px] font-bold px-2 py-1 rounded-xl block bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        {cov.workingCount} trab.
                      </span>
                    </td>
                  ))}
                  <td className="text-center text-[10px] font-bold text-slate-400">
                    -
                  </td>
                  <td className="text-center text-xs text-slate-400">
                    -
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ==============================================================
          3. MODAL DE AJUSTE RÁPIDO DO DIA (1 CLIQUE)
          ============================================================== */}
      {quickEditor && targetQuickEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl flex flex-col gap-4">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Configurar Dia
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {formatNameAndSurname(targetQuickEmp.name)} • {days[quickEditor.dayIndex]?.name} ({days[quickEditor.dayIndex]?.formattedDate})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditor(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternância Rápida: Trabalho / Folga / Ausência */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSaveQuickEditor('T')}
                className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                  quickEditor.status === 'T'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Trabalho</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveQuickEditor('F')}
                className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                  quickEditor.status === 'F'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>Folga</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveQuickEditor('AUSENTE')}
                className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                  quickEditor.status === 'AUSENTE'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Ausência</span>
              </button>
            </div>

            {/* Configuração de Horários (caso esteja em trabalho) */}
            {quickEditor.status === 'T' && (
              <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-950">
                  Horário do Turno:
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Entrada
                    </label>
                    <input
                      type="time"
                      value={quickEditor.entryTime}
                      onChange={e =>
                        setQuickEditor({
                          ...quickEditor,
                          entryTime: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Saída
                    </label>
                    <input
                      type="time"
                      value={quickEditor.exitTime}
                      onChange={e =>
                        setQuickEditor({
                          ...quickEditor,
                          exitTime: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Chips de Horários Frequentes */}
                <div className="flex flex-col gap-1 pt-1 border-t border-emerald-200/60">
                  <span className="text-[10px] font-bold text-emerald-900">
                    Sugestões de turno:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_SHIFTS.map(cs => (
                      <button
                        key={cs.label}
                        type="button"
                        onClick={() => handleSaveQuickEditor('T', cs.entry, cs.exit)}
                        className="px-2 py-1 rounded-lg bg-white border border-emerald-300 text-[10px] font-bold text-emerald-900 hover:bg-emerald-100 transition-colors"
                      >
                        {cs.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Opção para aplicar a todos os dias úteis */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={quickEditor.applyToAllWorkDays || false}
                    onChange={e =>
                      setQuickEditor(prev =>
                        prev ? { ...prev, applyToAllWorkDays: e.target.checked } : null
                      )
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-700 font-medium">
                    Aplicar este horário a todos os dias de trabalho deste colaborador
                  </span>
                </label>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickEditor(null)}
                className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuickEditor(quickEditor.status)}
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          4. MODAL DE AJUSTE SEMANAL COMPLETO DO COLABORADOR
          ============================================================== */}
      {editingEmployeeWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto my-auto">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Ajustar Semana: {formatNameAndSurname(editingEmployeeWeek.name)}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {weekHeader.monthTitle} • {weekHeader.weekSubtitle}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployeeWeek(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Rápidos */}
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-blue-900 uppercase">
                Atalhos rápidos para a semana:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPresetToWeek('5x2_sab_dom')}
                  className="px-2.5 py-1 rounded-xl bg-white border border-blue-300 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors shadow-2xs"
                >
                  Folga Sáb/Dom
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetToWeek('5x2_dom_seg')}
                  className="px-2.5 py-1 rounded-xl bg-white border border-blue-300 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors shadow-2xs"
                >
                  Folga Dom/Seg
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetToWeek('6x1_dom')}
                  className="px-2.5 py-1 rounded-xl bg-white border border-blue-300 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors shadow-2xs"
                >
                  Folga no Domingo
                </button>
              </div>
            </div>

            {/* Lista dos 7 dias */}
            <div className="flex flex-col gap-2 divide-y divide-slate-100">
              {days.map((day, idx) => {
                const status = weekEditorShifts[idx] || 'T';
                const currentHours =
                  weekEditorCustomHours[idx] ||
                  editingEmployeeWeek.workHours ||
                  '08:00 às 17:00';

                let entryVal = '08:00';
                let exitVal = '17:00';
                if (currentHours.includes('às')) {
                  const parts = currentHours.split('às').map(p => p.trim());
                  if (parts[0]) entryVal = parts[0];
                  if (parts[1]) exitVal = parts[1];
                }

                return (
                  <div
                    key={day.fullDate}
                    className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center">
                        {day.dayNumber}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">
                          {day.name}
                        </span>
                        {day.isHoliday && (
                          <span className="text-[8px] font-bold text-purple-700 bg-purple-100 px-1 rounded">
                            {day.holidayName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...weekEditorShifts];
                          updated[idx] = 'T';
                          setWeekEditorShifts(updated);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          status === 'T'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                        }`}
                      >
                        Trabalho
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...weekEditorShifts];
                          updated[idx] = 'F';
                          setWeekEditorShifts(updated);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          status === 'F'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                        }`}
                      >
                        Folga
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...weekEditorShifts];
                          updated[idx] = 'AUSENTE';
                          setWeekEditorShifts(updated);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          status === 'AUSENTE'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                        }`}
                      >
                        Ausente
                      </button>
                    </div>

                    {status === 'T' ? (
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <Clock className="w-3 h-3 text-emerald-700" />
                        <input
                          type="time"
                          value={entryVal}
                          onChange={e => {
                            const updated = [...weekEditorCustomHours];
                            updated[idx] = `${e.target.value} às ${exitVal}`;
                            setWeekEditorCustomHours(updated);
                          }}
                          className="bg-white border border-slate-200 rounded px-1 text-xs font-bold text-slate-800"
                        />
                        <span className="text-xs text-emerald-900 font-bold">às</span>
                        <input
                          type="time"
                          value={exitVal}
                          onChange={e => {
                            const updated = [...weekEditorCustomHours];
                            updated[idx] = `${entryVal} às ${e.target.value}`;
                            setWeekEditorCustomHours(updated);
                          }}
                          className="bg-white border border-slate-200 rounded px-1 text-xs font-bold text-slate-800"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 italic">
                        Sem expediente
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-600">
                Total: <strong>{weekEditorShifts.filter(s => s === 'T').length}</strong> dias de trabalho, <strong>{weekEditorShifts.filter(s => s === 'F').length}</strong> folgas.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployeeWeek(null)}
                  className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmployeeWeek}
                  className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Salvar Programação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          5. MODAL: ADICIONAR / EDITAR DADOS DO COLABORADOR
          ============================================================== */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingEmployeeData ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeForm} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nome e Sobrenome
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  placeholder="Ex: Carlos Mendes"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  required
                  value={empRole}
                  onChange={e => setEmpRole(e.target.value)}
                  placeholder="Ex: Operador de Loja"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Equipe / Setor
                </label>
                <input
                  type="text"
                  required
                  value={empTeam}
                  onChange={e => setEmpTeam(e.target.value)}
                  placeholder="Ex: Operações de Loja, Vendas, Estoque..."
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Horário de Trabalho */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Horário Habitual</span>
                  </label>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                    {empStartTime} às {empEndTime}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Entrada
                    </label>
                    <input
                      type="time"
                      required
                      value={empStartTime}
                      onChange={e => setEmpStartTime(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Saída
                    </label>
                    <input
                      type="time"
                      required
                      value={empEndTime}
                      onChange={e => setEmpEndTime(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Colaborador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          6. MODAL: CONFIRMAR EXCLUSÃO DE COLABORADOR
          ============================================================== */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-900">
                  Excluir Colaborador?
                </h3>
                <span className="text-[11px] text-slate-500">
                  {formatNameAndSurname(employeeToDelete.name)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza de que deseja excluir <strong>{formatNameAndSurname(employeeToDelete.name)}</strong>? Este colaborador será removido do quadro de escalas e da equipe.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteEmployee && employeeToDelete) {
                    onDeleteEmployee(employeeToDelete.id);
                  }
                  setEmployeeToDelete(null);
                }}
                className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          7. MODAL DE CONFERÊNCIA E PUBLICAÇÃO OFICIAL
          ============================================================== */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto my-auto">
            {/* Cabeçalho */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-black text-slate-900">
                  Conferência e Publicação da Escala
                </h3>
                <span className="text-xs text-slate-500">
                  {weekHeader.monthTitle} • {weekHeader.weekSubtitle}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Confira abaixo o resumo da programação antes de publicar. Ao confirmar, todos os colaboradores terão acesso imediato aos seus turnos e folgas.
            </p>

            {/* Tabela de Resumo por Colaborador */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2 max-h-56 overflow-y-auto">
              <span className="text-xs font-bold text-slate-800">
                Resumo por Colaborador ({filteredEmployees.length} ativos):
              </span>
              <div className="flex flex-col gap-1.5 divide-y divide-slate-200/60 text-xs">
                {filteredEmployees.map(emp => {
                  const empShifts = schedule.shifts[emp.id] || Array(7).fill('T');
                  const summary = calculateEmployeeSummary(empShifts);
                  const offDays = days
                    .filter((_, idx) => empShifts[idx] === 'F')
                    .map(d => d.name)
                    .join(', ');

                  return (
                    <div key={emp.id} className="pt-1.5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {formatNameAndSurname(emp.name)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Folgas: {offDays || 'Nenhuma folga definida'}
                        </span>
                      </div>
                      <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                        {summary.workCount} Trab. / {summary.offCount} Folga
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerta de Feriados ou Cobertura */}
            {weekHolidays.length > 0 && (
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex flex-col gap-0.5">
                <span className="font-bold">
                  Feriado nesta semana: {weekHolidays.map(h => `${h.dayNumber} (${h.holidayName})`).join(', ')}
                </span>
                <span className="text-[11px] text-purple-800">
                  Lembre-se de prever folga compensatória ou adicional de 100% para os colaboradores escalados.
                </span>
              </div>
            )}

            {belowCoverageDays.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Existem dias com contingente abaixo de {settings.minStaffPerDay} pessoas.</span>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Voltar e Ajustar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPublishModalOpen(false);
                  onPublishSchedule(schedule);
                }}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Confirmar e Publicar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}